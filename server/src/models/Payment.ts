import Database from 'better-sqlite3';
import { initializeSequenceFromMax, getNextSequenceNumber } from '../utils/sequence';
import ledgerUtils from '../utils/ledgerUtils';
import { parseCurrency, subtractCurrency } from '../utils/currency';

interface PaymentFilters {
  search?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

interface InvoiceAllocation {
  invoice_id: string;
  amount: number;
}

interface CreatePaymentDTO {
  customer_id: number;
  payment_date: string;
  amount: number;
  payment_method?: string;
  reference_no?: string;
  notes?: string;
  invoice_allocations: InvoiceAllocation[];
  userId: number;
}

// Static class for Payment model operations
export class PaymentModel {
  /**
   * Generate payment number using sequence utility
   */
  static generatePaymentNo(db: Database.Database): string {
    initializeSequenceFromMax(db, 'PAY_last_no', 'payments', 'payment_no', 'PAY');
    const nextNo = getNextSequenceNumber(db, 'PAY_last_no');
    return `PAY${String(nextNo).padStart(3, '0')}`;
  }

  /**
   * Get payment by ID
   */
  static getById(db: Database.Database, id: number): any {
    const payment = db.prepare(`
      SELECT p.id, p.payment_no, p.customer_id, c.customer_name, p.invoice_id, i.invoice_no,
             p.payment_date, p.amount, p.payment_method, p.reference_no, p.notes, p.created_at,
             GROUP_CONCAT(pa.invoice_id, ',') as allocated_invoices,
             GROUP_CONCAT(pa.amount, ',') as allocation_amounts,
             GROUP_CONCAT(pa.id, ',') as allocation_ids
      FROM payments p LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN payment_allocations pa ON p.id = pa.payment_id
      WHERE p.id = ? GROUP BY p.id
    `).get(id) as {
      id: number; payment_no: string; customer_id: number; customer_name: string; invoice_id: number | null;
      invoice_no: string | null; payment_date: string; amount: number; payment_method: string;
      reference_no: string; notes: string; created_at: string; allocated_invoices: string | null;
      allocation_amounts: string | null; allocation_ids: string | null; allocations?: Array<{ id: number; payment_id: number; invoice_id: number; invoice_no: string; amount: number }>;
    } | undefined;

    if (payment && payment.allocated_invoices) {
      payment.allocations = db.prepare(`
        SELECT pa.id, pa.payment_id, pa.invoice_id, i.invoice_no, pa.amount
        FROM payment_allocations pa LEFT JOIN invoices i ON pa.invoice_id = i.id
        WHERE pa.payment_id = ? ORDER BY pa.id
      `).all(id) as Array<{ id: number; payment_id: number; invoice_id: number; invoice_no: string; amount: number }>;
    } else if (payment) {
      payment.allocations = [];
    }

    return payment;
  }

  /**
   * Get all payments with filtering
   */
  static getAll(db: Database.Database, filters: PaymentFilters = {}, sortColumns: string[], defaultSort: string, defaultOrder: string) {
    const pageNum = filters.page || 1;
    const limitNum = filters.limit || 10;

    let query = `
      SELECT p.id, p.payment_no, p.customer_id, c.customer_name, p.invoice_id, i.invoice_no,
             p.payment_date, p.amount, p.payment_method, p.reference_no, p.notes, p.created_at,
             GROUP_CONCAT(pa.invoice_id, ',') as allocated_invoices,
             GROUP_CONCAT(pa.amount, ',') as allocation_amounts
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN payment_allocations pa ON p.id = pa.payment_id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (filters.search) {
      const term = `%${filters.search}%`;
      query += ` AND (p.payment_no LIKE ? OR c.customer_name LIKE ? OR p.reference_no LIKE ?)`;
      params.push(term, term, term);
    }
    if (filters.customerId) { query += ' AND p.customer_id = ?'; params.push(parseInt(filters.customerId, 10)); }
    if (filters.fromDate) { query += ' AND p.payment_date >= ?'; params.push(filters.fromDate); }
    if (filters.toDate) { query += ' AND p.payment_date <= ?'; params.push(filters.toDate); }

    const sortBy = filters.sortBy && sortColumns.includes(filters.sortBy) ? filters.sortBy : defaultSort;
    const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : defaultOrder;

    query += ` GROUP BY p.id ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limitNum, (pageNum - 1) * limitNum);

