import { Request, Response } from 'express';

// In-memory store of connected clients
// Key: `teacher_${timestamp}` (multiple teachers) or `student_${studentId}`
const clients = new Map<string, { res: Response; heartbeat: NodeJS.Timeout }>();

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
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Prevent nginx from buffering
    // Explicit CORS for the SSE stream (cors() middleware doesn't cover this)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: `Connected as ${role}` })}\n\n`);

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
        res.write(': keepalive\n\n');
    }, 30000);

    clients.set(connId, { res, heartbeat });
    console.log(`[SSE] Client connected: ${connId}. Total active: ${clients.size}`);

    req.on('close', () => {
        clearInterval(heartbeat);
        clients.delete(connId);
        console.log(`[SSE] Client disconnected: ${connId}.`);
    });
};

/**
 * Sends a notification to a specific teacher
 */
export const notifyTeacher = (teacherId: string, payload: any) => {
    const key = `teacher_${teacherId}`;
    const client = clients.get(key);
    if (client) {
        client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
        console.log(`[SSE] Sent ALERT to teacher ${teacherId}.`);
    }
};

/**
 * Broadcasts to all connected teachers
 */
export const notifyAllTeachers = (payload: any) => {
    for (const [key, client] of clients.entries()) {
        if (key.startsWith('teacher_')) {
            client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
    }
    console.log(`[SSE] Broadcasted alert to all teachers.`);
};

/**
 * Sends a notification to a specific student
 */
export const notifyStudent = (studentId: string, payload: any) => {
    const key = `student_${studentId}`;
    const client = clients.get(key);
    if (client) {
        client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
        console.log(`[SSE] Sent REPLY to student ${studentId}.`);
    }
};
