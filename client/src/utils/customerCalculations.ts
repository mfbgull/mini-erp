/**
 * Customer business logic calculations.
 * All business rules extracted from UI components into pure functions.
 */

import type { Customer, Invoice, LedgerEntry, Payment, CustomerMetrics } from '../types';

/**
 * Calculate the running balance from ledger entries.
 * Balance = Total Debit - Total Credit (Debit increases AR, Credit decreases AR).
 */
export function calculateLedgerTotals(ledger: LedgerEntry[]): { debit: number; credit: number; balance: number } {
  if (!ledger || ledger.length === 0) return { debit: 0, credit: 0, balance: 0 };

  const totalDebit = ledger.reduce((sum, item) => sum + (item.debit || 0), 0);
  const totalCredit = ledger.reduce((sum, item) => sum + (item.credit || 0), 0);

  return {
    debit: totalDebit,
    credit: totalCredit,
    balance: totalDebit - totalCredit,
  };
}

/**
 * Calculate the current balance from debit/credit totals.
 */
export function calculateCurrentBalance(totalDebit: number, totalCredit: number): number {
  return totalDebit - totalCredit;
}

/**
 * Calculate total invoiced amount from invoices.
 */
export function calculateTotalInvoiced(invoices: Invoice[]): number {
  return invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
}

/**
 * Calculate total paid amount from invoices.
 */
export function calculateTotalPaid(invoices: Invoice[]): number {
  return invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
}

/**
 * Calculate total outstanding balance from invoices.
 */
export function calculateTotalOutstanding(invoices: Invoice[]): number {
  return invoices.reduce((sum, inv) => sum + (inv.balance_amount || 0), 0);
}

/**
 * Calculate credit utilization percentage.
 */
export function calculateCreditUtilization(balance: number, creditLimit: number | undefined | null): number {
  if (creditLimit && creditLimit > 0) {
    return (balance / creditLimit) * 100;
  }
  return 0;
}

/**
 * Count overdue invoices (status === 'Overdue' and balance > 0).
 */
export function calculateOverdueInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.filter((inv) => inv.status === 'Overdue' && (inv.balance_amount || 0) > 0);
}

/**
 * Count paid invoices.
 */
export function countPaidInvoices(invoices: Invoice[]): number {
  return invoices.filter((inv) => inv.status === 'Paid').length;
}

/**
 * Count unpaid/pending invoices.
 */
export function countUnpaidInvoices(invoices: Invoice[]): number {
  return invoices.filter((inv) => inv.status === 'Unpaid' || inv.status === 'Partially Paid').length;
}

/**
 * Calculate average days to pay for paid invoices.
 */
export function calculateAverageDaysToPay(invoices: Invoice[]): number {
  const paidInvoicesWithPayments = invoices.filter(
    (inv) => inv.status === 'Paid' && (inv.paid_amount || 0) > 0,
  );

  if (paidInvoicesWithPayments.length === 0) return 0;

  const totalDays = paidInvoicesWithPayments.reduce((sum, inv) => {
    const invoiceDate = new Date(inv.invoice_date);
    const paidDate = new Date(inv.updated_at || inv.invoice_date);
    const diffDays = (paidDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24);
    return sum + Math.max(0, diffDays);
  }, 0);

  return Math.round(totalDays / paidInvoicesWithPayments.length);
}

/**
 * Sort invoices by date descending and return the top N.
 */
export function getRecentInvoices(invoices: Invoice[], count: number = 5): Invoice[] {
  return [...invoices]
    .sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())
    .slice(0, count);
}

/**
 * Sort payments by date descending and return the top N.
 */
export function getRecentPayments(payments: Payment[], count: number = 5): Payment[] {
  return [...payments]
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    .slice(0, count);
}

/**
 * Compute all customer metrics in one pass.
 */
export function computeCustomerMetrics(
  invoices: Invoice[],
  ledger: LedgerEntry[],
  customer: Customer | undefined,
): CustomerMetrics {
  const totals = calculateLedgerTotals(ledger);
  const totalInvoiced = calculateTotalInvoiced(invoices);
  const totalPaid = calculateTotalPaid(invoices);
  const overdue = calculateOverdueInvoices(invoices);

  return {
    currentBalance: totals.balance,
    totalDebit: totals.debit,
    totalCredit: totals.credit,
    totalInvoiced,
    totalPaid,
    totalOutstanding: calculateTotalOutstanding(invoices),
    creditUtilization: calculateCreditUtilization(totals.balance, customer?.credit_limit),
    overdueInvoicesCount: overdue.length,
    paidInvoicesCount: countPaidInvoices(invoices),
    unpaidInvoicesCount: countUnpaidInvoices(invoices),
    overdueInvoicesItemsCount: overdue.length,
    avgDaysToPay: calculateAverageDaysToPay(invoices),
  };
}

/**
 * Format a number as USD currency string (legacy format for Overview/Invoices/Payments tabs).
 */
export function formatAsCurrency(value: number | string | null | undefined): string {
  const num = parseFloat(String(value || 0));
  if (isNaN(num)) return '$0.00';
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a number with simple 2-decimal formatting (legacy for ledger totals).
 */
export function formatAsFixed(value: number): string {
  return value.toFixed(2);
}

/**
 * Format a date string to locale date string.
 */
export function formatDateString(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return '';
  }
}
