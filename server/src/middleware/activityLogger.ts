/**
 * Activity Logger Middleware
 * Automatically logs all HTTP requests with timing and user info
 */

import { Request, Response, NextFunction } from 'express';
import { log, LogLevel } from '../services/activityLogger';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      activityLogged?: boolean;
    }
  }
}

/**
 * Middleware to track request timing and log all requests
 * Skips health check and activity log endpoints to avoid recursion
 */
export function activityLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip certain paths to avoid logging noise
  const skipPaths = ['/health', '/api/activity-logs'];
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Record start time
  req.startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end.bind(res);

  // Override end to log after response
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    // Calculate duration
    const durationMs = req.startTime ? Date.now() - req.startTime : 0;

    // Determine log level based on status code
    let logLevel = LogLevel.INFO;
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logLevel = LogLevel.WARNING;
    } else if (res.statusCode >= 500) {
      logLevel = LogLevel.ERROR;
    }

    // Only log for API requests
    if (req.path.startsWith('/api/')) {
      // Get user ID from request (set by auth middleware)
      const userId = (req as any).user?.id;

      // Get entity type and ID from request if available
      const entityType = getEntityType(req.path);
      const entityId = getEntityId(req);

      // Log the request
      log({
        userId,
        action: getActionFromMethod(req.method, res.statusCode),
        entityType,
        entityId,
        description: `${req.method} ${req.path} - ${res.statusCode}`,
        logLevel,
        ipAddress: req.ip || req.get('x-forwarded-for') || req.get('x-real-ip'),
        userAgent: req.get('user-agent'),
        durationMs
      });
    }

    return originalEnd(chunk, encoding, callback);
  };

  next();
}

/**
 * Extract entity type from request path
 */
function getEntityType(path: string): string {
  // Remove /api/ prefix and get first segment
  const segments = path.replace('/api/', '').split('/');
  const entityType = segments[0] || 'Unknown';

  // Map common routes to nice names
  const entityTypeMap: Record<string, string> = {
    'inventory': 'Inventory',
    'items': 'Item',
    'warehouses': 'Warehouse',
    'stock-movements': 'StockMovement',
    'purchase-orders': 'PurchaseOrder',
    'purchases': 'Purchase',
    'suppliers': 'Supplier',
    'sales': 'SalesOrder',
    'invoices': 'Invoice',
    'customers': 'Customer',
    'payments': 'Payment',
    'boms': 'BOM',
    'production': 'WorkOrder',
    'expenses': 'Expense',
    'settings': 'Settings',
    'pos': 'POS',
    'reports': 'Report',
    'auth': 'Authentication'
  };

  return entityTypeMap[entityType] || entityType.charAt(0).toUpperCase() + entityType.slice(1);
}

/**
 * Extract entity ID from request if available
 */
function getEntityId(req: Request): number | undefined {
  // Check params
  if ((req as any).params.id) {
    const id = parseInt((req as any).params.id, 10);
    if (!isNaN(id)) return id;
  }

  // Check body
  if (req.body?.id) {
    const id = parseInt(req.body.id, 10);
    if (!isNaN(id)) return id;
  }

  return undefined;
}

/**
 * Determine action type from HTTP method and status code
 */
function getActionFromMethod(method: string, statusCode: number): string {
  // For successful requests, infer action from method
  if (statusCode >= 200 && statusCode < 300) {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'VIEW';
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'ACTION';
    }
  }

  // For errors
  if (statusCode === 401) return 'UNAUTHORIZED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 404) return 'NOT_FOUND';

  return 'ERROR';
}

export default activityLoggerMiddleware;
