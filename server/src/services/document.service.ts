import fs from 'fs';
import { pdfToPng } from 'pdf-to-png-converter';
import axios from 'axios';
import sharp from 'sharp';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { addDocumentsToChroma } from './vectorstore.service';
import { generateEmbeddings, EXPECTED_EMBEDDING_DIM } from './llm.service';
import PDFParser from 'pdf2json';
import mammoth from 'mammoth';

// ─── Collection naming utility ─────────────────────────────────────────────────
// One ChromaDB collection per (department, subject) pair — instead of a single
// flat "college_documents" collection. Gives ChromaDB-level isolation so queries
// are fast, precise, and never bleed across subjects.
//
// Format: {dept_slug}__{subject_slug}  e.g. "cse__data_structures"
// The double-underscore separator makes the two parts unambiguous.
export const buildCollectionName = (department: string, subject: string): string => {
    const slug = (s: string) =>
        (s || '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 30);

    const dept = slug(department) || 'global';
    const subj = slug(subject)     || 'general';
    // ChromaDB collection names must be valid identifiers — no spaces, start with letter
    return `${dept}__${subj}`;
};

// ─── Text layer extraction (works for digital/typed PDFs) ─────────────────────
const extractTextLayer = (filePath: string): Promise<string> => {
    return new Promise((resolve) => {
        const parser = new (PDFParser as any)(null, true);
        const timeout = setTimeout(() => resolve(''), 30000);
        parser.on('pdfParser_dataReady', () => {
            clearTimeout(timeout);
            try {
                const raw: string = parser.getRawTextContent();
                const cleaned = raw
                    .replace(/----------------Page \((\d+)\) Break----------------/g, '\n--- PAGE $1 ---\n')
                    .replace(/\n{3,}/g, '\n\n').trim();
                resolve(cleaned);
            } catch { resolve(''); }
        });
        parser.on('pdfParser_dataError', () => { clearTimeout(timeout); resolve(''); });
        parser.loadPDF(filePath);
    });
};

// ─── Word extraction (.docx) ──────────────────────────────────────────────────
const extractTextFromDocx = async (filePath: string): Promise<string> => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (err: any) {
        console.error(`[DocxExtractor] Failed:`, err.message);
        throw new Error('Failed to extract text from DOCX.');
    }
};

// ─── Nvidia Nemotron OCR (fast ~2s/page, for scanned/image PDFs) ──────────────
const pdfParse = require('pdf-parse');

const extractWithNemotronOCR = async (filePath: string, apiKey: string): Promise<string> => {
    const OCR_URL = 'https://ai.api.nvidia.com/v1/cv/nvidia/nemotron-ocr-v1';

    // ── Ultra Memory Safe Logic ──────────────────────────────────────────
    // 1. Get total page count WITHOUT rendering (very low memory)
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const numPages = pdfData.numpages || 1;
    console.log(`[OCR] Target: ${numPages} pages. Starting page-by-page render to avoid OOM.`);

    let fullText = '';

    // 2. Process each page INDIVIDUALLY
    for (let i = 1; i <= numPages; i++) {
        console.log(`[OCR] Processing Page ${i}/${numPages}...`);
        
        try {
            // Render ONLY this specific page. Using 'any' to bypass restrictive type defs
            // as some versions of the lib support the 'pages' or 'pageNumbers' prop at runtime.
            const options: any = { 
                pages: [i], 
                viewportScale: 0.4, 
                disableFontFace: true 
            };
            const pages = await pdfToPng(filePath, options);

            if (pages.length > 0 && pages[0].content) {
                const content = pages[0].content;

                // Compress PNG -> JPEG (Small payload = stable heap)
                const jpegBuf = await sharp(content).jpeg({ quality: 35 }).toBuffer();
                const b64 = jpegBuf.toString('base64');

                const res = await axios.post(OCR_URL, {
                    input: [{ type: 'image_url', url: `data:image/jpeg;base64,${b64}` }]
                }, {
                    headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
                    timeout: 25000
                });

                const detections: any[] = res.data?.data?.[0]?.text_detections || [];
                const pageText = detections.map((d: any) => d.text_prediction?.text || '').join(' ').trim();
                fullText += `\n--- PAGE ${i} ---\n${pageText}\n`;
                
                // CRITICAL: Explicitly nullify to help heap cleanup
                (pages[0] as any).content = null;
            }
        } catch (err: any) {
            console.error(`[OCR] ❌ Page ${i} failed:`, err.message);
            fullText += `\n--- PAGE ${i} ---\n[Scan failed]\n`;
        }

        // Delay to allow GC to sweep
        await new Promise(r => setTimeout(r, 1200));
    }

    return fullText;
};

