import { Request, Response, NextFunction } from 'express';
import QueryLog from '../models/QueryLog';
import ChatSession from '../models/ChatSession';
import PDFDocument from 'pdfkit';
import { getChatModel } from '../services/llm.service';
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { notifyStudent } from './notifications.controller';
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
        const studentId = req.params.studentId as string;
        const queries = await QueryLog.find({ studentId }).sort({ timestamp: 1 });

        if (!queries.length) {
            res.status(404).json({ error: 'No queries found for this student.' });
            return;
        }

        const queryHistory = queries.map((q: any) => `- Topic: ${q.topic} | Query: ${q.query}`).join('\n');

        const chatModel = getChatModel();
        const response = await chatModel.invoke([
            new SystemMessage(`You are a highly professional academic evaluator. Based on the student's query history below, generate an extremely accurate and formal academic report. Evaluate their curiosity, strengths, areas for improvement, and recommended focus areas. 
You MUST respond IN PURE JSON format, strictly adhering to this schema and absolutely no markdown or other text outside the JSON:
{
  "summary": "A comprehensive paragraph summarizing the student's academic engagement and curiosity based accurately on their queries.",
  "strengths": ["string", "string"],
  "areasForImprovement": ["string", "string"],
  "recommendations": ["string", "string"]
}`),
            new HumanMessage(`Query History for ${mask(studentId)}:\n\n${queryHistory}`)
        ]);

        let reportData;
        try {
            // Clean up any markdown code blocks if the LLM hallucinated them
            let content = response.content.toString().trim();
            if (content.startsWith('```json')) content = content.replace(/^```json/, '').replace(/```$/, '').trim();
            else if (content.startsWith('```')) content = content.replace(/^```/, '').replace(/```$/, '').trim();
            
            reportData = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse LLM JSON:", e);
            // Fallback object if parsing fails
            reportData = {
                summary: "The student has been actively asking questions across various topics in the system.",
                strengths: ["Demonstrates active engagement with the learning materials."],
                areasForImprovement: ["Consider reviewing fundamental concepts regularly before progressing deeper."],
                recommendations: ["Consistent review of the interactive knowledge base to reinforce learning."]
            };
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Academic_Report_${mask(studentId).replace(' ', '_')}.pdf"`);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(res);

        // Header
        doc.font('Helvetica-Bold').fontSize(24).fillColor('#4f46e5').text('ARYNOX', { align: 'left' });
        doc.fontSize(16).fillColor('#111827').text('Official Academic Report', { align: 'left' });
        
        // Separator Line
        doc.moveTo(50, doc.y + 10).lineTo(545, doc.y + 10).strokeColor('#e5e7eb').lineWidth(1).stroke();
        doc.moveDown(2);

        // Student Info
        doc.font('Helvetica').fontSize(12).fillColor('#374151');
        doc.text(`Student: `, { continued: true }).font('Helvetica-Bold').text(mask(studentId));
        doc.font('Helvetica').text(`Generated On: `, { continued: true }).font('Helvetica-Bold').text(new Date().toLocaleDateString());
        doc.font('Helvetica').text(`Total Queries Logged: `, { continued: true }).font('Helvetica-Bold').text(String(queries.length));
        doc.moveDown(2);

        // Section Helper
        const addSection = (title: string, content: string | string[]) => {
            doc.font('Helvetica-Bold').fontSize(14).fillColor('#111827').text(title);
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(11).fillColor('#4b5563');

            if (Array.isArray(content)) {
                content.forEach(item => {
                    const currentY = doc.y;
                    doc.rect(55, currentY + 4, 3, 3).fill('#4f46e5');
                    doc.text(item, 65, currentY, { align: 'justify', lineGap: 2 });
                    doc.moveDown(0.3);
                });
            } else {
                doc.text(content, { align: 'justify', lineGap: 4 });
            }
            doc.moveDown(1.5);
        };

        // Report Content sections safely populated
        addSection("Executive Summary", reportData.summary || 'Summary unavailable.');
        addSection("Key Strengths", reportData.strengths || ['No specific strengths identified.']);
        addSection("Areas for Improvement", reportData.areasForImprovement || ['No fundamental areas required.']);
        addSection("Recommended Focus Areas", reportData.recommendations || ['Continue using the system.']);

        // Footer
        doc.fontSize(9).fillColor('#9ca3af')
           .text('This is an AI-generated evaluation based strictly on interactive learning sessions.', 
                 50, doc.page.height - 50, { align: 'center', baseline: 'bottom' });

        doc.end();

    } catch (error) {
        console.error("Report Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate report.' });
    }
};

