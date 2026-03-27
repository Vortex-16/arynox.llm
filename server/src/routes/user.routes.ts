import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { 
    getStudentsByDepartment, updateStudent, deleteStudent, 
    updateProfile, getFaculty, updateFaculty, deleteFaculty 
} from '../controllers/user.controller';

const router: Router = Router();

// Self-management for all users (update own name, avatar, or faculty-specific expertise)
router.put('/profile', authenticate, updateProfile);

// Management for teachers AND admins
router.get('/students', authenticate, requireRole('teacher'), getStudentsByDepartment);
router.put('/students/:id', authenticate, requireRole('teacher'), updateStudent);
router.delete('/students/:id', authenticate, requireRole('teacher'), deleteStudent);

// Management for admins ONLY (Faculty registry)
router.get('/faculty', authenticate, requireRole('admin'), getFaculty);
router.put('/faculty/:id', authenticate, requireRole('admin'), updateFaculty);
router.delete('/faculty/:id', authenticate, requireRole('admin'), deleteFaculty);

export default router;
