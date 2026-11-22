import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'mentor'], default: 'mentor' },
  groups: { type: [String], enum: ['Group A', 'Group B'], default: [] },
  active: { type: Boolean, default: true },
  sessionVersion: { type: Number, default: 0 },
  passwordResetTokenHash: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null }
}, { timestamps: true });
export default mongoose.model('User', userSchema);
