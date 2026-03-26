import fs from 'fs';
import { pdfToPng } from 'pdf-to-png-converter';
import axios from 'axios';
import sharp from 'sharp';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { addDocumentsToChroma } from './vectorstore.service';
import { generateEmbeddings } from './llm.service';
import PDFParser from 'pdf2json';

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
                    .replace(/----------------Page \(\d+\) Break----------------/g, '\n')
                    .replace(/\n{3,}/g, '\n\n').trim();
                resolve(cleaned);
            } catch { resolve(''); }
        });
        parser.on('pdfParser_dataError', () => { clearTimeout(timeout); resolve(''); });
        parser.loadPDF(filePath);
    });
};

// ─── Nvidia Nemotron OCR (fast ~2s/page, for scanned/image PDFs) ──────────────
const extractWithNemotronOCR = async (filePath: string, apiKey: string): Promise<string> => {
    const OCR_URL = 'https://ai.api.nvidia.com/v1/cv/nvidia/nemotron-ocr-v1';

    // Render at 0.5x for readable text, then compress PNG→JPEG to stay under 180KB b64 limit
    const pages = await pdfToPng(filePath, { viewportScale: 0.5, disableFontFace: true });
    console.log(`[OCR] Rendered ${pages.length} pages at 0.5x. Compressing & scanning...`);

    let fullText = '';

    for (let i = 0; i < pages.length; i++) {
        const content = pages[i].content;
        if (!content) continue;

        // Convert PNG → JPEG quality 50 (reduces ~414KB PNG → ~31KB JPEG)
        const jpegBuf = await sharp(content).jpeg({ quality: 50 }).toBuffer();
        const b64 = jpegBuf.toString('base64');
        const sizeKB = Math.round(b64.length / 1024);

        console.log(`[OCR] Page ${i + 1}/${pages.length} (${sizeKB}KB)...`);

        try {
            const res = await axios.post(OCR_URL, {
                input: [{ type: 'image_url', url: `data:image/jpeg;base64,${b64}` }]
            }, {
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
                timeout: 15000
            });

            // text_prediction is { text: string, confidence: number } — confirmed via live API debug
            const detections: any[] = res.data?.data?.[0]?.text_detections || [];
            const pageText = detections.map((d: any) => d.text_prediction?.text || '').join(' ').trim();
            console.log(`[OCR]   └─ ${pageText.length} chars`);
            fullText += `\n--- PAGE ${i + 1} ---\n${pageText}\n`;
        } catch (err: any) {
            console.error(`[OCR] Page ${i + 1} failed:`, err?.response?.data || err.message);
            fullText += `\n--- PAGE ${i + 1} ---\n[OCR failed]\n`;
        }

        // Small cooldown to avoid rate limiting
        if (i < pages.length - 1) await new Promise(r => setTimeout(r, 600));
    }

    return fullText;
};

// ─── Main export: hybrid extractor ────────────────────────────────────────────
export const extractTextFromPDF = async (filePath: string): Promise<string> => {
    if (filePath.toLowerCase().endsWith('.txt')) return fs.readFileSync(filePath, 'utf-8');

    console.log(`[Extractor] Processing: ${filePath}`);

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
    meta: { className?: string; department?: string; subject?: string; module?: string } = {}
) => {
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

    try {
        const chunks = await splitter.splitText(text);
        console.log(`[DocumentService] ${chunks.length} chunks for "${title}"`);

        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
        const uploadId = `${safeTitle}_${Date.now()}`;

        for (let i = 0; i < chunks.length; i += 50) {
            const batch = chunks.slice(i, i + 50);
            const embeddings: number[][] = [];

            for (let j = 0; j < batch.length; j += 10) {
                const sub = batch.slice(j, j + 10);
                const emb = await generateEmbeddings(sub);
                embeddings.push(...emb);
            }

            const ids = batch.map((_, idx) => `${uploadId}_chunk_${i + idx}`);
            const metas = batch.map((_, idx) => ({
                source: title, chunkIndex: i + idx,
                className: meta.className || 'Global',
                department: meta.department || 'Global',
                subject: meta.subject || '', module: meta.module || ''
            }));

            await addDocumentsToChroma(collectionName, ids, embeddings, batch, metas);
            console.log(`[DocumentService] Stored ${Math.min(i + 50, chunks.length)}/${chunks.length} chunks`);
        }

        console.log(`[DocumentService] ✅ Done: "${title}"`);
        return chunks.length;

    } catch (error: any) {
        console.error(`[DocumentService] ❌ Error for "${title}":`, error?.message);
        throw error;
    }
};
