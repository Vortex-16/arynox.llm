import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  // Auth identifiers
  googleId?: string;
  email: string;
  name: string;
  password?: string;    // Hashed — only for email+password auth
  avatar?: string;

  // Role & onboarding state
  role: 'student' | 'teacher' | 'admin';
  onboardingComplete: boolean;  // false until /api/auth/onboarding is called

  // ── Faculty profile (set during onboarding) ─────────────────────────────────
  department?: string;      // "CSE" — primary department they teach in
  subjects?: string[];      // ["Data Structures", "Algorithms"]
  semesters?: string[];     // ["Sem 3", "Sem 4"]
  classYears?: string[];    // ["2nd Year", "3rd Year"]

  // ── Student profile (set during onboarding) ──────────────────────────────────
  className?: string;       // "2nd Year"
  semester?: string;        // "Sem 3"

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  googleId: { type: String, unique: true, sparse: true },
  email:    { type: String, required: true, unique: true },
  name:     { type: String, required: true },
  password: { type: String, select: false },  // never returned by default
  avatar:   { type: String },

  role:               { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  onboardingComplete: { type: Boolean, default: false },

  // Faculty fields
  department: { type: String },
  subjects:   [{ type: String }],
  semesters:  [{ type: String }],
  classYears: [{ type: String }],

  // Student fields
  className: { type: String },
  semester:  { type: String },
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
