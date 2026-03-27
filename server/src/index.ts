import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import documentRoutes from './routes/document.routes';
import chatRoutes from './routes/chat.routes';
import chatSessionRoutes from './routes/chatSession.routes';
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';
import settingsRoutes from './routes/settings.routes';
import audioRoutes from './routes/audio.routes';
import notificationsRoutes from './routes/notifications.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat/session', chatSessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/notifications', notificationsRoutes);

// Static Asset Serving (Allows Teachers to View Uploaded PDFs)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('Arynox Server is running!');
});

// Global Error Handler — must have 4 args so Express recognises it as an error handler
// Catches Multer limit errors, unhandled throws etc. and always returns JSON (never HTML)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Express Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// MongoDB Connection (non-blocking — server boots even without Atlas URI)
const MONGODB_URI = process.env.MONGODB_URI || '';

if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(() => {
      console.warn('\x1b[33m%s\x1b[0m', '⚠️  MongoDB connection failed. Analytics/Logs will be unavailable.');
    });
} else {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️  No MONGODB_URI in .env — running in degraded mode (RAG still works).');
}

app.listen(PORT, () => {
  console.log(`🚀 Arynox Server running on http://localhost:${PORT}`);
});
