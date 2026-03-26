import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { addDocumentsToChroma } from './vectorstore.service';
import { generateEmbeddings } from './llm.service';

/**
 * Extracts raw text from a PDF or TXT file using the v2.4.5 PDFParse class API.
 */
export const extractTextFromPDF = async (filePath: string): Promise<string> => {
    if (filePath.toLowerCase().endsWith('.txt')) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    try {
        const dataBuffer = fs.readFileSync(filePath);
        
        // v2.4+ uses an object-oriented API
        const parser = new PDFParse({ data: dataBuffer });
        const textResult = await parser.getText({
             // Ensures we process all pages
             first: 1,
             last: undefined
        });

        if (!textResult.text || textResult.text.trim().length === 0) {
            throw new Error('PDF has no extractable text — may be a scanned/image-only PDF.');
        }

        // --- DEBUG FEATURE ---
        // Save the raw extracted text so we can verify the parse quality
        const debugPath = `${filePath}_extracted_debug.txt`;
        fs.writeFileSync(debugPath, textResult.text);
        console.log(`[DocumentService] 📝 Saved extracted text for inspection at: ${debugPath}`);
        // ---------------------

        console.log(`[DocumentService] Extracted text: ${textResult.text.length} chars.`);
        return textResult.text;
    } catch (error: any) {
        console.error('[DocumentService] PDF parse error:', error?.message);
        throw new Error(error?.message || 'Failed to parse PDF document.');
    }
}

/**
 * Splits text into logical chunks and stores them in ChromaDB.
 */
export const processDocumentAndStore = async (text: string, title: string, collectionName: string) => {
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    try {
        const chunks = await textSplitter.splitText(text);
        console.log(`[DocumentService] Total chunks for "${title}": ${chunks.length}`);

        // Use a timestamp prefix so re-uploads don't collide with old IDs in ChromaDB
        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
        const uploadId = `${safeTitle}_${Date.now()}`;

        // Outer loop: process ChromaDB in batches of 50
        const CHROMA_BATCH = 50;
        // Inner loop: NVIDIA API can handle ~10 texts per call reliably without token overflow
        const EMBED_BATCH = 10;

        for (let i = 0; i < chunks.length; i += CHROMA_BATCH) {
            const batchChunks = chunks.slice(i, i + CHROMA_BATCH);
            const allEmbeddings: number[][] = [];

            // Call NVIDIA embedding API in small sub-batches of 10
            for (let j = 0; j < batchChunks.length; j += EMBED_BATCH) {
                const subBatch = batchChunks.slice(j, j + EMBED_BATCH);
                const subEmbeddings = await generateEmbeddings(subBatch);
                allEmbeddings.push(...subEmbeddings);
            }

            const batchIds = batchChunks.map((_, idx) => `${uploadId}_chunk_${i + idx}`);
            const batchMetadatas = batchChunks.map((_, idx) => ({
                source: title,
                chunkIndex: i + idx
            }));

            await addDocumentsToChroma(collectionName, batchIds, allEmbeddings, batchChunks, batchMetadatas);
            console.log(`[DocumentService] Stored ${Math.min(i + CHROMA_BATCH, chunks.length)}/${chunks.length} chunks`);
        }

        console.log(`[DocumentService] ✅ Completed all uploads for: ${title}`);
        return chunks.length;

    } catch (error: any) {
        console.error(`[DocumentService] ❌ Fatal error processing "${title}":`, error?.message || error);
        throw error;
    }
}
