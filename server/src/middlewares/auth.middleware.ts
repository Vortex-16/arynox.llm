import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Extend Express Request to carry decoded user
declare global {
    namespace Express {
        interface Request {
            user?: { userId: string; role: string };
        }
    }
}

/**
 * Verifies the JWT from the Authorization header and attaches req.user.
 * Returns 401 if the token is missing or invalid.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Authentication required. Please log in.' });
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
    }
};

/**
 * Role guard — use AFTER authenticate.
 * Usage: router.post('/upload', authenticate, requireRole('teacher'), uploadDocument)
 * Admins are also allowed by default on these guarded routes.
 */
export const requireRole = (roles: string | string[]) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required.' });
            return;
        }
        
        const isAllowed = allowedRoles.includes(req.user.role) || req.user.role === 'admin';
        
        if (!isAllowed) {
            res.status(403).json({ message: `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')} (or admin).` });
            return;
        }
        next();
    };
};
