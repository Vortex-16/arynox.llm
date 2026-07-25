import { Request, Response, NextFunction } from 'express';
import DocumentMeta from '../models/DocumentMeta';
import User from '../models/User';
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
        if (!subject || !department) {
            res.status(400).json({ error: 'Both "subject" and "department" are required. Documents must be tagged to a subject for correct RAG routing.' });
            return;
        }

        // Check if this exact title already exists in this department+subject collection
        const existing = await DocumentMeta.findOne({
            title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            department,
            subject
        });
        if (existing) {
            // Clean up temp file
            if (req.file?.path && fs.existsSync(req.file.path)) {
                try { fs.unlinkSync(req.file.path); } catch (_) { }
            }
            res.status(409).json({ error: `A document titled "${title}" already exists in ${department} / ${subject}. Delete the old one first, or use a different title.` });
            return;
        }

        const chromaCollectionName = buildCollectionName(department, subject);
        console.log(`[Upload] Routing "${title}" → collection: "${chromaCollectionName}"`);

        // 1. Extract text
        const text = await extractTextFromFile(req.file.path);

        // 2. Chunk + embed + store
        const chunkCount = await processDocumentAndStore(
            text,
            title,
            chromaCollectionName,
            { className, semester, department, subject, chapter, section, module }
        );

        const teacherUser = await User.findById(req.user?.userId);
        const tName = teacherUser?.name || 'Faculty';

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
            teacherId:           req.user?.userId,
            teacherName:         tName,
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
        if (req.file?.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (_) { }
        }
        next(error);
    }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.user;
        const { className, department, semester, subject } = req.query;
        let filter: any = {};

        // 🛡️ SECURITY: Server-side Role-Based Filtering
        if (user?.role === 'student') {
            const fullUser = await User.findById(user.userId);
            if (fullUser && fullUser.department) {
                const deptStr = fullUser.department.trim();
                // Match department or shorthand code (e.g. Computer Science <-> CSE)
                const deptRegex = new RegExp(`^${deptStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
                filter.department = { $regex: deptRegex };

                if (subject) {
                    filter.subject = { $regex: new RegExp(`^${(subject as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
                }
            }
        } else {
            // Teachers/Admins can see everything or apply elective filters via query
            if (className) filter.className = { $regex: new RegExp(String(className), 'i') };
            if (department) filter.department = { $regex: new RegExp(String(department), 'i') };
            if (semester) filter.semester = { $regex: new RegExp(String(semester), 'i') };
            if (subject) filter.subject = { $regex: new RegExp(String(subject), 'i') };
        }

        let docs = await DocumentMeta.find(filter).sort({ uploadedAt: -1 });

        // Fallback for students: if strict filter returns empty, return all documents for department
        if (user?.role === 'student' && docs.length === 0 && filter.department) {
            docs = await DocumentMeta.find({ department: filter.department }).sort({ uploadedAt: -1 });
        }

        res.status(200).json(docs);
    } catch (error) {
        console.error("Fetch Docs Error:", error);
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

export const updateDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, subject, module, chapter, section, semester, className } = req.body;
        
        const doc = await DocumentMeta.findById(id);
        if (!doc) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        // Update fields
        if (title) doc.title = title;
        if (subject) doc.subject = subject;
        if (module) doc.module = module;
        if (chapter) doc.chapter = chapter;
        if (section) doc.section = section;
        if (semester) doc.semester = semester;
        if (className) doc.className = className;

        await doc.save();

        res.status(200).json({ message: 'Document updated successfully', doc });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: 'Failed to update document metadata' });
    }
};
