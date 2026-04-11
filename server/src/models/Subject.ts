import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;           // e.g. "Data Structures and Algorithms"
  code: string;           // e.g. "CS301" — unique per dept
  departmentCode: string; // matches Department.code (e.g. "CSE")
  program: string;        // e.g. "BTech"
  semester: number;       // e.g. 3 (semester number, not label)
  credits?: number;       // e.g. 4
  assignedTeacherId?: string; // ObjectId string of the User (teacher)
  assignedTeacherName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>({
  name:                 { type: String, required: true, trim: true },
  code:                 { type: String, required: true, uppercase: true, trim: true },
  departmentCode:       { type: String, required: true, uppercase: true },
  program:              { type: String, required: true },
  semester:             { type: Number, required: true, min: 1, max: 16 },
  credits:              { type: Number, min: 1, max: 10 },
  assignedTeacherId:    { type: String },
  assignedTeacherName:  { type: String },
  isActive:             { type: Boolean, default: true },
}, { timestamps: true });

// Compound unique index: same code cannot repeat in the same department
SubjectSchema.index({ code: 1, departmentCode: 1 }, { unique: true });

export default mongoose.model<ISubject>('Subject', SubjectSchema);
