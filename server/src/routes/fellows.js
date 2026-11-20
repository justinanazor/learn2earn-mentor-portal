import { Router } from 'express';
import Fellow from '../models/Fellow.js';
import Assessment from '../models/Assessment.js';
import User from '../models/User.js';
const router = Router();
const groups = ['Group A','Group B'];

async function validateMentor(name,group,res) {
  const mentor = name && await User.findOne({name,role:'mentor',active:true}).select('groups').lean();
  if (!mentor || !mentor.groups?.includes(group)) {
    res.status(400).json({message:'Select an active mentor assigned to this group.'});
    return false;
  }
  return true;
}

function canAccessGroup(user,group) {
  return user.role !== 'mentor' || user.groups?.includes(group);
}

router.get('/', async (req,res) => {
  const { mentor, search, standing } = req.query;
  const requestedGroup = req.query.group;
  let visibleGroups;
  if (req.user.role === 'mentor') {
    visibleGroups = req.user.groups || [];
    if (requestedGroup && !visibleGroups.includes(requestedGroup)) return res.status(403).json({message:'You are not assigned to this group.'});
    if (requestedGroup) visibleGroups = [requestedGroup];
  } else {
    const group = requestedGroup || 'Group B';
    if (!groups.includes(group)) return res.status(400).json({message:'Select a valid group.'});
    visibleGroups = [group];
  }
  const filter = { group:{$in:visibleGroups}, active:true };
  if (req.user.role === 'admin' && mentor) filter.assignedMentor = mentor;
  if (standing) filter.overallStanding = standing;
  if (search) filter.name = { $regex: search, $options: 'i' };
  res.json(await Fellow.find(filter).sort({name:1}));
});

router.post('/', async (req,res) => {
  if (req.user.role !== 'admin') return res.status(403).json({message:'Only administrators can add fellows.'});
  const data = {...req.body};
  data.name = String(data.name || '').trim();
  data.group = data.group || 'Group B';
  if (!data.name) return res.status(400).json({message:'Fellow name is required.'});
  if (!groups.includes(data.group)) return res.status(400).json({message:'Select a valid group.'});
  if (!await validateMentor(data.assignedMentor,data.group,res)) return;
  if (await Fellow.exists({name:data.name,group:data.group})) return res.status(409).json({message:'A fellow with this name already exists in this group.'});
  const count = await Fellow.countDocuments({group:data.group});
  const prefix = data.group === 'Group A' ? 'GA' : 'GB';
  const fellow = await Fellow.create({...data, fellowId:data.fellowId || `${prefix}-${String(count+1).padStart(3,'0')}`});
  res.status(201).json(fellow);
});

router.get('/:id', async (req,res) => {
  const fellow=await Fellow.findById(req.params.id);
  if (!fellow || !canAccessGroup(req.user,fellow.group)) return res.status(404).json({message:'Fellow not found'});
  res.json(fellow);
});

router.patch('/:id', async (req,res) => {
  const existing=await Fellow.findById(req.params.id);
  if (!existing || !canAccessGroup(req.user,existing.group)) return res.status(404).json({message:'Fellow not found'});
  const payload={...req.body};
  if (req.user.role === 'mentor') {
    payload.group = existing.group;
    payload.assignedMentor = existing.assignedMentor;
  } else {
    const nextGroup = payload.group || existing.group;
    const nextMentor = payload.assignedMentor || existing.assignedMentor;
    if (!groups.includes(nextGroup)) return res.status(400).json({message:'Select a valid group.'});
    if (!await validateMentor(nextMentor,nextGroup,res)) return;
  }
  const fellow=await Fellow.findByIdAndUpdate(req.params.id,payload,{new:true,runValidators:true});
  res.json(fellow);
});

router.delete('/:id', async (req,res) => {
  const existing=await Fellow.findById(req.params.id);
  if (!existing || !canAccessGroup(req.user,existing.group)) return res.status(404).json({message:'Fellow not found'});
  await Fellow.findByIdAndUpdate(req.params.id,{active:false});
  res.json({message:'Fellow archived'});
});

router.get('/:id/history', async (req,res) => {
  const owner=await Fellow.findById(req.params.id);
  if (!owner || !canAccessGroup(req.user,owner.group)) return res.status(404).json({message:'Fellow not found'});
  const [assessments, daily, weekly] = await Promise.all([
    Assessment.find({fellow:req.params.id}).sort({date:-1}).limit(20),
    (await import('../models/DailyLog.js')).default.find({fellow:req.params.id}).sort({date:-1}).limit(20),
    (await import('../models/WeeklyReview.js')).default.find({fellow:req.params.id}).sort({weekStarting:-1}).limit(12)
  ]);
  res.json({assessments,daily,weekly});
});
export default router;
