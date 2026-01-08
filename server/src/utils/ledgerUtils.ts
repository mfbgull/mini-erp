import db from '../config/database';

function createLedgerEntry(customerId: number, type: string, referenceNo: string, debit: number, credit: number, description: string): number {
  const lastBalanceResult = db.prepare(`
    SELECT balance FROM customer_ledger
    WHERE customer_id = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(customerId) as { balance: number } | undefined;

  const lastBalance = lastBalanceResult ? lastBalanceResult.balance : 0;

  const newBalance = parseFloat(String(lastBalance)) + parseFloat(String(debit)) - parseFloat(String(credit));

  const stmt = db.prepare(`
    INSERT INTO customer_ledger (
      customer_id, transaction_date, transaction_type, reference_no,
      debit, credit, balance, description
    ) VALUES (?, date('now'), ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    customerId,
    type,
    referenceNo,
    debit,
    credit,
    newBalance,
    description
  );

  return result.lastInsertRowid as number;
}

function updateCustomerBalance(customerId: number): number {
  const balanceResult = db.prepare(`
    SELECT COALESCE(SUM(balance_amount), 0) as total_balance
    FROM invoices
    WHERE customer_id = ? AND status IN ('Unpaid', 'Partially Paid', 'Overdue')
  `).get(customerId) as { total_balance: number };

  const newBalance = balanceResult.total_balance;

  const stmt = db.prepare('UPDATE customers SET current_balance = ? WHERE id = ?');
  stmt.run(newBalance, customerId);

  return newBalance;
}

function calculateInvoiceBalance(invoiceId: number): number {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any;

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  const paidResult = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_paid
    FROM payment_allocations
    WHERE invoice_id = ?
  `).get(invoiceId) as { total_paid: number };

  const totalPaid = paidResult?.total_paid || 0;
  const totalAmount = invoice.total_amount || 0;

  const newBalance = totalAmount - totalPaid;

  const stmt = db.prepare('UPDATE invoices SET paid_amount = ?, balance_amount = ? WHERE id = ?');
  stmt.run(totalPaid, newBalance, invoiceId);

  return newBalance;
}

function updateInvoiceStatus(invoiceId: number): string {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any;

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  const balance = parseFloat(invoice.balance_amount || 0);
  const total = parseFloat(invoice.total_amount || 0);
  const paid = parseFloat(invoice.paid_amount || 0);

  let newStatus = 'Unpaid';

  if (balance === 0 && total > 0) {
    newStatus = 'Paid';
  } else if (balance > 0 && balance < total) {
    newStatus = 'Partially Paid';
  } else if (balance === total && total > 0) {
    newStatus = 'Unpaid';
  }

  if (newStatus !== 'Paid' && invoice.due_date && new Date(invoice.due_date) < new Date()) {
    newStatus = 'Overdue';
  }

  const stmt = db.prepare('UPDATE invoices SET status = ? WHERE id = ?');
  stmt.run(newStatus, invoiceId);

  return newStatus;
}

function updateInvoiceBalanceAndStatus(invoiceId: number, amountPaid: number = 0): string {
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
