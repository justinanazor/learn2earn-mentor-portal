import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  fellow: { type: mongoose.Schema.Types.ObjectId, ref: 'Fellow', required: true },
  date: { type: Date, required: true },
  mentor: { type: String, required: true },
  attendance: { type: String, enum: ['Present','Absent','Late','Approved absence'], default: 'Present' },
  objective: String, taskStatus: { type: String, enum: ['Completed','Partially completed','Not completed','Not assigned'], default: 'Not assigned' },
  learningActivity: String, lmsStatus: { type: String, enum: ['On track','Behind','Inactive','Not checked'], default: 'Not checked' },
  projectWork: String, projectStatus: { type: String, enum: ['Not started','Planning','In progress','Testing','Completed','Blocked'], default: 'In progress' },
  productivity: { type: Number, min: 1, max: 5 }, understanding: { type: Number, min: 1, max: 5 }, independence: { type: Number, min: 1, max: 5 }, participation: { type: Number, min: 1, max: 5 },
  blocker: String, intervention: String, evidenceChecked: String, evidenceLink: String, nextAction: String, escalationRequired: { type: Boolean, default: false }, notes: String
}, { timestamps: true });
schema.index({ fellow: 1, date: 1 }, { unique: true });
export default mongoose.model('DailyLog', schema);
