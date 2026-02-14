import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthUser, AuthRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is required');
  console.error('Set it with: export JWT_SECRET=$(openssl rand -base64 32)');
  process.exit(1);
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'mini-erp',
      audience: 'mini-erp-client'
    }) as AuthUser;

    req.user = user;
    next();
  } catch (err: any) {
    console.warn(`[Auth] Token verification failed: ${err.name} from IP ${req.ip}`);
    
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    } else if (err.name === 'JsonWebTokenError') {
      res.status(403).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    } else {
      res.status(403).json({ error: 'Token verification failed', code: 'AUTH_FAILED' });
    }
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    console.warn(`[Auth] Admin access denied for user ${req.user.username} (${req.user.id})`);
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h', issuer: 'mini-erp', audience: 'mini-erp-client', algorithm: 'HS256' }
  );
}

export { JWT_SECRET };
export default { authenticateToken, requireAdmin, generateToken, JWT_SECRET };
