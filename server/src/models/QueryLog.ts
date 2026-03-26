import mongoose, { Schema, Document } from 'mongoose';

export interface IQueryLog extends Document {
  sessionId?: string;
  studentId?: string;
  query: string;
  response: string;
  timestamp: Date;
  department?: string;
  forwardedToTeacher: boolean;
  status: 'ANSWERED' | 'OUT_OF_SCOPE' | 'UNANSWERED_FORWARDED';
}

const QueryLogSchema: Schema = new Schema({
  sessionId: { type: String, required: false },
  studentId: { type: String, required: false }, // Optional if anonymous
  query: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  department: { type: String, required: false },
  forwardedToTeacher: { type: Boolean, default: false },
  status: { type: String, enum: ['ANSWERED', 'OUT_OF_SCOPE', 'UNANSWERED_FORWARDED'], default: 'ANSWERED' }
});

export default mongoose.model<IQueryLog>('QueryLog', QueryLogSchema);
