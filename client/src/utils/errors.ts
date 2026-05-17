import toast from 'react-hot-toast';

import { AxiosError } from 'axios';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export function parseError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    const response = error.response?.data;
    const errorMessage = typeof response?.error === 'string'
      ? response.error
      : (response?.message as string);
    return {
      message: errorMessage || error.message || 'An unexpected error occurred',
      code: response?.code ?? response?.error?.code,
      status: error.response?.status,
      details: response?.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred',
      details: error,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    return {
      message: (err.message as string) || (err.error as string) || 'An unexpected error occurred',
      code: err.code as string | undefined,
      details: error,
    };
  }

  return { message: 'An unexpected error occurred' };
}

export function handleError(
  error: unknown,
  context: string,
  options?: {
    showToast?: boolean;
    fallbackMessage?: string;
  }
): AppError {
  const { showToast = true, fallbackMessage } = options || {};
  const appError = parseError(error);
  const displayMessage = fallbackMessage || appError.message;

  console.error(`[${context}]`, error);

  if (showToast) {
    toast.error(displayMessage);
  }

  return appError;
}

export function handleApiError(
  error: unknown,
  context: string,
  fallbackMessage?: string
): AppError {
  return handleError(error, context, { fallbackMessage });
}

export function handleFormError(
  error: unknown,
  context: string,
  fallbackMessage?: string
): AppError {
  return handleError(error, context, { fallbackMessage });
}

export function logError(error: unknown, context: string): void {
  console.error(`[${context}]`, error);
}

export default {
  parseError,
  handleError,
  handleApiError,
  handleFormError,
  logError,
};
