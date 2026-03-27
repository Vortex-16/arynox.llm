import { Router } from 'express';
import { streamNotifications } from '../controllers/notifications.controller';

const router = Router();

// Endpoint for SSE stream
router.get('/stream', streamNotifications);

export default router;
