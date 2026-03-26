import mongoose, { Schema, Document } from 'mongoose';

export interface IQueryLog extends Document {
  studentId?: string;
  query: string;
  response: string;
  timestamp: Date;
  department?: string;
}

const QueryLogSchema: Schema = new Schema({
  studentId: { type: String, required: false }, // Optional if anonymous
  query: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  department: { type: String, required: false },
});

export default mongoose.model<IQueryLog>('QueryLog', QueryLogSchema);
