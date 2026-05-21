import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * CSRF protection using double-submit cookie pattern.
 *
 * On safe methods (GET, HEAD, OPTIONS): sets the CSRF cookie if absent.
 * On state-changing methods (POST, PUT, DELETE, PATCH): validates that the
 * request header matches the cookie value.
 *
 * Auth routes (login/register) are excluded because they need to set the
 * token cookie without requiring a pre-existing CSRF token.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  if (safeMethods.includes(req.method)) {
    const existingToken = req.cookies?.[CSRF_COOKIE_NAME];
    if (!existingToken) {
      const token = crypto.randomUUID();
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    logger.warn(`[CSRF] Invalid token for ${req.method} ${req.path} from IP ${req.ip}`);
    res.status(403).json({ error: 'Invalid CSRF token', code: 'CSRF_FAILED' });
    return;
  }

  next();
}
