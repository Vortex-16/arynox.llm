import { Request, Response, NextFunction } from 'express';
import QueryLog from '../models/QueryLog';

export const getAnalyticsData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { department } = req.query;
        let filter: any = {};
        if (department) {
            filter.department = department;
        }

        // 1. Total Queries
        const totalQueries = await QueryLog.countDocuments(filter);

        // 2. Recent Logs (Anonymized)
        const rawRecentLogs = await QueryLog.find(filter).sort({ timestamp: -1 }).limit(10);
        
        // Helper to consistently mask student IDs (e.g., student_123 -> Student 123)
        const mask = (id?: string) => {
            if (!id) return "Anonymous";
            // Simple hash-like transformation: last 4 chars
            const suffix = id.length > 4 ? id.slice(-4).toUpperCase() : id.toUpperCase();
            return `Student #${suffix}`;
        };

        const recentLogs = rawRecentLogs.map((log: any) => ({
            ...log.toObject(),
            studentId: mask(log.studentId)
        }));

        // 3. Topic-Wise Clusters (Real-time aggregation)
        // ... (rest of the logic remains the same)
        const topicClusters = await QueryLog.aggregate([
            { $match: filter },
            { $group: { 
                _id: "$topic", 
                count: { $sum: 1 },
                avgStatus: { 
                    $avg: { 
                        $cond: [{ $eq: ["$status", "ANSWERED"] }, 1, 0] 
                    } 
                }
            }},
            { $sort: { count: -1 } },
            { $limit: 6 } // Top 6 topics
        ]);

        // 4. Student-Wise activity (Anonymized count)
        const studentActivity = await QueryLog.aggregate([
            { $match: filter },
            { $group: { _id: "$studentId", queryCount: { $sum: 1 } } },
            { $sort: { queryCount: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            totalQueries,
            recentLogs,
            topicClusters: topicClusters.map((t: any) => ({
                topic: t._id,
                count: t.count,
                percentage: totalQueries > 0 ? ((t.count / totalQueries) * 100).toFixed(1) : 0,
                health: t.avgStatus > 0.8 ? 'Healthy' : 'Needs Review'
            })),
            studentActivity: studentActivity.length
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: 'Failed to retrieve analytics data.' });
    }
};
