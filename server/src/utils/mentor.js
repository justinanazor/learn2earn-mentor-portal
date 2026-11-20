import Fellow from '../models/Fellow.js';
import DailyLog from '../models/DailyLog.js';
import Assessment from '../models/Assessment.js';
import WeeklyReview from '../models/WeeklyReview.js';
import Action from '../models/Action.js';

export async function renameMentorReferences(previousName, nextName) {
  await Promise.all([
    Fellow.updateMany({assignedMentor:previousName},{$set:{assignedMentor:nextName}}),
    DailyLog.updateMany({mentor:previousName},{$set:{mentor:nextName}}),
    Assessment.updateMany({mentor:previousName},{$set:{mentor:nextName}}),
    WeeklyReview.updateMany({mentor:previousName},{$set:{mentor:nextName}}),
    Action.updateMany({mentor:previousName},{$set:{mentor:nextName}})
  ]);
}
