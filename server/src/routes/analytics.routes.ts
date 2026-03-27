import { Router } from 'express';
import { getAnalyticsData, getStudentsAcademicDetails, generateStudentReportPDF, getStuckStudents, teacherRespond, resolveDoubt } from '../controllers/analytics.controller';

const router = Router();

// Endpoint for faculty to get dashboard insights on student queries
router.get('/insights', getAnalyticsData);
router.get('/students', getStudentsAcademicDetails);
router.get('/students/:studentId/report', generateStudentReportPDF);
router.get('/stuck-students', getStuckStudents);
router.post('/teacher-respond', teacherRespond);
router.post('/resolve-doubt', resolveDoubt);

export default router;
