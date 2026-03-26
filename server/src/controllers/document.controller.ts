import { Request, Response, NextFunction } from 'express';
import DocumentMeta from '../models/DocumentMeta';
import { extractTextFromPDF, processDocumentAndStore } from '../services/document.service';
import fs from 'fs';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded.' });
            return;
        }

        const { title, department } = req.body;
        if (!title) {
             res.status(400).json({ error: 'Title is required in the request body.' });
             return;
        }

        // Generate a collection name based on title or use a generic one like "global_knowledge"
        // For department-wide sorting, let's use global collection and filter by metadata later
        const chromaCollectionName = 'college_documents';

        // 1. Extract text from the temporary PDF
        const text = await extractTextFromPDF(req.file.path);

        // 2. Chunk and embed
        const chunkCount = await processDocumentAndStore(text, title, chromaCollectionName);

        // 3. Save metadata to MongoDB
        const documentMeta = new DocumentMeta({
            title,
            department: department || 'General',
            chromaCollectionRef: chromaCollectionName,
        });
        await documentMeta.save();

        // 4. Cleanup the temp file
        fs.unlinkSync(req.file.path);

        res.status(201).json({
            message: 'Document uploaded and processed successfully.',
            documentMeta,
            chunksGenerated: chunkCount,
        });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: 'Failed to process document.' });
    }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const docs = await DocumentMeta.find().sort({ uploadedAt: -1 });
        res.status(200).json(docs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve documents.' });
    }
};
