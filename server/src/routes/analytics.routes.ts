import { Router } from 'express';
import { getAnalyticsData, getStudentsAcademicDetails, generateStudentReportPDF } from '../controllers/analytics.controller';

const router = Router();

// Endpoint for faculty to get dashboard insights on student queries
router.get('/insights', getAnalyticsData);
router.get('/students', getStudentsAcademicDetails);
router.get('/students/:studentId/report', generateStudentReportPDF);

export default router;
