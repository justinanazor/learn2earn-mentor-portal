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
for (const [path,{model,sort}] of Object.entries(config)) {
  router.get(`/${path}`, async (req,res) => {
    const filter = {};
    if(req.query.fellow) filter.fellow=req.query.fellow;
    if(req.user.role==='mentor') { const owned=await Fellow.find({assignedMentor:req.user.name,active:true}).distinct('_id'); filter.fellow={$in:owned}; }
    if(req.query.mentor) filter.mentor=req.query.mentor;
    if(req.query.status) filter.status=req.query.status;
    res.json(await model.find(filter).populate('fellow','name fellowId assignedMentor').sort(sort).limit(Number(req.query.limit)||500));
  });
  router.post(`/${path}`, async (req,res) => {
    const payload={...req.body};
    const owner=await Fellow.findById(payload.fellow);
    if(!owner || (req.user.role==='mentor' && owner.assignedMentor!==req.user.name)) return res.status(403).json({message:'You can only create records for your assigned fellows'});
    payload.mentor=owner.assignedMentor;
    if(path==='assessments') {
      const keys=['problemUnderstanding','technicalExplanation','codeQuality','debugging','independentModification','lmsConsistency','delivery','professionalism'];
      const values=keys.map(k=>Number(payload[k])).filter(n=>Number.isFinite(n)&&n>=1&&n<=5);
      payload.score=values.length===8 ? Math.round(values.reduce((a,b)=>a+b,0)/8/5*1000)/10 : undefined;
      payload.outcome=payload.score==null?'Pending':payload.score>=85?'Strong':payload.score>=70?'On track':payload.score>=50?'Needs support':'At risk';
    }
    const record=await model.create(payload);
    if(path==='assessments' && record.score!=null) await Fellow.findByIdAndUpdate(record.fellow,{ $set:{overallStanding:record.score<50?'At risk':record.score<70?'Needs attention':'On track'} });
    res.status(201).json(await record.populate('fellow','name fellowId assignedMentor'));
  });
  router.patch(`/${path}/:id`, async (req,res) => {
    const existing=await model.findById(req.params.id).populate('fellow');
    if(!existing || (req.user.role==='mentor' && existing.fellow?.assignedMentor!==req.user.name)) return res.status(404).json({message:'Record not found'});
    const record=await model.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}).populate('fellow','name fellowId assignedMentor');
    res.json(record);
  });
  router.delete(`/${path}/:id`, async (req,res) => { const record=await model.findByIdAndDelete(req.params.id); if(!record) return res.status(404).json({message:'Record not found'}); res.json({message:'Record deleted'}); });
}
export default router;
