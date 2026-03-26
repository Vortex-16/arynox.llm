import { Router } from 'express';
import { uploadMiddleWare } from '../middlewares/upload.middleware';
import { getDocuments, uploadDocument, deleteDocument } from '../controllers/document.controller';

const router = Router();

// Endpoint for faculty to upload materials 
router.post('/upload', uploadMiddleWare.single('document'), uploadDocument);

// Endpoint to fetch list of uploaded materials
router.get('/', getDocuments);

// Endpoint to delete a document and its vectors
router.delete('/:id', deleteDocument);

export default router;
