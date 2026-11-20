import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import Fellow from '../models/Fellow.js';
import DailyLog from '../models/DailyLog.js';
import Assessment from '../models/Assessment.js';
import WeeklyReview from '../models/WeeklyReview.js';
import Action from '../models/Action.js';
import { renameMentorReferences } from '../utils/mentor.js';
const router = Router();
const publicUser = user => ({ id:user._id, name:user.name, email:user.email, role:user.role, groups:user.groups||[], active:user.active });
const createToken = user => jwt.sign({id:user._id,version:user.sessionVersion}, process.env.JWT_SECRET, {expiresIn:'12h'});
const normalizeEmail = value => String(value || '').trim().toLowerCase();
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

router.post('/login', async (req,res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user || !user.active || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({message:'Email or password is incorrect'});
  res.json({token:createToken(user), user:publicUser(user)});
});

router.get('/me', protect, (req,res) => res.json(publicUser(req.user)));

router.patch('/me', protect, async (req,res) => {
  const { name, email, currentPassword, password } = req.body || {};
  const account = await User.findById(req.user._id);
  if (!account) return res.status(401).json({message:'Account unavailable.'});
  const nextName = String(name ?? '').trim();
  const nextEmail = normalizeEmail(email);
  if (!nextName || nextName.length > 120) return res.status(400).json({message:'Name is required and must be 120 characters or fewer.'});
  if (!validEmail(nextEmail)) return res.status(400).json({message:'Enter a valid email address.'});
  if (await User.exists({email:nextEmail,_id:{$ne:account._id}})) return res.status(409).json({message:'An account with this email already exists.'});
  if (account.role === 'mentor' && nextName.toLowerCase() !== account.name.toLowerCase()) {
    const nameInUse = await User.find({role:'mentor',_id:{$ne:account._id}}).select('name').lean();
    if (nameInUse.some(user => user.name.toLowerCase() === nextName.toLowerCase())) return res.status(409).json({message:'Another mentor already uses this name.'});
  }
  if (password !== undefined && password !== '') {
    if (typeof password !== 'string' || password.length < 12) return res.status(400).json({message:'New passwords must be at least 12 characters long.'});
    if (!currentPassword || !(await bcrypt.compare(currentPassword, account.password))) return res.status(400).json({message:'Enter your current password to change it.'});
  }

  const previousName = account.name;
  const shouldRenameMentor = account.role === 'mentor' && previousName !== nextName;
  if (shouldRenameMentor) await renameMentorReferences(previousName, nextName);
  account.name = nextName;
  account.email = nextEmail;
  if (password) {
    account.password = await bcrypt.hash(password, 12);
    account.sessionVersion += 1;
  }
  await account.save();
  res.json({user:publicUser(account), ...(password ? {token:createToken(account)} : {})});
});

router.get('/mentors', protect, async (_req,res) => {
  const mentors = await User.find({role:'mentor',active:true}).select('name groups').sort({name:1}).lean();
  res.json(mentors.map(mentor => ({name:mentor.name,groups:mentor.groups||[]})));
});

export default router;
