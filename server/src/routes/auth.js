import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import { rateLimit } from 'express-rate-limit';
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
const passwordResetRequestLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {message:'Too many password reset requests. Please try again later.'}
});
const passwordResetSubmitLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {message:'Too many password reset attempts. Please try again later.'}
});

function createPasswordResetMailer(){
  const {SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS}=process.env;
  const port=Number(SMTP_PORT||587);
  if(!SMTP_HOST||!SMTP_USER||!SMTP_PASS||!Number.isInteger(port)||port<1||port>65535){
    const error=new Error('Password reset email is not configured.');
    error.status=503;
    throw error;
  }
  return nodemailer.createTransport({
    host:SMTP_HOST,
    port,
    secure:process.env.SMTP_SECURE==='true',
    auth:{user:SMTP_USER,pass:SMTP_PASS}
  });
}

router.post('/login', async (req,res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user || !user.active || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({message:'Email or password is incorrect'});
  res.json({token:createToken(user), user:publicUser(user)});
});

router.post('/forgot-password', passwordResetRequestLimit, async (req,res) => {
  const email=normalizeEmail(req.body?.email);
  if(!validEmail(email)) return res.status(400).json({message:'Enter a valid email address.'});
  const mailer=createPasswordResetMailer();
  try{
    await mailer.verify();
  }catch(error){
    console.error('Password reset email service unavailable:',error.message);
    return res.status(503).json({message:'Password reset email is temporarily unavailable. Please try again later.'});
  }
  const account=await User.findOne({email,active:true});
  if(account){
    const token=randomBytes(32).toString('hex');
    const tokenHash=createHash('sha256').update(token).digest('hex');
    account.passwordResetTokenHash=tokenHash;
    account.passwordResetExpires=new Date(Date.now()+30*60*1000);
    await account.save();
    const clientUrl=(process.env.CLIENT_URL||'http://localhost:5173').split(',')[0].trim().replace(/\/$/,'');
    const resetUrl=`${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const from=process.env.SMTP_FROM||process.env.SMTP_USER;
    try{
      await mailer.sendMail({
        from,
        to:account.email,
        subject:'Reset your Learn2Earn Mentor Portal password',
        text:`Hello ${account.name},\n\nUse the following link to reset your password. This link expires in 30 minutes and can only be used once:\n${resetUrl}\n\nIf you did not request a password reset, you can ignore this email.`,
        html:`<p>Hello ${account.name.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))},</p><p>Use this link to reset your Learn2Earn Mentor Portal password. It expires in 30 minutes and can only be used once.</p><p><a href="${resetUrl}" target="_blank" rel="noopener noreferrer">Reset password</a></p><p>If you did not request a password reset, you can ignore this email.</p>`
      });
    }catch(error){
      await User.updateOne(
        {_id:account._id,passwordResetTokenHash:tokenHash},
        {$set:{passwordResetTokenHash:null,passwordResetExpires:null}}
      );
      console.error('Password reset email delivery failed:',error.message);
      return res.status(503).json({message:'Unable to send a password reset email right now. Please try again later.'});
    }
  }
  res.json({message:'If an active account exists for that email, a password reset link has been sent.'});
});

router.post('/reset-password', passwordResetSubmitLimit, async (req,res) => {
  const {token,password,confirmPassword}=req.body||{};
  if(typeof token!=='string'||! /^[a-f\d]{64}$/i.test(token)) return res.status(400).json({message:'This password reset link is invalid or has expired.'});
  if(typeof password!=='string'||password.length<12||Buffer.byteLength(password,'utf8')>72) return res.status(400).json({message:'Password must contain at least 12 characters and no more than 72 UTF-8 bytes.'});
  if(password!==confirmPassword) return res.status(400).json({message:'Passwords do not match.'});
  const tokenHash=createHash('sha256').update(token).digest('hex');
  const resetFilter={passwordResetTokenHash:tokenHash,passwordResetExpires:{$gt:new Date()},active:true};
  if(!await User.exists(resetFilter)) return res.status(400).json({message:'This password reset link is invalid or has expired.'});
  const passwordHash=await bcrypt.hash(password,12);
  const account=await User.findOneAndUpdate(
    {...resetFilter,passwordResetExpires:{$gt:new Date()}},
    {$set:{password:passwordHash,passwordResetTokenHash:null,passwordResetExpires:null},$inc:{sessionVersion:1}},
    {new:true}
  );
  if(!account) return res.status(400).json({message:'This password reset link is invalid or has expired.'});
  res.json({message:'Password updated. You can now sign in with your new password.'});
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
  const emailChanged = account.email !== nextEmail;
  const shouldRenameMentor = account.role === 'mentor' && previousName !== nextName;
  if (shouldRenameMentor) await renameMentorReferences(previousName, nextName);
  account.name = nextName;
  account.email = nextEmail;
  if (password) {
    account.password = await bcrypt.hash(password, 12);
    account.sessionVersion += 1;
  }
  if (password || emailChanged) {
    account.passwordResetTokenHash = null;
    account.passwordResetExpires = null;
  }
  await account.save();
  res.json({user:publicUser(account), ...(password ? {token:createToken(account)} : {})});
});

router.get('/mentors', protect, async (_req,res) => {
  const mentors = await User.find({role:'mentor',active:true}).select('name groups').sort({name:1}).lean();
  res.json(mentors.map(mentor => ({name:mentor.name,groups:mentor.groups||[]})));
});

export default router;
