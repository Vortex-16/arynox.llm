import { Router } from 'express';
import { getAnalyticsData } from '../controllers/analytics.controller';

const router = Router();

// Endpoint for faculty to get dashboard insights on student queries
router.get('/insights', getAnalyticsData);

export default router;
