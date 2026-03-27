import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { createDoubt, getTeacherDoubts, resolveDoubt, getStudentDoubts } from '../controllers/doubt.controller';

const router: Router = Router();

// Student routes
router.post('/', authenticate, requireRole('student'), createDoubt);
router.get('/my', authenticate, requireRole('student'), getStudentDoubts);

// Teacher routes
router.get('/faculty', authenticate, requireRole('teacher'), getTeacherDoubts);
router.put('/:id/resolve', authenticate, requireRole('teacher'), resolveDoubt);

export default router;
