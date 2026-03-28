import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User';

if (!process.env.GOOGLE_CLIENT_ID) {
    console.warn('⚠️  GOOGLE_CLIENT_ID is missing from environment variables!');
}
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const SALT_ROUNDS = 12;

// ── Helper: build JWT from user document ──────────────────────────────────────
const signToken = (user: any): string => {
    return jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// ── Helper: safe user shape for API responses ─────────────────────────────────
const safeUser = (user: any) => ({
    id:                 user._id,
    email:              user.email,
    name:               user.name,
    avatar:             user.avatar,
    role:               user.role,
    onboardingComplete: user.onboardingComplete,
    // Faculty profile
    department:         user.department,
    subjects:           user.subjects,
    semesters:          user.semesters,
    classYears:         user.classYears,
    // Student profile
    className:          user.className,
    semester:           user.semester,
});

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE OAUTH
// ─────────────────────────────────────────────────────────────────────────────
export const googleSignIn = async (req: Request, res: Response): Promise<void> => {
    try {
        const { googleToken } = req.body;
        if (!googleToken) {
            res.status(400).json({ message: 'No Google token provided' });
            return;
        }

        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${googleToken}` }
        });
        if (!response.ok) {
            res.status(401).json({ message: 'Failed to fetch user data from Google' });
            return;
        }

        const payload = await response.json() as any;
        if (!payload?.email || !payload?.sub) {
            res.status(401).json({ message: 'Invalid Google token payload' });
            return;
        }

        const { sub: googleId, email, name, picture: avatar } = payload;

        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (!user) {
            // New user — role & profile will be set during onboarding
            const role = /\d/.test(email) ? 'student' : 'teacher';
            user = new User({
                googleId,
                email,
                name: name || '',
                avatar,
                role,           // default based on email pattern; confirmed during onboarding
                onboardingComplete: false,
            });
            await user.save();
        } else if (!user.googleId) {
            // Existing email+password user now linking Google
            user.googleId = googleId;
            user.avatar = avatar || user.avatar;
            await user.save();
        }

        const token = signToken(user);
        res.status(200).json({ message: 'Sign-in successful', token, user: safeUser(user) });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ message: 'Internal server error during Google authentication' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL + PASSWORD — REGISTER
// ─────────────────────────────────────────────────────────────────────────────
export const emailRegister = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            res.status(400).json({ message: 'Email, password, and name are required.' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters.' });
            return;
        }

        const existing = await User.findOne({ email });
        if (existing) {
            res.status(409).json({ message: 'An account with this email already exists.' });
            return;
        }

        const hashed = await bcrypt.hash(password, SALT_ROUNDS);
        const role = /\d/.test(email) ? 'student' : 'teacher';
        const user = new User({
            email,
            name,
            password: hashed,
            role,
            onboardingComplete: false,
        });
        await user.save();

        const token = signToken(user);
        res.status(201).json({ message: 'Account created successfully', token, user: safeUser(user) });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error during registration' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL + PASSWORD — LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export const emailLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required.' });
            return;
        }

        // Explicitly select the password field (excluded by default)
        const user = await User.findOne({ email }).select('+password');
        if (!user || !user.password) {
            res.status(401).json({ message: 'Invalid email or password.' });
            return;
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            res.status(401).json({ message: 'Invalid email or password.' });
            return;
        }

        const token = signToken(user);
        res.status(200).json({ message: 'Login successful', token, user: safeUser(user) });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING — saves role + academic profile, marks onboardingComplete = true
// Protected: requires authenticate middleware (called from auth.routes)
// ─────────────────────────────────────────────────────────────────────────────
export const completeOnboarding = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }

        const { role, department, subjects, semesters, classYears, className, semester } = req.body;

        if (!role || !['student', 'teacher'].includes(role)) {
            res.status(400).json({ message: 'A valid role (student or teacher) is required.' });
            return;
        }

        const update: any = {
            role,
            onboardingComplete: true,
            department: department || '',
        };

        if (role === 'teacher') {
            update.subjects   = subjects   || [];
            update.semesters  = semesters  || [];
            update.classYears = classYears || [];
        } else {
            update.className = className || '';
            update.semester  = semester  || '';
        }

        const user = await User.findByIdAndUpdate(userId, update, { new: true });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Issue a fresh token with updated role
        const token = signToken(user);
        res.status(200).json({ message: 'Onboarding complete!', token, user: safeUser(user) });
    } catch (error) {
        console.error('Onboarding error:', error);
        res.status(500).json({ message: 'Internal server error during onboarding' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET CURRENT USER — from token (used on app load to hydrate AuthContext)
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({ user: safeUser(user) });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
