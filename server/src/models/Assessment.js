import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  fellow: { type: mongoose.Schema.Types.ObjectId, ref: 'Fellow', required: true },
  date: { type: Date, default: Date.now }, mentor: String, projectTitle: String,
  developmentMode: { type: String, enum: ['Developed from scratch','Vibe coded','Coded along with AI',''] },
  aiContribution: { type: String, enum: ['0%','25%','50%','75%','90%',''] },
  problemUnderstanding: { type: Number, min: 1, max: 5 }, technicalExplanation: { type: Number, min: 1, max: 5 }, codeQuality: { type: Number, min: 1, max: 5 }, debugging: { type: Number, min: 1, max: 5 }, independentModification: { type: Number, min: 1, max: 5 }, lmsConsistency: { type: Number, min: 1, max: 5 }, delivery: { type: Number, min: 1, max: 5 }, professionalism: { type: Number, min: 1, max: 5 },
  evidenceReviewed: String, remarks: String, improvementPlan: String, score: Number, outcome: String
}, { timestamps: true });
export default mongoose.model('Assessment', schema);
