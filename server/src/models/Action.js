import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  fellow: { type: mongoose.Schema.Types.ObjectId, ref: 'Fellow', required: true }, mentor: String,
  dateRaised: { type: Date, default: Date.now }, issue: { type: String, required: true },
  priority: { type: String, enum: ['Low','Medium','High','Urgent'], default: 'Medium' }, actionRequired: String, owner: String,
  dueDate: Date, status: { type: String, enum: ['Open','In progress','Awaiting response','Closed','Escalated'], default: 'Open' },
  dateClosed: Date, outcomeEvidence: String, escalatedTo: String, followUpNotes: String
}, { timestamps: true });
export default mongoose.model('Action', schema);
