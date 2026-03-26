import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentMeta extends Document {
  title: string;
  department?: string;
  uploadedAt: Date;
  chromaCollectionRef: string;
}

const DocumentMetaSchema: Schema = new Schema({
  title: { type: String, required: true },
  department: { type: String, required: false },
  uploadedAt: { type: Date, default: Date.now },
  chromaCollectionRef: { type: String, required: true },
});

export default mongoose.model<IDocumentMeta>('DocumentMeta', DocumentMetaSchema);
