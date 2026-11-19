import { Router } from 'express';
import Fellow from '../models/Fellow.js';
import Assessment from '../models/Assessment.js';
const router = Router();
router.get('/', async (req,res) => {
  const { mentor, search, standing, group='Group B' } = req.query;
  const filter = { group, active: true };
  if (req.user.role === 'mentor') filter.assignedMentor = req.user.name;
  else if (mentor) filter.assignedMentor = mentor;
  if (standing) filter.overallStanding = standing;
  if (search) filter.name = { $regex: search, $options: 'i' };
  res.json(await Fellow.find(filter).sort({name:1}));
});
router.post('/', async (req,res) => {
  const data = {...req.body};
  if (req.user.role === 'mentor') data.assignedMentor = req.user.name;
  const count = await Fellow.countDocuments({group:data.group || 'Group B'});
  const fellow = await Fellow.create({...data, fellowId:data.fellowId || `GB-${String(count+1).padStart(3,'0')}`});
  res.status(201).json(fellow);
});
router.get('/:id', async (req,res) => { const f=await Fellow.findById(req.params.id); if(!f || (req.user.role==='mentor' && f.assignedMentor!==req.user.name)) return res.status(404).json({message:'Fellow not found'}); res.json(f); });
router.patch('/:id', async (req,res) => { const existing=await Fellow.findById(req.params.id); if(!existing || (req.user.role==='mentor' && existing.assignedMentor!==req.user.name)) return res.status(404).json({message:'Fellow not found'}); const payload={...req.body}; if(req.user.role==='mentor') payload.assignedMentor=req.user.name; const f=await Fellow.findByIdAndUpdate(req.params.id,payload,{new:true,runValidators:true}); res.json(f); });
router.delete('/:id', async (req,res) => { const existing=await Fellow.findById(req.params.id); if(!existing || (req.user.role==='mentor' && existing.assignedMentor!==req.user.name)) return res.status(404).json({message:'Fellow not found'}); await Fellow.findByIdAndUpdate(req.params.id,{active:false}); res.json({message:'Fellow archived'}); });
router.get('/:id/history', async (req,res) => {
  const owner=await Fellow.findById(req.params.id); if(!owner || (req.user.role==='mentor' && owner.assignedMentor!==req.user.name)) return res.status(404).json({message:'Fellow not found'});
  const [assessments, daily, weekly] = await Promise.all([
    Assessment.find({fellow:req.params.id}).sort({date:-1}).limit(20),
    (await import('../models/DailyLog.js')).default.find({fellow:req.params.id}).sort({date:-1}).limit(20),
    (await import('../models/WeeklyReview.js')).default.find({fellow:req.params.id}).sort({weekStarting:-1}).limit(12)
  ]);
  res.json({assessments,daily,weekly});
});
export default router;
