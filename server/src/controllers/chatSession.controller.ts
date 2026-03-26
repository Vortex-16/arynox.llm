import { Request, Response, NextFunction } from 'express';
import ChatSession from '../models/ChatSession';

// List all sessions for a specific student
export const listSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { studentId } = req.params;
        // Find sessions and project only the required fields to save bandwidth
        const sessions = await ChatSession.find({ studentId })
                                           .sort({ updatedAt: -1 })
                                           .select('sessionId title createdAt updatedAt');
        res.status(200).json(sessions);
    } catch (error) {
        console.error("Failed to list chat sessions:", error);
        res.status(500).json({ error: 'Failed to retrieve chat sessions.' });
    }
};

// Load a specific session's full message history
export const loadSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { sessionId } = req.params;
        const session = await ChatSession.findOne({ sessionId });
        
        if (!session) {
            res.status(404).json({ error: 'Chat session not found.' });
            return;
        }
        res.status(200).json(session);
    } catch (error) {
        console.error("Failed to load chat session:", error);
        res.status(500).json({ error: 'Failed to load chat session.' });
    }
};
