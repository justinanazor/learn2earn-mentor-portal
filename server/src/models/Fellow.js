import mongoose from 'mongoose';
const fellowSchema = new mongoose.Schema({
  fellowId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, trim: true },
  campus: { type: String, default: 'Abuja' },
  group: { type: String, default: 'Group B' },
  assignedMentor: { type: String, required: true, trim: true },
  attendanceReliability: { type: String, default: '' },
  currentProject: { type: String, default: '' },
  projectStatus: { type: String, enum: ['Not started','Planning','In progress','Testing','Completed','Blocked'], default: 'Not started' },
  developmentMode: { type: String, enum: ['Developed from scratch','Vibe coded','Coded along with AI',''], default: '' },
  aiContribution: { type: String, enum: ['0%','25%','50%','75%','90%',''], default: '' },
  lmsStatus: { type: String, enum: ['On track','Behind','Inactive','Not checked'], default: 'Not checked' },
  learningProgress: { type: String, default: '' },
  overallStanding: { type: String, enum: ['On track','Needs attention','At risk','Escalated'], default: 'On track' },
  strengths: { type: String, default: '' },
  performanceGap: { type: String, default: '' },
  nextFollowUp: { type: Date },
  evidenceLink: { type: String, default: '' },
  codingMentorRemark: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });
fellowSchema.index({ name: 1, group: 1 }, { unique: true });
export default mongoose.model('Fellow', fellowSchema);
