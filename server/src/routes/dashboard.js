import { Router } from 'express';
import Fellow from '../models/Fellow.js';
import DailyLog from '../models/DailyLog.js';
import Assessment from '../models/Assessment.js';
import Action from '../models/Action.js';
import WeeklyReview from '../models/WeeklyReview.js';
const router=Router();
router.get('/',async(req,res)=>{
 const ownerFilter=req.user.role==='mentor'?{assignedMentor:req.user.name}:{};
 const [total,byMentor,onTrack,needsAttention,atRisk,escalated,lmsInactive,blocked,openActions,assessmentCount,dailyToday,weeklyCount]=await Promise.all([
  Fellow.countDocuments({group:'Group B',active:true,...ownerFilter}),
  Fellow.aggregate([{$match:{group:'Group B',active:true,...ownerFilter}},{$group:{_id:'$assignedMentor',count:{$sum:1}}}]),
  Fellow.countDocuments({group:'Group B',active:true,...ownerFilter,overallStanding:'On track'}),
  Fellow.countDocuments({group:'Group B',active:true,...ownerFilter,overallStanding:'Needs attention'}),
  Fellow.countDocuments({group:'Group B',active:true,...ownerFilter,overallStanding:'At risk'}),
  Fellow.countDocuments({group:'Group B',active:true,...ownerFilter,overallStanding:'Escalated'}),
  Fellow.countDocuments({group:'Group B',active:true,...ownerFilter,lmsStatus:'Inactive'}),
  Fellow.countDocuments({group:'Group B',active:true,...ownerFilter,projectStatus:'Blocked'}),
  Action.countDocuments({...(req.user.role==='mentor'?{fellow:{$in:await Fellow.find(ownerFilter).distinct('_id')}}:{}),status:{$in:['Open','In progress','Awaiting response','Escalated']}}),
  Assessment.countDocuments(req.user.role==='mentor'?{fellow:{$in:await Fellow.find(ownerFilter).distinct('_id')}}:{}),
  DailyLog.countDocuments({...(req.user.role==='mentor'?{fellow:{$in:await Fellow.find(ownerFilter).distinct('_id')}}:{}),date:{$gte:new Date(new Date().setHours(0,0,0,0))}}),
  WeeklyReview.countDocuments(req.user.role==='mentor'?{fellow:{$in:await Fellow.find(ownerFilter).distinct('_id')}}:{})
 ]);
 const ownedIds=req.user.role==='mentor'?await Fellow.find(ownerFilter).distinct('_id'):null;
 const recentActions=await Action.find({...(ownedIds?{fellow:{$in:ownedIds}}:{}),status:{$ne:'Closed'}}).populate('fellow','name').sort({dueDate:1}).limit(8);
 const recentAssessments=await Assessment.find(ownedIds?{fellow:{$in:ownedIds}}:{}).populate('fellow','name').sort({date:-1}).limit(6);
 res.json({total,byMentor,onTrack,needsAttention,atRisk,escalated,lmsInactive,blocked,openActions,assessmentCount,dailyToday,weeklyCount,recentActions,recentAssessments});
});
export default router;
