import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface RequestLogData {
  method: string;
  url: string;
  path: string;
  query: Record<string, unknown>;
  userAgent?: string;
  ip?: string;
  userId?: number;
  requestId: string;
}

export interface ResponseLogData extends RequestLogData {
  statusCode: number;
  responseTime: number;
  error?: string;
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  (req as any).requestId = requestId;
  
  const requestLog: RequestLogData = {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: req.query as Record<string, unknown>,
    userAgent: req.get('user-agent'),
    ip: req.ip || (req as any).connection?.remoteAddress,
    userId: (req as any).user?.id
  };
  
  logger.info('Incoming request', requestLog);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseLog: ResponseLogData = {
      ...requestLog,
      statusCode: res.statusCode,
      responseTime: duration
    };
    
    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', responseLog);
    } else {
      logger.info('Request completed', responseLog);
    }
  });
  
  res.on('error', (error: Error) => {
    const duration = Date.now() - startTime;
    logger.error('Request failed', {
      ...requestLog,
      statusCode: res.statusCode,
      responseTime: duration,
      error: error.message,
      stack: error.stack
    });
  });
  
  next();
}

export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction): void {
  const requestId = (req as any).requestId || generateRequestId();
  
  logger.error('Unhandled error', {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    error: err.message,
    stack: err.stack,
    userId: (req as any).user?.id
  });
  
  next(err);
}
