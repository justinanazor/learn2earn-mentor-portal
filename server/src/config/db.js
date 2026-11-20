import mongoose from 'mongoose';
import User from '../models/User.js';
import Fellow from '../models/Fellow.js';
export async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.updateMany({role:'mentor',groups:{$exists:false}},{$set:{groups:[]}});
  const assignments=await Fellow.aggregate([{$match:{active:true}},{$group:{_id:'$assignedMentor',groups:{$addToSet:'$group'}}}]);
  await Promise.all(assignments.map(({_id,groups})=>User.updateOne({name:_id,role:'mentor'},{$addToSet:{groups:{$each:groups.filter(group=>['Group A','Group B'].includes(group))}}})));
  console.log('MongoDB connected');
}
