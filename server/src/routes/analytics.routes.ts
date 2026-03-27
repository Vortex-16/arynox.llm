import { Router } from 'express';
import { getAnalyticsData, getStudentsAcademicDetails, generateStudentReportPDF, getStuckStudents, teacherRespond, getUniversityOverview, getSubjectAnalytics } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all analytics routes
router.use(authenticate);

// Global Admin Insights
router.get('/university-overview', getUniversityOverview);

// Endpoint for faculty to get dashboard insights on student queries
router.get('/insights', getAnalyticsData);
router.get('/students', getStudentsAcademicDetails);
router.get('/students/:studentId/report', generateStudentReportPDF);
router.get('/stuck-students', getStuckStudents);
router.get('/subject-analytics', getSubjectAnalytics);
router.post('/teacher-respond', teacherRespond);

export default router;
