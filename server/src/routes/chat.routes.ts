import { Router } from 'express';
import { askChat } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint for students to ask questions (any authenticated user can ask, usually student)
router.post('/ask', authenticate, askChat);

export default router;
