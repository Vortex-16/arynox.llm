import { Request, Response, NextFunction } from 'express';
import QueryLog from '../models/QueryLog';
import PDFDocument from 'pdfkit';
import { getChatModel } from '../services/llm.service';
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

// Helper to consistently mask student IDs (e.g., student_123 -> Student 123)
const mask = (id?: string) => {
    if (!id) return "Anonymous";
    // Simple hash-like transformation: last 4 chars
    const suffix = id.length > 4 ? id.slice(-4).toUpperCase() : id.toUpperCase();
    return `Student #${suffix}`;
};

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

export const getStudentsAcademicDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentStats = await QueryLog.aggregate([
            { $match: { studentId: { $ne: null } } },
            { $group: {
                _id: "$studentId",
                queryCount: { $sum: 1 },
                topics: { $addToSet: "$topic" },
                avgStatus: { 
                    $avg: { 
                        $cond: [{ $eq: ["$status", "ANSWERED"] }, 1, 0] 
                    } 
                }
            }},
            { $sort: { queryCount: -1 } }
        ]);

        const mapped = studentStats.map((stat: any) => ({
            id: stat._id,
            anonymizedName: mask(stat._id),
            queryCount: stat.queryCount,
            topics: stat.topics,
            health: stat.avgStatus > 0.8 ? 'Healthy' : 'Needs Review'
        }));

        res.status(200).json(mapped);
    } catch (error) {
        console.error("Student Details Error:", error);
        res.status(500).json({ error: 'Failed to retrieve student academic details.' });
    }
};

export const generateStudentReportPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const queries = await QueryLog.find({ studentId }).sort({ timestamp: 1 });

        if (!queries.length) {
            res.status(404).json({ error: 'No queries found for this student.' });
            return;
        }

        const queryHistory = queries.map((q: any) => `- Topic: ${q.topic} | Query: ${q.query} | Subject: ${q.subject}`).join('\n');

        const chatModel = getChatModel();
        const response = await chatModel.invoke([
            new SystemMessage("You are an academic evaluator. Based on the student's query history below, generate an extremely detailed academic report. Evaluate their curiosity, strengths, areas for improvement, and recommended focus areas. Format the report using plain text paragraphs and bullet points, appropriate for a formal PDF document. Avoid markdown symbols like **, ##, etc. since the text will be rendered directly in a PDF."),
            new HumanMessage(`Query History for ${mask(studentId)}:\n\n${queryHistory}`)
        ]);

        const reportText = response.content.toString();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Academic_Report_${mask(studentId).replace(' ', '_')}.pdf"`);

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        doc.fontSize(20).text(`Academic Report: ${mask(studentId)}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(12).text(reportText, {
            align: 'justify',
            lineGap: 4
        });

        doc.end();

    } catch (error) {
        console.error("Report Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate report.' });
    }
};
