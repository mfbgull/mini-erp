/**
 * Currency arithmetic utilities to avoid floating-point precision errors.
 * All financial calculations in the ERP system should use these functions.
 *
 * Uses Math.round(value * 100) / 100 to ensure 2-decimal-place precision.
 */

export function roundCurrency(value: number): number {
  // Use the e+2 trick to avoid IEEE 754 rounding errors (e.g., 1.005 → 1.01 instead of 1.00)
  return Number(Math.round(Number(value + 'e+2')) + 'e-2');
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
 * Safe division returning 0 when the divisor is 0 (avoids Infinity/NaN).
 */
export function divideCurrency(a: number, b: number): number {
  if (b === 0) return 0;
  return roundCurrency(a / b);
}

/**
 * Compute percentage: (value / total) * 100, returns 0 when total is 0.
 */
export function percentageOf(value: number, total: number): number {
  if (total === 0) return 0;
  return roundCurrency((value / total) * 100);
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
