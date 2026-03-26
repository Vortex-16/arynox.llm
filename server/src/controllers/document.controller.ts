import { Request, Response, NextFunction } from 'express';
import DocumentMeta from '../models/DocumentMeta';
import { extractTextFromPDF, processDocumentAndStore } from '../services/document.service';
import { deleteDocumentFromChroma } from '../services/vectorstore.service';
import fs from 'fs';
import path from 'path';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded.' });
            return;
        }

        const { title, department, className, subject, module } = req.body;
        if (!title) {
            res.status(400).json({ error: 'Title is required in the request body.' });
            return;
        }

        // Generate a collection name based on title or use a generic one like "college_documents"
        // For department-wide sorting, let's use global collection and filter by metadata later
        const chromaCollectionName = 'college_documents';

        // 1. Extract text from the temporary PDF
        const text = await extractTextFromPDF(req.file.path);

        // 2. Chunk and embed with the new metadata tags
        const chunkCount = await processDocumentAndStore(
            text,
            title,
            chromaCollectionName,
            { className, department, subject, module }
        );

        // 3. Save metadata to MongoDB including the newly saved file path
        const documentMeta = new DocumentMeta({
            title,
            department: department || 'General',
            className: className || '1st Year',
            subject: subject || '',
            module: module || '',
            chromaCollectionRef: chromaCollectionName,
            fileUrl: `/uploads/${req.file.filename}` // Save URL for teacher portal
        });
        await documentMeta.save();

        // Note: No longer deleting the file with fs.unlinkSync because the teacher needs to view it.

        res.status(201).json({
            message: 'Document uploaded and processed successfully.',
            documentMeta,
            chunksGenerated: chunkCount,
        });
    } catch (error: any) {
        console.error("Upload Error (Full Detail):", error);
        // Cleanup the temp file if parsing failed
        if (req.file?.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (_) { }
        }
        res.status(500).json({ error: error?.message || 'Failed to process document.' });
    }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { className, department } = req.query;
        let filter: any = {};

        if (className) filter.className = className;
        if (department) filter.department = department;

        const docs = await DocumentMeta.find(filter).sort({ uploadedAt: -1 });
        res.status(200).json(docs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve documents.' });
    }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const doc = await DocumentMeta.findById(id);

        if (!doc) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        // 1. Delete actual file from uploads directory
        if (doc.fileUrl) {
            const filePath = path.join(process.cwd(), doc.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            // remove debug txt if exists
            const debugPath = `${filePath}_extracted_debug.txt`;
            if (fs.existsSync(debugPath)) {
                fs.unlinkSync(debugPath);
            }
        }

        // 2. Delete Vector Chunks from ChromaDB
        if (doc.chromaCollectionRef) {
            await deleteDocumentFromChroma(doc.chromaCollectionRef, doc.title);
        }

        // 3. Delete from MongoDB
        await doc.deleteOne();

        res.status(200).json({ message: 'Document and vectors successfully deleted' });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};
