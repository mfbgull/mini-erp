import db from '../config/database';
import { parseCurrency, subtractCurrency, addCurrency } from './currency';

/**
 * Create a ledger entry for a customer.
 * Wrapped in a transaction to prevent race conditions on running balance.
 * Uses currency utilities for safe arithmetic.
 */
function createLedgerEntry(customerId: number, type: string, referenceNo: string, debit: number, credit: number, description: string): number {
  const insertEntry = db.transaction(() => {
    const lastBalanceResult = db.prepare(`
      SELECT balance FROM customer_ledger
      WHERE customer_id = ?
      ORDER BY id DESC
      LIMIT 1
    `).get(customerId) as { balance: number } | undefined;

    const lastBalance = parseCurrency(lastBalanceResult?.balance);
    const safeDebit = parseCurrency(debit);
    const safeCredit = parseCurrency(credit);
    const newBalance = subtractCurrency(addCurrency(lastBalance, safeDebit), safeCredit);

    const result = db.prepare(`
      INSERT INTO customer_ledger (
        customer_id, transaction_date, transaction_type, reference_no,
        debit, credit, balance, description
      ) VALUES (?, date('now'), ?, ?, ?, ?, ?, ?)
    `).run(
      customerId,
      type,
      referenceNo,
      safeDebit,
      safeCredit,
      newBalance,
      description
    );

    return result.lastInsertRowid as number;
  });

  return insertEntry();
}

function updateCustomerBalance(customerId: number): number {
  const balanceResult = db.prepare(`
    SELECT COALESCE(SUM(balance_amount), 0) as total_balance
    FROM invoices
    WHERE customer_id = ? AND status IN ('Unpaid', 'Partially Paid', 'Overdue')
  `).get(customerId) as { total_balance: number };

  const newBalance = parseCurrency(balanceResult.total_balance);

  db.prepare('UPDATE customers SET current_balance = ? WHERE id = ?').run(newBalance, customerId);

  return newBalance;
}

function calculateInvoiceBalance(invoiceId: number): number {
  const invoice = db.prepare('SELECT total_amount FROM invoices WHERE id = ?').get(invoiceId) as { total_amount: number } | undefined;

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  const paidResult = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_paid
    FROM payment_allocations
    WHERE invoice_id = ?
  `).get(invoiceId) as { total_paid: number };

  const totalPaid = parseCurrency(paidResult?.total_paid);
  const totalAmount = parseCurrency(invoice.total_amount);
  const newBalance = subtractCurrency(totalAmount, totalPaid);

  db.prepare('UPDATE invoices SET paid_amount = ?, balance_amount = ? WHERE id = ?')
    .run(totalPaid, newBalance, invoiceId);

  return newBalance;
}

function updateInvoiceStatus(invoiceId: number): string {
  const invoice = db.prepare('SELECT balance_amount, total_amount, paid_amount, due_date FROM invoices WHERE id = ?')
    .get(invoiceId) as { balance_amount: number; total_amount: number; paid_amount: number; due_date: string | null } | undefined;

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  const balance = parseCurrency(invoice.balance_amount);
  const total = parseCurrency(invoice.total_amount);

  let newStatus = 'Unpaid';

  if (balance <= 0 && total > 0) {
    newStatus = 'Paid';
  } else if (balance > 0 && balance < total) {
    newStatus = 'Partially Paid';
  } else if (balance === total && total > 0) {
    newStatus = 'Unpaid';
  }

  if (newStatus !== 'Paid' && invoice.due_date && new Date(invoice.due_date) < new Date()) {
    newStatus = 'Overdue';
  }

  db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(newStatus, invoiceId);

  return newStatus;
}

function updateInvoiceBalanceAndStatus(invoiceId: number, _amountPaid: number = 0): string {
  calculateInvoiceBalance(invoiceId);
  return updateInvoiceStatus(invoiceId);
}

export default {
  createLedgerEntry,
  updateCustomerBalance,
  calculateInvoiceBalance,
  updateInvoiceStatus,
  updateInvoiceBalanceAndStatus
};
