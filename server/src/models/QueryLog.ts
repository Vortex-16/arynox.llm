import mongoose, { Schema, Document } from 'mongoose';

export interface IQueryLog extends Document {
  sessionId?: string;
  studentId?: string;
  query: string;
  response: string;
  topic?: string;
  timestamp: Date;
  department?: string;
  forwardedToTeacher: boolean;
  status: 'ANSWERED' | 'OUT_OF_SCOPE' | 'UNANSWERED_FORWARDED';
  doubtResolved: boolean; // Set to true when teacher marks the doubt as resolved
}

const QueryLogSchema: Schema = new Schema({
  sessionId: { type: String, required: false },
  studentId: { type: String, required: false },
  query: { type: String, required: true },
  response: { type: String, required: true },
  topic: { type: String, default: 'General' },
  timestamp: { type: Date, default: Date.now },
  department: { type: String, required: false },
  forwardedToTeacher: { type: Boolean, default: false },
  status: { type: String, enum: ['ANSWERED', 'OUT_OF_SCOPE', 'UNANSWERED_FORWARDED'], default: 'ANSWERED' },
  doubtResolved: { type: Boolean, default: false }
});

export default mongoose.model<IQueryLog>('QueryLog', QueryLogSchema);
