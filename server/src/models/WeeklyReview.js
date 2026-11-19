import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  fellow: { type: mongoose.Schema.Types.ObjectId, ref: 'Fellow', required: true }, mentor: String,
  weekStarting: { type: Date, required: true }, weekEnding: { type: Date, required: true }, attendanceSummary: String,
  learningProgress: String, milestones: String, projectStatus: String, assessmentOutcome: String,
  strengths: String, gaps: String, interventions: String, managementIntervention: { type: Boolean, default: false },
  nextWeekActions: String, evidenceLinks: String, summary: String
}, { timestamps: true });
schema.index({ fellow: 1, weekStarting: 1 }, { unique: true });
export default mongoose.model('WeeklyReview', schema);
