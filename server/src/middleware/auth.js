import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export async function protect(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.active) return res.status(401).json({ message: 'Account unavailable' });
    if ((decoded.version ?? 0) !== req.user.sessionVersion) return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    next();
  } catch { return res.status(401).json({ message: 'Invalid or expired session' }); }
}
export function adminOnly(req,res,next) { if (req.user?.role !== 'admin') return res.status(403).json({message:'Administrator access required'}); next(); }
