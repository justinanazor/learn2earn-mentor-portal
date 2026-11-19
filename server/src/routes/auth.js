import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const router = Router();
router.post('/login', async (req,res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() });
  if (!user || !user.active || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({message:'Email or password is incorrect'});
  const token = jwt.sign({id:user._id}, process.env.JWT_SECRET, {expiresIn:'12h'});
  res.json({token, user:{id:user._id,name:user.name,email:user.email,role:user.role}});
});
export default router;
