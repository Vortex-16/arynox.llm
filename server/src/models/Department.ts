import mongoose, { Schema, Document } from 'mongoose';

export interface IProgram {
  name: string;       // e.g. "Bachelor of Technology"
  type: 'BTech' | 'MTech' | 'PhD' | 'BCA' | 'MCA' | 'BSc' | 'MSc' | 'Diploma' | 'Other';
  totalSemesters: number;  // e.g. 8 for BTech
}

export interface IDepartment extends Document {
  name: string;       // e.g. "Computer Science and Engineering"
  code: string;       // e.g. "CSE" — unique slug used across the platform
  programs: IProgram[];
  isActive: boolean;
  hodName?: string;   // Head of Department name
  hodEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['BTech', 'MTech', 'PhD', 'BCA', 'MCA', 'BSc', 'MSc', 'Diploma', 'Other'],
    required: true
  },
  totalSemesters: { type: Number, required: true, min: 1, max: 16, default: 8 }
}, { _id: false });

const DepartmentSchema = new Schema<IDepartment>({
  name:      { type: String, required: true, trim: true },
  code:      { type: String, required: true, unique: true, uppercase: true, trim: true },
  programs:  { type: [ProgramSchema], default: [] },
  isActive:  { type: Boolean, default: true },
  hodName:   { type: String },
  hodEmail:  { type: String },
}, { timestamps: true });

export default mongoose.model<IDepartment>('Department', DepartmentSchema);