// ─── Main export: hybrid extractor ────────────────────────────────────────────
export const extractTextFromFile = async (filePath: string): Promise<string> => {
    const ext = filePath.toLowerCase();
    
    if (ext.endsWith('.txt')) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    
    if (ext.endsWith('.docx')) {
        return await extractTextFromDocx(filePath);
    }

    const isImage = ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png');

    if (isImage) {
        console.log(`[Extractor] Processing Image with OCR: ${filePath}`);
        const apiKey = process.env.NVIDIA_API_KEY;
        if (!apiKey) throw new Error('NVIDIA_API_KEY missing in .env');

        // We can reuse extractWithNemotronOCR for images too, as it uses pdf-to-png logic
        // But for a single image, we can just read the file directly
        const imageBuf = fs.readFileSync(filePath);
        // Compress and encode
        const jpegBuf = await sharp(imageBuf).jpeg({ quality: 50 }).toBuffer();
        const b64 = jpegBuf.toString('base64');
        
        const OCR_URL = 'https://ai.api.nvidia.com/v1/cv/nvidia/nemotron-ocr-v1';
        const res = await axios.post(OCR_URL, {
            input: [{ type: 'image_url', url: `data:image/jpeg;base64,${b64}` }]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`, 'Accept': 'application/json' },
            timeout: 15000
        });

        const detections: any[] = res.data?.data?.[0]?.text_detections || [];
        const text = detections.map((d: any) => d.text_prediction?.text || '').join(' ').trim();
        
        if (!text) throw new Error('Image OCR found no text.');
        return text;
    }

    console.log(`[Extractor] Processing PDF: ${filePath}`);

    // 1. Try text layer first (instant, free, handles digital PDFs perfectly)
    const textLayer = await extractTextLayer(filePath);
    if (textLayer.length > 300) {
        console.log(`[Extractor] ✅ Text layer: ${textLayer.length} chars. No OCR needed.`);
        fs.writeFileSync(`${filePath}_extracted_debug.txt`, textLayer);
        return textLayer;
    }

    // 2. Scanned PDF — use Nemotron OCR (~2s/page, fast and reliable)
    console.log(`[Extractor] Text layer empty. Using Nemotron OCR...`);
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error('NVIDIA_API_KEY missing in .env');

    const ocrText = await extractWithNemotronOCR(filePath, apiKey);
    const meaningful = ocrText.replace(/--- PAGE \d+ ---/g, '').replace(/\[OCR failed\]/g, '').trim();

    if (!meaningful) throw new Error('OCR found no text. PDF may be corrupted or purely graphical.');

    fs.writeFileSync(`${filePath}_extracted_debug.txt`, ocrText);
    console.log(`[Extractor] ✅ OCR complete: ${meaningful.length} chars.`);
    return ocrText;
};

// ─── Chunk text and store in ChromaDB ─────────────────────────────────────────
export const processDocumentAndStore = async (
    text: string,
    title: string,
    collectionName: string,
    meta: {
        className?:  string;  
        semester?:   string;  
        department?: string;  
        subject?:    string;  
        chapter?:    string;  
        section?:    string;  
        module?:     string;  
    } = {}
) => {
    // 1000 chars is ~250 words, sweet spot for Llama 3/Arynox context
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

    try {
        const rawChunks = await splitter.splitText(text);
        
        // Deduplicate identical chunks (saves storage + compute)
        const chunks = Array.from(new Set(rawChunks.filter(c => c.trim().length > 20)));
        
        if (chunks.length === 0) {
            throw new Error(`Document "${title}" yielded no meaningful content (all chunks too small or empty).`);
        }

        console.log(`[DocumentService] Processing "${title}": ${rawChunks.length} raw → ${chunks.length} deduped chunks.`);

        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
        const uploadId = `${safeTitle}_${Date.now()}`;

        // Find all page markers and their indices for faster page lookup
        const pageMarkers: { page: number, index: number }[] = [];
        const markerRegex = /--- PAGE (\d+) ---/g;
        let match;
        while ((match = markerRegex.exec(text)) !== null) {
            pageMarkers.push({ page: parseInt(match[1]), index: match.index });
        }

        const EXPECTED_DIM = EXPECTED_EMBEDDING_DIM;

        for (let i = 0; i < chunks.length; i += 50) {
            const batch = chunks.slice(i, i + 50);
            const embeddings: number[][] = [];

            // Generate embeddings in sub-batches
            for (let j = 0; j < batch.length; j += 10) {
                const sub = batch.slice(j, j + 10);
                const emb = await generateEmbeddings(sub);
                
                // Strict dimension guard
                emb.forEach((vec, idx) => {
                    if (vec.length !== EXPECTED_DIM) {
                        throw new Error(`Embedding dimension mismatch! Got ${vec.length}, expected ${EXPECTED_DIM} for sub-chunk ${idx}.`);
                    }
                });
                
                embeddings.push(...emb);
            }

            const ids = batch.map((_, idx) => `${uploadId}_chunk_${i + idx}`);

            const metas = batch.map((chunkText, idx) => {
                // Determine which page this chunk belongs to by finding the last indicator before it
                let assignedPage = 1;
                const chunkIndexInText = text.indexOf(chunkText.substring(0, 50));
                
                if (chunkIndexInText !== -1) {
                    // Find the highest page marker whose index is less than or equal to this chunk
                    const marker = [...pageMarkers].reverse().find(m => m.index <= chunkIndexInText);
                    if (marker) assignedPage = marker.page;
                }

                return {
                    source:     title,
                    chunkIndex: i + idx,
                    page:       assignedPage,
                    // ── Full academic hierarchy ────────────────────────────────
                    className:  meta.className  || 'Global',
                    semester:   meta.semester   || '',
                    department: (meta.department || 'Global').toUpperCase(),
                    subject:    meta.subject    || '',
                    chapter:    meta.chapter    || '',
                    section:    meta.section    || '',
                    module:     meta.module     || '',
                };
            });

            await addDocumentsToChroma(collectionName, ids, embeddings, batch, metas);
            console.log(`[DocumentService] Stored ${Math.min(i + 50, chunks.length)}/${chunks.length} chunks`);
            
            // Minor throttle to ensure ChromaDB ingestion doesn't spike
            if (i + 50 < chunks.length) await new Promise(r => setTimeout(r, 100));
        }

        console.log(`[DocumentService] ✅ Processing complete: "${title}" in collection "${collectionName}"`);
        return chunks.length;

    } catch (error: any) {
        console.error(`[DocumentService] ❌ Fail for "${title}":`, error?.message);
        throw error;
    }
};
