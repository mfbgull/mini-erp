import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthUser, AuthRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'mini-erp-secret-key-change-in-production';

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: AuthUser) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = user;
    next();
  });
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

function generateToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export { authenticateToken, requireAdmin, generateToken, JWT_SECRET };
export default { authenticateToken, requireAdmin, generateToken, JWT_SECRET };
