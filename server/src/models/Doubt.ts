import mongoose, { Schema, Document } from 'mongoose';

export interface IDoubt extends Document {
    studentId: string;
    studentName: string;
    teacherId: string;
    subject: string;
    module?: string;
    question: string;
    answer?: string;
    status: 'pending' | 'resolved'; // Teacher can mark it as resolved
    createdAt: Date;
    updatedAt: Date;
}

const DoubtSchema: Schema = new Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    teacherId: { type: String, required: true },
    subject: { type: String, required: true },
    module: { type: String },
    question: { type: String, required: true },
    answer: { type: String },
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' }
}, {
    timestamps: true
});

export default mongoose.model<IDoubt>('Doubt', DoubtSchema);
