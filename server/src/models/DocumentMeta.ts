import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentMeta extends Document {
  title: string;
  department?: string;
  uploadedAt: Date;
  chromaCollectionRef: string;
  fileUrl?: string; // New field for viewing the PDF natively
}

const DocumentMetaSchema: Schema = new Schema({
  title: { type: String, required: true },
  department: { type: String, required: false },
  uploadedAt: { type: Date, default: Date.now },
  chromaCollectionRef: { type: String, required: true },
  fileUrl: { type: String, required: false },
});

export default mongoose.model<IDocumentMeta>('DocumentMeta', DocumentMetaSchema);
