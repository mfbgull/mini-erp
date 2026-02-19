/**
 * Currency arithmetic utilities to avoid floating-point precision errors.
 * All financial calculations in the ERP system should use these functions.
 *
 * Uses Math.round(value * 100) / 100 to ensure 2-decimal-place precision.
 */

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function addCurrency(a: number, b: number): number {
  return roundCurrency(a + b);
}

export function subtractCurrency(a: number, b: number): number {
  return roundCurrency(a - b);
}

export function multiplyCurrency(a: number, b: number): number {
  return roundCurrency(a * b);
}

/**
 * Safely parse a value to a currency number.
 * Returns 0 for null, undefined, NaN, or non-numeric strings.
 */
export function parseCurrency(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(num) ? 0 : roundCurrency(num);
}
