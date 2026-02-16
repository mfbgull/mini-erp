/**
 * Standardized API Response Utilities
 * Ensures consistent error and success response formats across all API endpoints
 */

import { Response } from 'express';

// ============================================================================
// Response Types
// ============================================================================

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ============================================================================
// Error Codes
// ============================================================================

export const ErrorCodes = {
  // Authentication Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource Errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Business Logic Errors
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_OPERATION: 'INVALID_OPERATION',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

// ============================================================================
// Success Response Helpers
// ============================================================================

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: ApiSuccessResponse<T>['meta']
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

// ============================================================================
// Error Response Helpers
// ============================================================================

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): void {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  
  if (details) {
    response.error.details = details;
  }
  
  res.status(statusCode).json(response);
}

// Convenience methods for common error types
export function sendBadRequest(
  res: Response,
  message: string = 'Bad request',
  code: string = ErrorCodes.INVALID_INPUT,
  details?: Record<string, unknown>
): void {
  sendError(res, 400, code, message, details);
}

export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized',
  code: string = ErrorCodes.UNAUTHORIZED
): void {
  sendError(res, 401, code, message);
}

export function sendForbidden(
  res: Response,
  message: string = 'Forbidden',
  code: string = ErrorCodes.FORBIDDEN
): void {
  sendError(res, 403, code, message);
}

export function sendNotFound(
  res: Response,
  resource: string = 'Resource',
  code: string = ErrorCodes.RESOURCE_NOT_FOUND
): void {
  sendError(res, 404, code, `${resource} not found`);
}

export function sendConflict(
  res: Response,
  message: string = 'Resource already exists',
  code: string = ErrorCodes.RESOURCE_ALREADY_EXISTS
): void {
  sendError(res, 409, code, message);
}

export function sendValidationError(
  res: Response,
  details: Record<string, unknown>
): void {
  sendError(res, 422, ErrorCodes.VALIDATION_ERROR, 'Validation failed', details);
}

export function sendInternalError(
  res: Response,
  message: string = 'Internal server error',
  code: string = ErrorCodes.INTERNAL_SERVER_ERROR
): void {
  sendError(res, 500, code, message);
}

// ============================================================================
// Legacy Response Helpers (for backward compatibility)
// ============================================================================

export function sendLegacySuccess<T>(res: Response, data: T, statusCode: number = 200): void {
  res.status(statusCode).json(data);
}

export function sendLegacyError(
  res: Response,
  statusCode: number,
  message: string
): void {
  res.status(statusCode).json({ error: message });
}
