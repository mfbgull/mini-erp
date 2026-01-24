import { Request } from 'express';
import { ParsedQs } from 'qs';

/**
 * Safely extracts a string value from a query parameter that might be a string, array of strings, or ParsedQs
 * @param param The query parameter value (could be string, string[], or ParsedQs)
 * @returns The string value or undefined if not present
 */
export function getQueryParam(param: string | ParsedQs | string[] | undefined): string | undefined {
  if (Array.isArray(param)) {
    const firstElement = param[0];
    if (typeof firstElement === 'string') {
      return firstElement;
    } else {
      return String(firstElement);
    }
  } else if (typeof param === 'object' && param !== null) {
    // Handle ParsedQs object - convert to string
    return JSON.stringify(param);
  }
  return param as string | undefined;
}

/**
 * Safely extracts a numeric value from a query parameter
 * @param param The query parameter value (could be string, string[], or ParsedQs)
 * @param defaultValue Default value if parameter is not present or invalid
 * @returns The parsed number or default value
 */
export function getQueryNumber(param: string | ParsedQs | string[] | undefined, defaultValue: number = NaN): number {
  const strValue = getQueryParam(param);
  if (strValue === undefined) {
    return defaultValue;
  }
  const numValue = Number(strValue);
  return isNaN(numValue) ? defaultValue : numValue;
}

/**
 * Safely extracts an integer value from a query parameter
 * @param param The query parameter value (could be string, string[], or ParsedQs)
 * @param defaultValue Default value if parameter is not present or invalid
 * @returns The parsed integer or default value
 */
export function getQueryInteger(param: string | ParsedQs | string[] | undefined, defaultValue: number = NaN): number {
  const strValue = getQueryParam(param);
  if (strValue === undefined) {
    return defaultValue;
  }
  const numValue = parseInt(strValue, 10);
  return isNaN(numValue) ? defaultValue : numValue;
}