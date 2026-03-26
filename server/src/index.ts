import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import documentRoutes from './routes/document.routes';
import chatRoutes from './routes/chat.routes';
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('Arynox Server is running!');
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arynox';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️ MongoDB connection failed. Are you missing the Atlas URI in your .env?');
    console.warn('\x1b[33m%s\x1b[0m', 'Server is running in degraded mode (Analytics/Logs will fail, but RAG parsing will work).');
  });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
