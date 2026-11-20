import { Router } from 'express';
import DailyLog from '../models/DailyLog.js';
import Assessment from '../models/Assessment.js';
import WeeklyReview from '../models/WeeklyReview.js';
import Action from '../models/Action.js';
import Fellow from '../models/Fellow.js';
const router = Router();
const config = {
  daily: {model:DailyLog, sort:{date:-1}}, assessments:{model:Assessment,sort:{date:-1}},
  weekly:{model:WeeklyReview,sort:{weekStarting:-1}}, actions:{model:Action,sort:{createdAt:-1}}
};
const populatedFellow='name fellowId assignedMentor group';
const canAccessFellow=(user,fellow)=>user.role!=='mentor'||user.groups?.includes(fellow?.group);

for (const [path,{model,sort}] of Object.entries(config)) {
  router.get(`/${path}`, async (req,res) => {
    const filter = {};
    let visibleIds;
    if (req.query.group) {
      if (!['Group A','Group B'].includes(req.query.group)) return res.status(400).json({message:'Select a valid group.'});
      if (!canAccessFellow(req.user,{group:req.query.group})) return res.status(403).json({message:'You are not assigned to this group.'});
      visibleIds=await Fellow.find({group:req.query.group}).distinct('_id');
    } else if (req.user.role==='mentor') {
      visibleIds=await Fellow.find({group:{$in:req.user.groups||[]}}).distinct('_id');
    }
    if (visibleIds) {
      if (req.query.fellow) {
        if (!visibleIds.some(id=>String(id)===String(req.query.fellow))) return res.status(403).json({message:'You cannot access records for this fellow.'});
        filter.fellow=req.query.fellow;
      } else filter.fellow={$in:visibleIds};
    } else if (req.query.fellow) filter.fellow=req.query.fellow;
    if(req.query.mentor) filter.mentor=req.query.mentor;
    if(req.query.status) filter.status=req.query.status;
    res.json(await model.find(filter).populate('fellow',populatedFellow).sort(sort).limit(Number(req.query.limit)||500));
  });
  router.post(`/${path}`, async (req,res) => {
    const payload={...req.body};
    const owner=await Fellow.findById(payload.fellow);
    if(!owner || !canAccessFellow(req.user,owner)) return res.status(403).json({message:'You can only create records for fellows in your assigned groups.'});
    payload.mentor=req.user.role==='mentor'?req.user.name:owner.assignedMentor;
    if(path==='assessments') {
      const keys=['problemUnderstanding','technicalExplanation','codeQuality','debugging','independentModification','lmsConsistency','delivery','professionalism'];
      const values=keys.map(k=>Number(payload[k])).filter(n=>Number.isFinite(n)&&n>=1&&n<=5);
      payload.score=values.length===8 ? Math.round(values.reduce((a,b)=>a+b,0)/8/5*1000)/10 : undefined;
      payload.outcome=payload.score==null?'Pending':payload.score>=85?'Strong':payload.score>=70?'On track':payload.score>=50?'Needs support':'At risk';
    }
    const record=await model.create(payload);
    if(path==='assessments' && record.score!=null) await Fellow.findByIdAndUpdate(record.fellow,{ $set:{overallStanding:record.score<50?'At risk':record.score<70?'Needs attention':'On track'} });
    res.status(201).json(await record.populate('fellow',populatedFellow));
  });
  router.patch(`/${path}/:id`, async (req,res) => {
    const existing=await model.findById(req.params.id).populate('fellow');
    if(!existing || !canAccessFellow(req.user,existing.fellow)) return res.status(404).json({message:'Record not found'});
    const payload=req.user.role==='mentor'?{...req.body,fellow:existing.fellow._id,mentor:req.user.name}:req.body;
    const record=await model.findByIdAndUpdate(req.params.id,payload,{new:true,runValidators:true}).populate('fellow',populatedFellow);
    res.json(record);
  });
  router.delete(`/${path}/:id`, async (req,res) => {
    const record=await model.findById(req.params.id).populate('fellow');
    if(!record || !canAccessFellow(req.user,record.fellow)) return res.status(404).json({message:'Record not found'});
    await record.deleteOne();
    res.json({message:'Record deleted'});
  });
}
export default router;
