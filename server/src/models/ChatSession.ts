import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface IChatSession extends Document {
  sessionId: string;
  studentId: string;
  title: string;
  className?: string; // e.g., 'Second Year'
  department?: string; // e.g., 'CSE'
  subject?: string; // To help isolate queries to a specific notebook if needed
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema: Schema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  studentId: { type: String, required: true },
  title: { type: String, required: true },
  className: { type: String, required: false },
  department: { type: String, required: false },
  subject: { type: String, required: false },
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
