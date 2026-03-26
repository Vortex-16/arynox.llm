import { Request, Response, NextFunction } from 'express';
import QueryLog from '../models/QueryLog';

export const getAnalyticsData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { department } = req.query;
        let filter = {};
        if (department) {
            filter = { department };
        }

        // Aggregate common questions or just return the logs
        const recentLogs = await QueryLog.find(filter).sort({ timestamp: -1 }).limit(100);
        
        const totalQueries = await QueryLog.countDocuments(filter);

        res.status(200).json({
            totalQueries,
            recentLogs,
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: 'Failed to retrieve analytics data.' });
    }
};
