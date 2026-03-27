import { Router } from 'express';
import { uploadMiddleWare } from '../middlewares/upload.middleware';
import { getDocuments, uploadDocument, deleteDocument, updateDocument } from '../controllers/document.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Faculty only: upload
router.post('/upload', authenticate, requireRole('teacher'), uploadMiddleWare.single('document'), uploadDocument);

// Any authenticated user: list documents (filtered server-side by role)
router.get('/', authenticate, getDocuments);

// Faculty only: update
router.put('/:id', authenticate, requireRole('teacher'), updateDocument);

// Faculty only: delete
router.delete('/:id', authenticate, requireRole('teacher'), deleteDocument);

export default router;
