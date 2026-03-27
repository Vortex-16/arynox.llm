import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentMeta extends Document {
  title: string;
  department?: string;
  className?: string;   // e.g. "Second Year"
  semester?: string;    // e.g. "Semester 3"
  subject?: string;     // e.g. "Thermodynamics"
  chapter?: string;     // e.g. "Chapter 2 - Laws of Motion"
  section?: string;     // e.g. "Section 2.1"
  module?: string;      // e.g. "Module 1"
  uploadedAt: Date;
  chromaCollectionRef: string;
  fileUrl?: string;
}

const DocumentMetaSchema: Schema = new Schema({
  title: { type: String, required: true },
  department: { type: String, required: false },
  className: { type: String, required: false },
  semester: { type: String, required: false },
  subject: { type: String, required: false },
  chapter: { type: String, required: false },
  section: { type: String, required: false },
  module: { type: String, required: false },
  uploadedAt: { type: Date, default: Date.now },
  chromaCollectionRef: { type: String, required: true },
  fileUrl: { type: String, required: false },
});

export default mongoose.model<IDocumentMeta>('DocumentMeta', DocumentMetaSchema);
