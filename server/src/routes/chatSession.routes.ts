import { Router } from 'express';
import { listSessions, loadSession } from '../controllers/chatSession.controller';

const router = Router();

// Endpoints for chat session persistence
router.get('/list/:studentId', listSessions);
router.get('/load/:sessionId', loadSession);

export default router;
