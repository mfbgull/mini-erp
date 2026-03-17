import { useState, useCallback } from 'react';

import { ZodSchema, ZodError } from 'zod';

export function useFormValidation<T>(schema: ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((data: unknown): data is T => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (e) {
      if (e instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        e.issues.forEach(err => {
          const path = err.path.join('.');
          if (path && !fieldErrors[path]) {
            fieldErrors[path] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  }, [schema]);

  const validateField = useCallback((field: string, value: unknown, fullData: unknown) => {
    try {
      schema.parse(fullData);
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    } catch (e) {
      if (e instanceof ZodError) {
        const fieldError = e.issues.find(err => err.path.join('.') === field);
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: fieldError.message }));
        } else {
          setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
        }
      }
    }
  }, [schema]);

  const clearErrors = useCallback(() => setErrors({}), []);

  return { errors, validate, validateField, clearErrors };
}
