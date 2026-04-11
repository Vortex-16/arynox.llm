import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import {
    getDepartments, getDepartmentsPublic, createDepartment, updateDepartment, deleteDepartment,
    getSubjects, createSubject, updateSubject, assignTeacherToSubject,
    promoteStudent, bulkPromoteStudents,
    getAdminStats, getAllFaculty, getAllStudents, deleteUser,
    getSystemSettings, updateSystemSettings
} from '../controllers/admin.controller';

const router = Router();

// ── Public (no auth) — used by onboarding dropdowns ───────────────────────────
router.get('/departments/public', getDepartmentsPublic);
router.get('/subjects/public', getSubjects); // subjects are not sensitive

// ── Admin-only routes ──────────────────────────────────────────────────────────
const adminOnly = [authenticate, requireRole('admin')];

// Departments
router.get('/departments', ...adminOnly, getDepartments);
router.post('/departments', ...adminOnly, createDepartment);
router.put('/departments/:code', ...adminOnly, updateDepartment);
router.delete('/departments/:code', ...adminOnly, deleteDepartment);

// Subjects
router.get('/subjects', ...adminOnly, getSubjects);
router.post('/subjects', ...adminOnly, createSubject);
router.put('/subjects/:id', ...adminOnly, updateSubject);
router.put('/subjects/:id/assign-teacher', ...adminOnly, assignTeacherToSubject);

// Student management
router.get('/students', ...adminOnly, getAllStudents);
router.put('/students/:id/promote', ...adminOnly, promoteStudent);
router.post('/students/bulk-promote', ...adminOnly, bulkPromoteStudents);

// Faculty management
router.get('/faculty', ...adminOnly, getAllFaculty);
router.delete('/users/:id', ...adminOnly, deleteUser);

// University stats
router.get('/stats', ...adminOnly, getAdminStats);

// System Configuration
router.get('/settings', ...adminOnly, getSystemSettings);
router.put('/settings', ...adminOnly, updateSystemSettings);

export default router;