// ─── STUCK STUDENT DETECTION ────────────────────────────────────────────────────
// Finds students who asked about the same topic 3+ times — a signal the AI tutor
// isn't getting through and the teacher needs to step in.

export const getStuckStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const THRESHOLD = 3;

        // Step 1: Find (studentId, topic) pairs that appear >= THRESHOLD times
        const stuckGroups = await QueryLog.aggregate([
            { $match: { studentId: { $ne: null }, topic: { $ne: null } } },
            { $group: {
                _id: { studentId: "$studentId", topic: "$topic" },
                count: { $sum: 1 },
                lastAsked: { $max: "$timestamp" },
                sessionIds: { $addToSet: "$sessionId" }
            }},
            { $match: { count: { $gte: THRESHOLD } } },
            { $sort: { count: -1 } }
        ]);

        if (!stuckGroups.length) {
            res.status(200).json([]);
            return;
        }

        // Step 2: For each stuck group, pull the actual queries + AI responses
        const results = await Promise.all(stuckGroups.map(async (group: any) => {
            const queries = await QueryLog.find({
                studentId: group._id.studentId,
                topic: group._id.topic
            })
            .sort({ timestamp: -1 })
            .limit(10)
            .select('query response timestamp status sessionId');

            return {
                studentId: group._id.studentId,
                anonymizedName: mask(group._id.studentId),
                topic: group._id.topic,
                repeatCount: group.count,
                lastAsked: group.lastAsked,
                sessionId: group.sessionIds?.[0] || null,
                queries: queries.map((q: any) => ({
                    query: q.query,
                    response: q.response,
                    timestamp: q.timestamp,
                    status: q.status,
                    sessionId: q.sessionId
                }))
            };
        }));

        res.status(200).json(results);
    } catch (error) {
        console.error("Stuck Students Error:", error);
        res.status(500).json({ error: 'Failed to detect stuck students.' });
    }
};

// ─── TEACHER DIRECT RESPONSE ────────────────────────────────────────────────────
// Injects a teacher's answer directly into the student's chat session so they
// see it the next time they open the conversation.

export const teacherRespond = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, sessionId, message } = req.body;

        if (!studentId || !message) {
            res.status(400).json({ error: 'studentId and message are required.' });
            return;
        }

        // Find the student's most recent session (or a specific one if sessionId provided)
        let session;
        if (sessionId) {
            session = await ChatSession.findOne({ sessionId });
        }
        if (!session) {
            session = await ChatSession.findOne({ studentId }).sort({ updatedAt: -1 });
        }

        if (!session) {
            res.status(404).json({ error: 'No chat session found for this student.' });
            return;
        }

        // Inject the teacher's response as a system message
        session.messages.push({
            role: 'system',
            content: `[Teacher Response] ${message}`,
            timestamp: new Date()
        } as any);

        await session.save();

        // ─── TEACHER REPLY REAL-TIME ALERT ───────────────────────────────────
        // Notify the student that the teacher has responded to their doubt
        notifyStudent(studentId, { 
            type: 'TEACHER_REPLY', 
            topic: session.title || "your recent doubt"
        });

        res.status(200).json({ success: true, sessionId: session.sessionId });
    } catch (error) {
        console.error("Teacher Respond Error:", error);
        res.status(500).json({ error: 'Failed to send teacher response.' });
    }
};
