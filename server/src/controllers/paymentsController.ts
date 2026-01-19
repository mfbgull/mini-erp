import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import ledgerUtils from '../utils/ledgerUtils';
import { logCRUD, ActionType } from '../services/activityLogger';
import db from '../config/database';

function getPayments(req: Request, res: Response): void {
  try {
    const { page = 1, limit = 10, search = '', customerId, fromDate, toDate, sortBy = 'payment_date', sortOrder = 'DESC' } = req.query;

    let query = `
      SELECT 
        p.id, p.payment_no, p.customer_id, c.customer_name, p.invoice_id, i.invoice_no,
        p.payment_date, p.amount, p.payment_method, p.reference_no, p.notes, p.created_at,
        GROUP_CONCAT(pa.invoice_id, ',') as allocated_invoices,
        GROUP_CONCAT(pa.amount, ',') as allocation_amounts
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN payment_allocations pa ON p.id = pa.payment_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search) {
      query += ` AND (p.payment_no LIKE ? OR c.customer_name LIKE ? OR p.reference_no LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (customerId) {
      query += ' AND p.customer_id = ?';
      params.push(parseInt(customerId as string, 10));
    }

    if (fromDate) {
      query += ' AND p.payment_date >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      query += ' AND p.payment_date <= ?';
      params.push(toDate);
    }

    query += ` GROUP BY p.id ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string));

    const payments = db.prepare(query).all(...params);

    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE 1=1
    `;

    let countParams: any[] = [];
    if (search) {
      countQuery += ` AND (p.payment_no LIKE ? OR c.customer_name LIKE ? OR p.reference_no LIKE ?)`;
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }

    if (customerId) {
      countQuery += ' AND p.customer_id = ?';
      countParams.push(parseInt(customerId as string, 10));
    }

    if (fromDate) {
      countQuery += ' AND p.payment_date >= ?';
      countParams.push(fromDate);
    }

    if (toDate) {
      countQuery += ' AND p.payment_date <= ?';
      countParams.push(toDate);
    }

    const total = db.prepare(countQuery).get(...countParams) as { total: number };

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    res.json({
      success: true,
      data: payments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total.total / limitNum),
        totalItems: total.total,
        hasNext: pageNum < Math.ceil(total.total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
}

function getPayment(req: Request, res: Response): void {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.id, p.payment_no, p.customer_id, c.customer_name, p.invoice_id, i.invoice_no,
        p.payment_date, p.amount, p.payment_method, p.reference_no, p.notes, p.created_at,
        GROUP_CONCAT(pa.invoice_id, ',') as allocated_invoices,
        GROUP_CONCAT(pa.amount, ',') as allocation_amounts,
        GROUP_CONCAT(pa.id, ',') as allocation_ids
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN payment_allocations pa ON p.id = pa.payment_id
      WHERE p.id = ?
      GROUP BY p.id
    `;

    const payment = db.prepare(query).get(id) as any;

    if (!payment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
      return;
    }

    if (payment.allocated_invoices) {
      const allocationQuery = `
        SELECT pa.id, pa.payment_id, pa.invoice_id, i.invoice_no, pa.amount
        FROM payment_allocations pa
        LEFT JOIN invoices i ON pa.invoice_id = i.id
        WHERE pa.payment_id = ?
        ORDER BY pa.id
      `;
      payment.allocations = db.prepare(allocationQuery).all(id);
    } else {
      payment.allocations = [];
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment'
    });
  }
}

function createPayment(req: AuthRequest, res: Response): void {
  try {
    const {
      customer_id,
      payment_date,
      amount,
      payment_method,
      reference_no,
      notes,
      invoice_allocations
    } = req.body;

    if (!customer_id || !payment_date || !amount || amount <= 0) {
      res.status(400).json({
        success: false,
        error: 'Customer ID, payment date, and amount are required'
      });
      return;
    }

    const parsedCustomerId = parseInt(customer_id, 10);

    if (!invoice_allocations || !Array.isArray(invoice_allocations) || invoice_allocations.length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one invoice allocation is required'
      });
      return;
    }

    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(parsedCustomerId);
    if (!customer) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
      return;
    }

    const maxPaymentNo = db.prepare('SELECT MAX(payment_no) as max_no FROM payments WHERE payment_no LIKE \'PAY%\'').get() as { max_no: string } | undefined;
    let newPaymentNo = 'PAY001';

    if (maxPaymentNo && maxPaymentNo.max_no) {
      const lastNumber = parseInt(maxPaymentNo.max_no.replace('PAY', ''));
      newPaymentNo = `PAY${String(lastNumber + 1).padStart(3, '0')}`;
    }

    for (const alloc of invoice_allocations) {
      const parsedInvoiceId = parseInt(alloc.invoice_id, 10);

      const invoice = db.prepare(`
        SELECT id, customer_id, balance_amount, status
        FROM invoices
        WHERE id = ?
      `).get(parsedInvoiceId) as any;

      if (!invoice) {
        res.status(404).json({
          success: false,
          error: `Invoice ${parsedInvoiceId} not found`
        });
        return;
      }

      console.log('Payment validation - Invoice:', parsedInvoiceId, 'Invoice customer_id:', invoice.customer_id, typeof invoice.customer_id, 'Parsed customer_id:', parsedCustomerId, typeof parsedCustomerId);

      if (invoice.customer_id !== parsedCustomerId) {
        res.status(400).json({
          success: false,
          error: `Invoice ${parsedInvoiceId} does not belong to customer ${parsedCustomerId}`
        });
        return;
      }

      if (alloc.amount <= 0) {
        res.status(400).json({
          success: false,
          error: `Allocation amount for invoice ${alloc.invoice_id} must be greater than 0`
        });
        return;
      }
    }

    const totalAllocated = invoice_allocations.reduce((sum: number, alloc: any) => sum + parseFloat(alloc.amount), 0);
    if (Math.abs(totalAllocated - parseFloat(amount)) > 0.01) {
      res.status(400).json({
        success: false,
        error: `Payment amount (${amount}) does not match total allocated amount (${totalAllocated})`
      });
      return;
    }

    const transaction = db.transaction(() => {
      const paymentStmt = db.prepare(`
        INSERT INTO payments (
          payment_no, customer_id, payment_date, amount, 
          payment_method, reference_no, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const paymentResult = paymentStmt.run(
        newPaymentNo,
        parsedCustomerId,
        payment_date,
        amount,
        payment_method || 'Cash',
        reference_no || '',
        notes || ''
      );

      const paymentId = paymentResult.lastInsertRowid as number;

      const allocationStmt = db.prepare(`
        INSERT INTO payment_allocations (
          payment_id, invoice_id, amount
        ) VALUES (?, ?, ?)
      `);

      for (const alloc of invoice_allocations) {
        const invoiceId = parseInt(alloc.invoice_id, 10);
        allocationStmt.run(paymentId, invoiceId, alloc.amount);

        ledgerUtils.calculateInvoiceBalance(invoiceId);
        ledgerUtils.updateInvoiceStatus(invoiceId);
      }

      const ledgerStmt = db.prepare(`
        INSERT INTO customer_ledger (
          customer_id, transaction_date, transaction_type, reference_no,
          debit, credit, balance, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const currentBalance = db.prepare('SELECT current_balance FROM customers WHERE id = ?').get(parsedCustomerId) as { current_balance: number };
      const newBalance = parseFloat(String(currentBalance.current_balance || 0)) - parseFloat(String(amount));

      const invoiceNumbers = invoice_allocations.map((alloc: any) => {
        const invoiceId = parseInt(alloc.invoice_id, 10);
        const inv = db.prepare('SELECT invoice_no FROM invoices WHERE id = ?').get(invoiceId) as { invoice_no: string } | undefined;
        console.log('Ledger description - Looking up invoice:', invoiceId, 'Found:', inv);
        return inv && inv.invoice_no ? inv.invoice_no : `Invoice #${invoiceId}`;
      });

      ledgerStmt.run(
        parsedCustomerId,
        payment_date,
        'PAYMENT',
        newPaymentNo,
        0,
        amount,
        newBalance,
        `Payment against ${invoiceNumbers.join(', ')}`
      );

      ledgerUtils.updateCustomerBalance(parsedCustomerId);

      return paymentId;
    });

    const paymentId = transaction();

    // Get customer name for logging
    const customerResult = db.prepare('SELECT customer_name FROM customers WHERE id = ?').get(parsedCustomerId) as { customer_name: string } | undefined;

    // Log payment creation using activity logger
    logCRUD(ActionType.PAYMENT_CREATE, 'Payment', paymentId as number, `Created payment: ${newPaymentNo} - $${amount} from ${customerResult?.customer_name || 'Unknown'}`, req.user!.id, {
      payment_no: newPaymentNo,
      customer_id: parsedCustomerId,
      amount,
      payment_method,
      invoice_allocations: invoice_allocations.length
    });

    const createdPayment = db.prepare(`
      SELECT 
        p.id, p.payment_no, p.customer_id, c.customer_name, p.invoice_id, i.invoice_no,
        p.payment_date, p.amount, p.payment_method, p.reference_no, p.notes, p.created_at,
        GROUP_CONCAT(pa.invoice_id, ',') as allocated_invoices,
        GROUP_CONCAT(pa.amount, ',') as allocation_amounts,
        GROUP_CONCAT(pa.id, ',') as allocation_ids
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN payment_allocations pa ON p.id = pa.payment_id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(paymentId.toString()) as any;

    if (createdPayment && createdPayment.allocated_invoices) {
      const allocationQuery = `
        SELECT pa.id, pa.payment_id, pa.invoice_id, i.invoice_no, pa.amount
        FROM payment_allocations pa
        LEFT JOIN invoices i ON pa.invoice_id = i.id
        WHERE pa.payment_id = ?
        ORDER BY pa.id
      `;
      createdPayment.allocations = db.prepare(allocationQuery).all(paymentId.toString());
    }

    res.status(201).json({
      success: true,
      data: createdPayment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment'
    });
  }
}

function updatePayment(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const {
      payment_date,
      amount,
      payment_method,
      reference_no,
      notes
    } = req.body;

    const existingPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as any;
    if (!existingPayment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
      return;
    }

    const stmt = db.prepare(`
      UPDATE payments SET
        payment_date = COALESCE(?, payment_date),
        amount = COALESCE(?, amount),
        payment_method = COALESCE(?, payment_method),
        reference_no = COALESCE(?, reference_no),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `);

    stmt.run(
      payment_date, amount, payment_method, reference_no, notes, id
    );

    ledgerUtils.updateCustomerBalance(existingPayment.customer_id);

    const allocations = db.prepare('SELECT invoice_id FROM payment_allocations WHERE payment_id = ?').all(id) as { invoice_id: number }[];
    for (const alloc of allocations) {
      ledgerUtils.calculateInvoiceBalance(alloc.invoice_id);
      ledgerUtils.updateInvoiceStatus(alloc.invoice_id);
    }

    // Log payment update using activity logger
    logCRUD(ActionType.PAYMENT_UPDATE, 'Payment', parseInt(Array.isArray(id) ? id[0] : id, 10), `Updated payment: ${existingPayment.payment_no}`, req.user!.id, {
      payment_no: existingPayment.payment_no,
      changes: Object.keys(req.body).filter(k => req.body[k] !== undefined)
    });

    res.json({
      success: true,
      message: 'Payment updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment'
    });
  }
}

function deletePayment(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;

    const existingPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as any;
    if (!existingPayment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
      return;
    }

    const transaction = db.transaction(() => {
      const allocations = db.prepare('SELECT * FROM payment_allocations WHERE payment_id = ?').all(id) as Array<{ invoice_id: number }>;

      db.prepare('DELETE FROM payment_allocations WHERE payment_id = ?').run(id);

      db.prepare('DELETE FROM payments WHERE id = ?').run(id);

      db.prepare('DELETE FROM customer_ledger WHERE reference_no = ?').run(existingPayment.payment_no);

      for (const alloc of allocations) {
        ledgerUtils.calculateInvoiceBalance(alloc.invoice_id);
        ledgerUtils.updateInvoiceStatus(alloc.invoice_id);
      }

      ledgerUtils.updateCustomerBalance(existingPayment.customer_id);
    });

    transaction();

    // Log payment deletion using activity logger
    const paymentId = Array.isArray(id) ? id[0] : id;
    logCRUD(ActionType.PAYMENT_DELETE, 'Payment', parseInt(paymentId, 10), `Deleted payment: ${existingPayment.payment_no} - $${existingPayment.amount}`, req.user!.id, {
      payment_no: existingPayment.payment_no,
      amount: existingPayment.amount
    });

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete payment'
    });
  }
}

function allocatePaymentToInvoice(req: Request, res: Response): void {
  try {
    res.status(501).json({
      success: false,
      error: 'Manual allocation endpoint not implemented - use createPayment with allocations instead'
    });
  } catch (error) {
    console.error('Error allocating payment to invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to allocate payment to invoice'
    });
  }
}

export default {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  allocatePaymentToInvoice
};
