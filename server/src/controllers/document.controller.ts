import { Request, Response, NextFunction } from 'express';
import DocumentMeta from '../models/DocumentMeta';
import { extractTextFromFile, processDocumentAndStore, buildCollectionName } from '../services/document.service';
import { deleteDocumentFromChroma } from '../services/vectorstore.service';
import fs from 'fs';
import path from 'path';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded.' });
            return;
        }

        const { title, department, className, semester, subject, chapter, section, module } = req.body;
        if (!title) {
            res.status(400).json({ error: 'Title is required in the request body.' });
            return;
        }

        // ── Per-subject ChromaDB collection ───────────────────────────────────
        // If a subject is provided, we route into its dedicated collection.
        // Falls back to "college_documents" only when subject is absent (legacy uploads).
        const chromaCollectionName = subject && department
            ? buildCollectionName(department, subject)
            : 'college_documents';

        console.log(`[Upload] Routing "${title}" → collection: "${chromaCollectionName}"`);

        // 1. Extract text from the temporary file (PDF, TXT, or DOCX)
        const text = await extractTextFromFile(req.file.path);

        // 2. Chunk and embed with full academic hierarchy metadata
        const chunkCount = await processDocumentAndStore(
            text,
            title,
            chromaCollectionName,
            { className, semester, department, subject, chapter, section, module }
        );

        // 3. Save metadata to MongoDB
        const documentMeta = new DocumentMeta({
            title,
            department:          department || 'General',
            className:           className  || '1st Year',
            semester:            semester   || '',
            subject:             subject    || '',
            chapter:             chapter    || '',
            section:             section    || '',
            module:              module     || '',
            chromaCollectionRef: chromaCollectionName,
            fileUrl:             `/uploads/${req.file.filename}`,
        });
        await documentMeta.save();

        res.status(201).json({
            message: 'Document uploaded and processed successfully.',
            documentMeta,
            chunksGenerated: chunkCount,
            chromaCollection: chromaCollectionName,
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
        const { className, department, semester, subject } = req.query;
        const filter: any = {};

        if (className) filter.className = className;
        if (department) filter.department = department;
        if (semester)   filter.semester   = semester;
        if (subject)    filter.subject    = subject;

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
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            const debugPath = `${filePath}_extracted_debug.txt`;
            if (fs.existsSync(debugPath)) fs.unlinkSync(debugPath);
        }

        // 2. Delete vector chunks from the correct per-subject ChromaDB collection
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
