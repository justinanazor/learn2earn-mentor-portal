import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Fellow from '../models/Fellow.js';
import DailyLog from '../models/DailyLog.js';
import Assessment from '../models/Assessment.js';
import WeeklyReview from '../models/WeeklyReview.js';
import Action from '../models/Action.js';
import { adminOnly } from '../middleware/auth.js';
import { renameMentorReferences } from '../utils/mentor.js';

const router = Router();
router.use(adminOnly);

const groups = ['Group A','Group B'];
const normalizeEmail = value => String(value || '').trim().toLowerCase();
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const publicUser = user => ({id:user._id,name:user.name,email:user.email,role:user.role,groups:user.groups||[],active:user.active,createdAt:user.createdAt});

async function mentorNameInUse(name, excludeId) {
  const mentors = await User.find({role:'mentor',...(excludeId?{_id:{$ne:excludeId}}:{})}).select('name').lean();
  return mentors.some(mentor => mentor.name.toLowerCase() === name.toLowerCase());
}

router.get('/users', async (_req,res) => {
  const users = await User.find().select('-password -sessionVersion').sort({role:1,name:1}).lean();
  res.json(users.map(publicUser));
});

router.post('/users', async (req,res) => {
  const {name,email,password,role='mentor'} = req.body || {};
  const requestedGroups = req.body?.groups;
  const nextName = String(name || '').trim();
  const nextEmail = normalizeEmail(email);
  if (!nextName || nextName.length > 120) return res.status(400).json({message:'Name is required and must be 120 characters or fewer.'});
  if (!validEmail(nextEmail)) return res.status(400).json({message:'Enter a valid email address.'});
  if (!['admin','mentor'].includes(role)) return res.status(400).json({message:'Role must be admin or mentor.'});
  if (role === 'mentor' && (!Array.isArray(requestedGroups) || !requestedGroups.length || requestedGroups.some(group=>!groups.includes(group)))) return res.status(400).json({message:'Assign at least one valid group to the mentor.'});
  if (typeof password !== 'string' || password.length < 12) return res.status(400).json({message:'Initial passwords must be at least 12 characters long.'});
  if (await User.exists({email:nextEmail})) return res.status(409).json({message:'An account with this email already exists.'});
  if (role === 'mentor' && await mentorNameInUse(nextName)) return res.status(409).json({message:'Another mentor already uses this name.'});
  const user = await User.create({name:nextName,email:nextEmail,password:await bcrypt.hash(password,12),role,groups:role==='mentor'?[...new Set(requestedGroups)]:[],active:true});
  res.status(201).json(publicUser(user));
});

router.patch('/users/:id', async (req,res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:'Invalid user ID.'});
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({message:'User not found.'});
  const body = req.body || {};
  const nextName = body.name === undefined ? user.name : String(body.name).trim();
  const nextEmail = body.email === undefined ? user.email : normalizeEmail(body.email);
  const nextRole = body.role === undefined ? user.role : body.role;
  const nextActive = body.active === undefined ? user.active : body.active;
  const requestedGroups = body.groups === undefined ? (nextRole===user.role?user.groups||[]:[]) : body.groups;

  if (!nextName || nextName.length > 120) return res.status(400).json({message:'Name is required and must be 120 characters or fewer.'});
  if (!validEmail(nextEmail)) return res.status(400).json({message:'Enter a valid email address.'});
  if (!['admin','mentor'].includes(nextRole)) return res.status(400).json({message:'Role must be admin or mentor.'});
  if (!Array.isArray(requestedGroups) || requestedGroups.some(group=>!groups.includes(group)) || (nextRole==='mentor'&&!requestedGroups.length) || (nextRole==='admin'&&requestedGroups.length)) return res.status(400).json({message:nextRole==='mentor'?'Assign at least one valid group to the mentor.':'Administrators cannot be assigned to mentor groups.'});
  if (typeof nextActive !== 'boolean') return res.status(400).json({message:'Active status must be true or false.'});
  if (body.password !== undefined && body.password !== '' && (typeof body.password !== 'string' || body.password.length < 12)) return res.status(400).json({message:'New passwords must be at least 12 characters long.'});
  if (await User.exists({email:nextEmail,_id:{$ne:user._id}})) return res.status(409).json({message:'An account with this email already exists.'});
  if (nextRole === 'mentor' && await mentorNameInUse(nextName,user._id)) return res.status(409).json({message:'Another mentor already uses this name.'});

  const isSelf = user._id.equals(req.user._id);
  if (isSelf) return res.status(400).json({message:'Use My profile to update your own account.'});
  if (user.role === 'admin' && user.active && (nextRole !== 'admin' || !nextActive)) {
    const activeAdmins = await User.countDocuments({role:'admin',active:true});
    if (activeAdmins <= 1) return res.status(400).json({message:'The last active administrator cannot be demoted or deactivated.'});
  }
  const removedGroups = user.role==='mentor'?(user.groups||[]).filter(group=>nextRole!=='mentor'||!requestedGroups.includes(group)):[];
  if (removedGroups.length && await Fellow.exists({group:{$in:removedGroups},assignedMentor:user.name,active:true})) return res.status(409).json({message:'Reassign this mentor’s active fellows before removing their group access.'});
  if (user.role === 'mentor' && (nextRole !== 'mentor' || !nextActive)) {
    const assigned = await Fellow.countDocuments({assignedMentor:user.name,active:true});
    if (assigned) return res.status(409).json({message:'Reassign this mentor’s active fellows before changing their role or deactivating the account.'});
  }

  const shouldRenameMentor = user.role === 'mentor' && nextRole === 'mentor' && user.name !== nextName;
  if (shouldRenameMentor) await renameMentorReferences(user.name,nextName);
  user.name = nextName;
  user.email = nextEmail;
  user.role = nextRole;
  user.groups = nextRole==='mentor'?[...new Set(requestedGroups)]:[];
  user.active = nextActive;
  if (typeof body.password === 'string' && body.password) {
    user.password = await bcrypt.hash(body.password,12);
    user.sessionVersion += 1;
  }
  await user.save();
  res.json(publicUser(user));
});