    const payments = db.prepare(query).all(...params);
    
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id WHERE 1=1
    `;
    const countParams: (string | number)[] = [];
    if (filters.search) {
      const term = `%${filters.search}%`;
      countQuery += ` AND (p.payment_no LIKE ? OR c.customer_name LIKE ? OR p.reference_no LIKE ?)`;
      countParams.push(term, term, term);
    }
    if (filters.customerId) { countQuery += ' AND p.customer_id = ?'; countParams.push(parseInt(filters.customerId, 10)); }
    if (filters.fromDate) { countQuery += ' AND p.payment_date >= ?'; countParams.push(filters.fromDate); }
    if (filters.toDate) { countQuery += ' AND p.payment_date <= ?'; countParams.push(filters.toDate); }

    const total = db.prepare(countQuery).get(...countParams) as { total: number };

    return { payments, total: total.total, pageNum, limitNum };
  }

  /**
   * Create a new payment
   */
  static create(db: Database.Database, data: CreatePaymentDTO): number {
    return db.transaction(() => {
      const paymentNo = this.generatePaymentNo(db);

      const paymentResult = db.prepare(`
        INSERT INTO payments (payment_no, customer_id, payment_date, amount, payment_method, reference_no, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(paymentNo, data.customer_id, data.payment_date, data.amount, data.payment_method || 'Cash', data.reference_no || '', data.notes || '');

      const paymentId = paymentResult.lastInsertRowid as number;

      for (const alloc of data.invoice_allocations) {
        const invoiceId = parseInt(alloc.invoice_id, 10);
        db.prepare('INSERT INTO payment_allocations (payment_id, invoice_id, amount) VALUES (?, ?, ?)').run(paymentId, invoiceId, alloc.amount);
        ledgerUtils.calculateInvoiceBalance(invoiceId);
        ledgerUtils.updateInvoiceStatus(invoiceId);
      }

      const currentBalance = db.prepare('SELECT current_balance FROM customers WHERE id = ?').get(data.customer_id) as { current_balance: number };
      const newBalance = subtractCurrency(parseCurrency(currentBalance.current_balance), parseCurrency(data.amount));

      const invoiceNumbers = data.invoice_allocations.map((alloc) => {
        const invoiceId = parseInt(alloc.invoice_id, 10);
        const inv = db.prepare('SELECT invoice_no FROM invoices WHERE id = ?').get(invoiceId) as { invoice_no: string } | undefined;
        return inv?.invoice_no || `Invoice #${invoiceId}`;
      });

      db.prepare(`
        INSERT INTO customer_ledger (customer_id, transaction_date, transaction_type, reference_no, debit, credit, balance, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(data.customer_id, data.payment_date, 'PAYMENT', paymentNo, 0, data.amount, newBalance, `Payment against ${invoiceNumbers.join(', ')}`);

      ledgerUtils.updateCustomerBalance(data.customer_id);

      return paymentId;
    })();
  }

  /**
   * Update payment
   */
  static update(db: Database.Database, id: number, data: { payment_date?: string; amount?: number; payment_method?: string; reference_no?: string; notes?: string }): void {
    const existing = this.getById(db, id);
    if (!existing) throw new Error('Payment not found');

    db.prepare(`
      UPDATE payments SET
        payment_date = COALESCE(?, payment_date), amount = COALESCE(?, amount),
        payment_method = COALESCE(?, payment_method), reference_no = COALESCE(?, reference_no),
        notes = COALESCE(?, notes) WHERE id = ?
    `).run(data.payment_date, data.amount, data.payment_method, data.reference_no, data.notes, id);

    ledgerUtils.updateCustomerBalance(existing.customer_id);

    const allocations = db.prepare('SELECT invoice_id FROM payment_allocations WHERE payment_id = ?').all(id) as { invoice_id: number }[];
    for (const alloc of allocations) {
      ledgerUtils.calculateInvoiceBalance(alloc.invoice_id);
      ledgerUtils.updateInvoiceStatus(alloc.invoice_id);
    }
  }

  /**
   * Delete payment
   */
  static delete(db: Database.Database, id: number): void {
    const existing = this.getById(db, id);
    if (!existing) throw new Error('Payment not found');

    db.transaction(() => {
      const allocations = db.prepare('SELECT * FROM payment_allocations WHERE payment_id = ?').all(id) as Array<{ invoice_id: number }>;
      db.prepare('DELETE FROM payment_allocations WHERE payment_id = ?').run(id);
      db.prepare('DELETE FROM payments WHERE id = ?').run(id);
      db.prepare('DELETE FROM customer_ledger WHERE reference_no = ?').run(existing.payment_no);

      for (const alloc of allocations) {
        try {
          ledgerUtils.calculateInvoiceBalance(alloc.invoice_id);
          ledgerUtils.updateInvoiceStatus(alloc.invoice_id);
        } catch {
          // Intentionally skip failed invoice updates to process remaining allocations
        }
      }

      try { ledgerUtils.updateCustomerBalance(existing.customer_id); } catch {
        // Intentionally skip failed customer balance update
      }
    })();
  }

  /**
   * Get payment allocations by payment ID
   */
  static getAllocationsByPaymentId(db: Database.Database, paymentId: number): Array<{ invoice_id: number }> {
    return db.prepare('SELECT invoice_id FROM payment_allocations WHERE payment_id = ?').all(paymentId) as Array<{ invoice_id: number }>;
  }

  /**
   * Get payment allocations by invoice ID
   */
  static getAllocationsByInvoiceId(db: Database.Database, invoiceId: number): Array<{ payment_id: number; amount: number }> {
    return db.prepare(`
      SELECT payment_id, amount FROM payment_allocations WHERE invoice_id = ?
    `).all(invoiceId) as Array<{ payment_id: number; amount: number }>;
  }

  /**
   * Delete payment allocations by payment ID
   */
  static deleteAllocationsByPaymentId(db: Database.Database, paymentId: number): void {
    db.prepare('DELETE FROM payment_allocations WHERE payment_id = ?').run(paymentId);
  }

  /**
   * Delete payment allocations by invoice ID
   */
  static deleteAllocationsByInvoiceId(db: Database.Database, invoiceId: number): void {
    db.prepare('DELETE FROM payment_allocations WHERE invoice_id = ?').run(invoiceId);
  }

  /**
   * Get total paid for an invoice
   */
  static getTotalPaidByInvoiceId(db: Database.Database, invoiceId: number): number {
    const result = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM payment_allocations
      WHERE invoice_id = ?
    `).get(invoiceId) as { total_paid: number };
    return result.total_paid;
  }
}

export default PaymentModel;
