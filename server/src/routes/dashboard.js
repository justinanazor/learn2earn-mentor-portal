import { Router } from 'express';
import Fellow from '../models/Fellow.js';
import DailyLog from '../models/DailyLog.js';
import Assessment from '../models/Assessment.js';
import Action from '../models/Action.js';
import WeeklyReview from '../models/WeeklyReview.js';
const router=Router();

router.get('/',async(req,res)=>{
 const groupFilter=req.user.role==='mentor'?{group:{$in:req.user.groups||[]}}:{};
 const activeFellowFilter={...groupFilter,active:true};
 const ownedIds=req.user.role==='mentor'?await Fellow.find(activeFellowFilter).distinct('_id'):null;
 const recordFilter=ownedIds?{fellow:{$in:ownedIds}}:{};
 const [total,byMentor,onTrack,needsAttention,atRisk,escalated,lmsInactive,blocked,openActions,assessmentCount,dailyToday,weeklyCount]=await Promise.all([
  Fellow.countDocuments(activeFellowFilter),
  Fellow.aggregate([{$match:activeFellowFilter},{$group:{_id:'$assignedMentor',count:{$sum:1}}}]),
  Fellow.countDocuments({...activeFellowFilter,overallStanding:'On track'}),
  Fellow.countDocuments({...activeFellowFilter,overallStanding:'Needs attention'}),
  Fellow.countDocuments({...activeFellowFilter,overallStanding:'At risk'}),
  Fellow.countDocuments({...activeFellowFilter,overallStanding:'Escalated'}),
  Fellow.countDocuments({...activeFellowFilter,lmsStatus:'Inactive'}),
  Fellow.countDocuments({...activeFellowFilter,projectStatus:'Blocked'}),
  Action.countDocuments({...recordFilter,status:{$in:['Open','In progress','Awaiting response','Escalated']}}),
  Assessment.countDocuments(recordFilter),
  DailyLog.countDocuments({...recordFilter,date:{$gte:new Date(new Date().setHours(0,0,0,0))}}),
  WeeklyReview.countDocuments(recordFilter)
 ]);
 const recentActions=await Action.find({...recordFilter,status:{$ne:'Closed'}}).populate('fellow','name group').sort({dueDate:1}).limit(8);
 const recentAssessments=await Assessment.find(recordFilter).populate('fellow','name group').sort({date:-1}).limit(6);
 res.json({total,byMentor,onTrack,needsAttention,atRisk,escalated,lmsInactive,blocked,openActions,assessmentCount,dailyToday,weeklyCount,recentActions,recentAssessments});
});
export default router;
