import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleSignIn = async (req: Request, res: Response): Promise<void> => {
    try {
        const { googleToken } = req.body;
        if (!googleToken) {
            res.status(400).json({ message: 'No Google token provided' });
            return;
        }

        // Fetch user profile using access_token
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${googleToken}`
            }
        });

        if (!response.ok) {
            res.status(401).json({ message: 'Failed to fetch user data from Google' });
            return;
        }

        const payload = await response.json();
        
        if (!payload || !payload.email || !payload.sub) {
            res.status(401).json({ message: 'Invalid Google token payload' });
            return;
        }

        const { sub: googleId, email, name, picture: avatar } = payload;

        // Check if user exists
        let user = await User.findOne({ googleId });

        // Create if doesn't exist
        if (!user) {
            // Determine role: emails without numbers are grouped as 'teacher', else 'student'
            const hasNumbers = /\d/.test(email);
            const userRole = hasNumbers ? 'student' : 'teacher';

            user = new User({
                googleId,
                email,
                name: name || '',
                avatar,
                role: userRole
            });
            await user.save();
        }

        // Generate custom JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Sign-in successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ message: 'Internal server error during authentication' });
    }
};
