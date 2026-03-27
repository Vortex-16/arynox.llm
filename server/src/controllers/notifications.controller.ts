import { Request, Response } from 'express';

// In-memory store of connected clients
// Key structure: `teacher_${id}` or `student_${id}`
const clients = new Map<string, Response>();

/**
 * SSE Stream Endpoint
 * Clients connect to this to receive real-time push notifications.
 * Expected query params: ?role=teacher or ?role=student&studentId=...
 */
export const streamNotifications = (req: Request, res: Response) => {
    const { role, studentId } = req.query;

    if (!role || (role === 'student' && !studentId)) {
        res.status(400).json({ error: 'Missing required parameters: role and/or studentId' });
        return;
    }

    // Generate a unique connection ID
    const connId = role === 'teacher' 
        ? `teacher_${Date.now()}` // Allow multiple teachers to connect
        : `student_${studentId}`;

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Flush initial connection message
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: `Connected as ${role}` })}\n\n`);

    // Store the connection
    clients.set(connId, res);
    console.log(`[SSE] Client connected: ${connId}. Total active connections: ${clients.size}`);

    // Handle client disconnect
    req.on('close', () => {
        clients.delete(connId);
        console.log(`[SSE] Client disconnected: ${connId}. Total active connections: ${clients.size}`);
    });
};

/**
 * Sends a notification to all connected teachers
 */
export const notifyTeacher = (payload: any) => {
    let sentCount = 0;
    for (const [key, res] of clients.entries()) {
        if (key.startsWith('teacher_')) {
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
            // We need to compress/flush if behind proxy, but standard express write is usually fine
            sentCount++;
        }
    }
    console.log(`[SSE] Broadcasted STUCK_STUDENT alert to ${sentCount} teacher(s).`);
};

/**
 * Sends a notification to a specific connected student
 */
export const notifyStudent = (studentId: string, payload: any) => {
    const key = `student_${studentId}`;
    const res = clients.get(key);
    
    if (res) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        console.log(`[SSE] Sent TEACHER_REPLY alert to student ${studentId}.`);
    } else {
        console.log(`[SSE] Student ${studentId} not currently connected for real-time alert.`);
    }
};
