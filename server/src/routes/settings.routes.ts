import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getSettings);
router.post('/update', authenticate, requireRole('teacher', 'admin'), updateSettings);

export default router;
