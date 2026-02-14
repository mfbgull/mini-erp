import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    console.warn(`[Rate Limit] Login attempts exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many login attempts. Please try again later.',
      retryAfter: Math.ceil(15 * 60) // seconds
    });
  },
  keyGenerator: (req: Request) => {
    // Use IP address + username combination for more targeted limiting
    const username = req.body?.username || '';
    return `${req.ip}-${username}`;
  }
});

/**
 * Stricter rate limiter for password change operations
 */
export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`[Rate Limit] Password change attempts exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many password change attempts. Please try again later.',
      retryAfter: Math.ceil(60 * 60)
    });
  }
});

/**
 * General API rate limiter for all routes
 * Limits: 100 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  handler: (req: Request, res: Response) => {
    console.warn(`[Rate Limit] API requests exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil(60)
    });
  }
});

/**
 * Aggressive rate limiter for sensitive operations
 * (e.g., data exports, bulk operations)
 */
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`[Rate Limit] Sensitive operation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests for this operation. Please try again later.',
      retryAfter: Math.ceil(60)
    });
  }
});
