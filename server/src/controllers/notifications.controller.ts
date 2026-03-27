import { Request, Response } from 'express';

// In-memory store of connected clients
// Key: `teacher_${timestamp}` (multiple teachers) or `student_${studentId}`
const clients = new Map<string, { res: Response; heartbeat: NodeJS.Timeout }>();

/**
 * SSE Stream Endpoint
 * Clients connect here to receive real-time push notifications.
 * Query params: ?role=teacher  OR  ?role=student&studentId=...
 */
export const streamNotifications = (req: Request, res: Response) => {
    const { role, studentId } = req.query;

    if (!role || (role === 'student' && !studentId)) {
        res.status(400).json({ error: 'Missing required parameters: role and/or studentId' });
        return;
    }

    const connId = role === 'teacher'
        ? `teacher_${Date.now()}`
        : `student_${studentId}`;

    // ─── SSE Headers ────────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Prevent nginx from buffering
    // Explicit CORS for the SSE stream (cors() middleware doesn't cover this)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Flush headers immediately so the browser know the SSE connection is open
    res.flushHeaders();

    // Send the initial connected event
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: `Connected as ${role}` })}\n\n`);

    // ─── Keep-Alive Heartbeat (every 25s) ───────────────────────────────────
    // Prevents proxies and browsers from closing the idle connection
    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n'); // SSE comment — ignored by clients but keeps TCP alive
    }, 25000);

    clients.set(connId, { res, heartbeat });
    console.log(`[SSE] Client connected: ${connId}. Total connections: ${clients.size}`);

    // ─── Cleanup on disconnect ───────────────────────────────────────────────
    req.on('close', () => {
        clearInterval(heartbeat);
        clients.delete(connId);
        console.log(`[SSE] Client disconnected: ${connId}. Remaining: ${clients.size}`);
    });
};

/** Push a notification to ALL connected teachers */
export const notifyTeacher = (payload: any) => {
    let sentCount = 0;
    for (const [key, client] of clients.entries()) {
        if (key.startsWith('teacher_')) {
            client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
            sentCount++;
        }
    }
    console.log(`[SSE] Broadcasted to ${sentCount} teacher(s):`, payload.type);
};

/** Push a notification to a specific student */
export const notifyStudent = (studentId: string, payload: any) => {
    const key = `student_${studentId}`;
    const client = clients.get(key);

    if (client) {
        client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
        console.log(`[SSE] Sent to student ${studentId}:`, payload.type);
    } else {
        console.log(`[SSE] Student ${studentId} not connected — skipping real-time alert.`);
    }
};
