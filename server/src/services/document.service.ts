import fs from 'fs';
const pdfParse = require('pdf-parse');
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { addDocumentsToChroma } from './vectorstore.service';
import { generateEmbeddings } from './llm.service';

/**
 * Extracts raw text from a PDF file using pdf-parse.
 */
export const extractTextFromPDF = async (filePath: string): Promise<string> => {
    try {
        if (filePath.toLowerCase().endsWith('.txt')) {
             return fs.readFileSync(filePath, 'utf-8');
        }
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        throw new Error("Failed to parse PDF document.");
    }
}

/**
 * Splits text into logical chunks and stores them in ChromaDB.
 */
export const processDocumentAndStore = async (text: string, title: string, collectionName: string) => {
    // Basic text splitting configuration
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    try {
        // Chunk the text
        const chunks = await textSplitter.splitText(text);

        // We prepare IDs and Metadatas for each chunk
        const ids = chunks.map((_, i) => `${title.replace(/\s+/g, '_')}_chunk_${i}`);
        const metadatas = chunks.map((_, i) => ({
             source: title,
             chunkIndex: i
        }));

        // Generate real embeddings via NVIDIA NIM API
        const embeddings = await generateEmbeddings(chunks);

        // Store into Vector Database
        await addDocumentsToChroma(collectionName, ids, embeddings, chunks, metadatas);
        
        console.log(`Successfully processed and stored ${chunks.length} chunks for document: ${title}`);
        return chunks.length;

    } catch (error) {
        console.error("Error splitting or storing document chunks:", error);
        throw error;
    }
}
