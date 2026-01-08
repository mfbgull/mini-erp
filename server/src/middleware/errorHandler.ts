import { Request, Response, NextFunction } from 'express';

function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
}

export default {
  errorHandler,
  notFoundHandler
};