router.delete('/users/:id', async (req,res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:'Invalid user ID.'});
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({message:'User not found.'});
  if (user._id.equals(req.user._id)) return res.status(400).json({message:'You cannot delete your own account.'});
  if (user.role==='admin'&&user.active&&await User.countDocuments({role:'admin',active:true})<=1) return res.status(409).json({message:'The last active administrator cannot be deleted.'});
  if (user.role==='mentor'&&await Fellow.exists({assignedMentor:user.name,active:true})) return res.status(409).json({message:'Reassign this mentor’s active fellows before deleting the account.'});
  await user.deleteOne();
  res.json({message:'User account deleted.'});
});

router.get('/mentor-progress', async (_req,res) => {
  const [users,fellows,dailyLogs,assessments,weeklyReviews,actions] = await Promise.all([
    User.find({role:'mentor'}).select('_id name email groups active').sort({name:1}).lean(),
    Fellow.aggregate([{$match:{active:true}},{$group:{_id:'$assignedMentor',totalFellows:{$sum:1},onTrack:{$sum:{$cond:[{$eq:['$overallStanding','On track']},1,0]}},needsAttention:{$sum:{$cond:[{$eq:['$overallStanding','Needs attention']},1,0]}},atRisk:{$sum:{$cond:[{$eq:['$overallStanding','At risk']},1,0]}},escalated:{$sum:{$cond:[{$eq:['$overallStanding','Escalated']},1,0]}},completedProjects:{$sum:{$cond:[{$eq:['$projectStatus','Completed']},1,0]}},blockedProjects:{$sum:{$cond:[{$eq:['$projectStatus','Blocked']},1,0]}},lmsInactive:{$sum:{$cond:[{$eq:['$lmsStatus','Inactive']},1,0]}}}}]),
    DailyLog.aggregate([{$group:{_id:'$mentor',dailyLogs:{$sum:1},lastDailyLog:{$max:'$date'}}}]),
    Assessment.aggregate([{$group:{_id:'$mentor',assessments:{$sum:1},averageScore:{$avg:'$score'},lastAssessment:{$max:'$date'}}}]),
    WeeklyReview.aggregate([{$group:{_id:'$mentor',weeklyReviews:{$sum:1},lastWeeklyReview:{$max:'$weekStarting'}}}]),
    Action.aggregate([{$group:{_id:'$mentor',openActions:{$sum:{$cond:[{$in:['$status',['Open','In progress','Awaiting response','Escalated']]},1,0]}},lastAction:{$max:'$dateRaised'}}}])
  ]);
  const byName = new Map(users.map(user => [user.name,{id:user._id,name:user.name,email:user.email,groups:user.groups||[],active:user.active,totalFellows:0,onTrack:0,needsAttention:0,atRisk:0,escalated:0,completedProjects:0,blockedProjects:0,lmsInactive:0,dailyLogs:0,assessments:0,averageScore:null,weeklyReviews:0,openActions:0,lastActivity:null}]));
  const ensure = name => {
    if (!name) return null;
    if (!byName.has(name)) byName.set(name,{id:null,name,email:'',groups:[],active:false,totalFellows:0,onTrack:0,needsAttention:0,atRisk:0,escalated:0,completedProjects:0,blockedProjects:0,lmsInactive:0,dailyLogs:0,assessments:0,averageScore:null,weeklyReviews:0,openActions:0,lastActivity:null});
    return byName.get(name);
  };
  for (const row of fellows) {
    const mentor=ensure(row._id);
    if (mentor) for (const [key,value] of Object.entries(row)) if (key!=='_id') mentor[key]=value;
  }
  for (const [rows,countField,dateField] of [[dailyLogs,'dailyLogs','lastDailyLog'],[assessments,'assessments','lastAssessment'],[weeklyReviews,'weeklyReviews','lastWeeklyReview'],[actions,'openActions','lastAction']]) {
    for (const row of rows) {
      const mentor=ensure(row._id);
      if (!mentor) continue;
      mentor[countField]=row[countField];
      if (countField==='assessments') mentor.averageScore=row.averageScore==null?null:Math.round(row.averageScore*10)/10;
      if (row[dateField] && (!mentor.lastActivity || row[dateField]>mentor.lastActivity)) mentor.lastActivity=row[dateField];
    }
  }
  res.json([...byName.values()].sort((a,b)=>a.name.localeCompare(b.name)));
});

export default router;
