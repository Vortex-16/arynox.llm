import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
  department: string; // settings can be global or per dept
  isExamMode: boolean;
  aiStrictness: 'SOCRATIC' | 'DIRECT' | 'HINTS_ONLY';
  confidenceThreshold: number; // For RAG refusal (0-1)
  updatedAt: Date;
}

const SystemSettingSchema: Schema = new Schema({
  department: { type: String, default: 'General', unique: true },
  isExamMode: { type: Boolean, default: false },
  aiStrictness: { type: String, enum: ['SOCRATIC', 'DIRECT', 'HINTS_ONLY'], default: 'SOCRATIC' },
  confidenceThreshold: { type: Number, default: 0.5 },
}, {
  timestamps: true
});

export default mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
