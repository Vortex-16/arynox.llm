import { Request, Response } from 'express';

// In-memory store of connected clients
// Key structure: `teacher_${id}` or `student_${id}`
const clients = new Map<string, Response>();

/**
 * SSE Stream Endpoint
 */
export const streamNotifications = (req: Request, res: Response) => {
    const { role, studentId, teacherId } = req.query;

    if (!role || (role === 'student' && !studentId) || (role === 'teacher' && !teacherId)) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const connId = role === 'teacher' ? `teacher_${teacherId}` : `student_${studentId}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: `Connected as ${role}` })}\n\n`);

    clients.set(connId, res);
    console.log(`[SSE] Client connected: ${connId}. Total active: ${clients.size}`);

    req.on('close', () => {
        clients.delete(connId);
        console.log(`[SSE] Client disconnected: ${connId}.`);
    });
};

/**
 * Sends a notification to a specific teacher
 */
export const notifyTeacher = (teacherId: string, payload: any) => {
    const key = `teacher_${teacherId}`;
    const res = clients.get(key);
    if (res) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        console.log(`[SSE] Sent ALERT to teacher ${teacherId}.`);
    }
};

/**
 * Broadcasts to all connected teachers
 */
export const notifyAllTeachers = (payload: any) => {
    for (const [key, res] of clients.entries()) {
        if (key.startsWith('teacher_')) {
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
    }
    console.log(`[SSE] Broadcasted alert to all teachers.`);
};

/**
 * Sends a notification to a specific student
 */
export const notifyStudent = (studentId: string, payload: any) => {
    const key = `student_${studentId}`;
    const res = clients.get(key);
    if (res) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        console.log(`[SSE] Sent REPLY to student ${studentId}.`);
    }
};
