import { Router } from 'express';
import { askChat } from '../controllers/chat.controller';

const router = Router();

// Endpoint for students to ask questions to the Socratic AI
router.post('/ask', askChat);

export default router;
