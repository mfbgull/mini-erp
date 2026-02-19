import { Response } from 'express';
import db from '../config/database';
import { AuthRequest, InvoiceItemDTO, PaymentDTO, InvoiceStatus, Invoice } from '../types';
import StockMovementModel from '../models/StockMovement';
import ledgerUtils from '../utils/ledgerUtils';
import logger from '../utils/logger';
import {
  parseCurrency,
  subtractCurrency,
  addCurrency,
  multiplyCurrency,
} from '../utils/currency';

const {
  createLedgerEntry,
  updateCustomerBalance,
  calculateInvoiceBalance,
  updateInvoiceStatus,
} = ledgerUtils;

// ============ DB Row Types ============

interface InvoiceRow {
  id: number;
  invoice_no: string;
  customer_id: number;
  invoice_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  discount_scope?: string;
  discount_type?: string;
  discount_value?: number;
  notes?: string;
  terms?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  items?: InvoiceItemRow[];
}

interface InvoiceItemRow {
  item_id: number;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate: number;
  discount_type: string;
  discount_value: number;
  item_name?: string;
  item_code?: string;
}

interface StockBalanceRow {
  warehouse_id: number;
  quantity: number;
}

interface WarehouseRow {
  id: number;
}

interface PaymentRow {
  id: number;
  payment_no: string;
  payment_date?: string;
  payment_method?: string;
  reference_no?: string;
  notes?: string;
  amount?: number;
}

interface AllocationRow {
  payment_id: number;
  invoice_id: number;
  amount?: number;
}

interface PaidResultRow {
  total_paid: number;
}

interface CountRow {
  count: number;
}

interface MaxPaymentNoRow {
  max_no: string | null;
}

interface InvoicePaymentRow {
  id: number;
  payment_no: string;
  payment_date: string;
  payment_method: string;
  reference_no: string | null;
  notes: string | null;
  amount: number;
}

interface StockMovementRow {
  warehouse_id: number;
}

// ============ Helpers ============

/**
 * Generate the next payment number atomically using INSERT ON CONFLICT.
 * This prevents race conditions where two concurrent requests could
 * read the same MAX(payment_no) and generate duplicates.
 */
function generatePaymentNoAtomic(): string {
  const settingKey = 'PAY_last_no';

  // Atomic increment: insert '1' if not exists, otherwise increment
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, '1', CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = CAST(CAST(settings.value AS INTEGER) + 1 AS TEXT),
      updated_at = CURRENT_TIMESTAMP
  `).run(settingKey);

  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as { value: string };
  const nextNo = parseInt(setting.value, 10);

  return `PAY${String(nextNo).padStart(3, '0')}`;
}

/**
 * Find the best warehouse for an item, with stock validation logging.
 * Returns the warehouse_id to use for deduction.
 */
function findWarehouseForItem(
  itemId: number,
  requestedQty: number,
  explicitWarehouseId?: number
): number {
  if (explicitWarehouseId) {
    // Validate stock at the explicit warehouse
    const balance = db.prepare(`
      SELECT warehouse_id, quantity
      FROM stock_balances
      WHERE item_id = ? AND warehouse_id = ?
    `).get(itemId, explicitWarehouseId) as StockBalanceRow | undefined;

    if (!balance || balance.quantity < requestedQty) {
      logger.warn(
        `Insufficient stock for item ${itemId} at warehouse ${explicitWarehouseId}: ` +
        `available=${balance?.quantity ?? 0}, requested=${requestedQty}. Proceeding anyway.`
      );
    }
    return explicitWarehouseId;
  }

  // Find warehouse with sufficient stock
  const warehouseWithStock = db.prepare(`
    SELECT warehouse_id, quantity
    FROM stock_balances
    WHERE item_id = ? AND quantity >= ?
    ORDER BY quantity DESC
    LIMIT 1
  `).get(itemId, requestedQty) as StockBalanceRow | undefined;

  if (warehouseWithStock) {
    return warehouseWithStock.warehouse_id;
  }

  // Fallback: any warehouse with this item (even if insufficient)
  const anyWarehouse = db.prepare(`
    SELECT warehouse_id, quantity
    FROM stock_balances
    WHERE item_id = ? AND quantity > 0
    ORDER BY quantity DESC
    LIMIT 1
  `).get(itemId) as StockBalanceRow | undefined;

  if (anyWarehouse) {
    logger.warn(
      `No warehouse has sufficient stock for item ${itemId}: ` +
      `best available=${anyWarehouse.quantity}, requested=${requestedQty}. ` +
      `Using warehouse ${anyWarehouse.warehouse_id}.`
    );
    return anyWarehouse.warehouse_id;
  }

  // Last resort: default warehouse
  const defaultWarehouse = db.prepare(
    'SELECT id FROM warehouses WHERE warehouse_code = ? AND is_active = 1'
  ).get('WH-001') as WarehouseRow | undefined;

  logger.warn(
    `No stock found for item ${itemId} in any warehouse. ` +
    `Falling back to default warehouse.`
  );

  return defaultWarehouse ? defaultWarehouse.id : 1;
}

/**
 * Reverse stock movements for a list of invoice items that were previously sold.
 * Used during invoice update and delete.
 */
function reverseStockForItems(
  items: Array<{ item_id: number; quantity: number; unit_price: number }>,
  invoiceNo: string,
  userId: number,
  referenceDoctype: string
): void {
  for (const item of items) {
    // Find the original warehouse from the SALE movement
    const originalMovement = db.prepare(`
      SELECT warehouse_id FROM stock_movements
      WHERE item_id = ? AND reference_docno = ? AND movement_type = 'SALE'
      LIMIT 1
    `).get(item.item_id, invoiceNo) as StockMovementRow | undefined;

    let warehouseId: number;
    if (originalMovement) {
      warehouseId = originalMovement.warehouse_id;
    } else {
      const defaultWarehouse = db.prepare(
        'SELECT id FROM warehouses WHERE warehouse_code = ? AND is_active = 1'
      ).get('WH-001') as WarehouseRow | undefined;
      warehouseId = defaultWarehouse ? defaultWarehouse.id : 1;
    }

    // Add stock back (positive quantity to reverse the sale)
    StockMovementModel.recordMovement(
      {
        item_id: item.item_id,
        warehouse_id: warehouseId,
        movement_type: 'ADJUSTMENT',
        quantity: item.quantity, // Positive to add back stock
        unit_cost: item.unit_price,
        reference_doctype: referenceDoctype,
        reference_docno: invoiceNo,
        remarks: `Stock reversed - Invoice ${invoiceNo} ${referenceDoctype === 'INVOICE_DELETE' ? 'deleted' : 'updated'}`,
        movement_date: new Date().toISOString().split('T')[0],
      },
      userId,
      db
    );
  }
}

// ============ Controllers ============

/**
 * GET /api/invoices
 * Retrieve all invoices with optional filters.
 */
function getInvoices(req: AuthRequest, res: Response): void {
  try {
    const { customerId, status } = req.query as { customerId?: string; status?: string };

    let query = `
      SELECT
        i.*,
        c.customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.billing_address as customer_address
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (customerId) {
      query += ' AND i.customer_id = ?';
      params.push(parseInt(customerId, 10));
    }

    if (status) {
      const statusList = status.split(',').map((s) => s.trim());
      if (statusList.length > 0) {
        const placeholders = statusList.map(() => '?').join(',');
        query += ` AND i.status IN (${placeholders})`;
        params.push(...statusList);
      }
    }

    query += ' ORDER BY i.created_at DESC';

    const invoices = db.prepare(query).all(...params) as InvoiceRow[];

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error: unknown) {
    logger.error('Get invoices error:', { error });
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
}

/**
 * GET /api/invoices/:id
 * Retrieve a single invoice with its items.
 */
function getInvoice(req: AuthRequest, res: Response): Response | void {
  try {
    const { id } = req.params;

    const invoice = db.prepare(`
      SELECT
        i.*,
        c.customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.billing_address as customer_address
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(id) as InvoiceRow | undefined;

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const items = db.prepare(`
      SELECT
        ii.item_id,
        ii.quantity,
        ii.unit_price,
        ii.amount,
        ii.tax_rate,
        ii.discount_type,
        ii.discount_value,
        item.item_name,
        item.item_code
      FROM invoice_items ii
      LEFT JOIN items item ON ii.item_id = item.id
      WHERE ii.invoice_id = ?
    `).all(id) as InvoiceItemRow[];

    invoice.items = items;

    res.json(invoice);
  } catch (error: unknown) {
    logger.error('Get invoice error:', { error });
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
}

/**
 * POST /api/invoices
 * Create a new invoice. Payment recording, ledger entries, stock movements,
 * and customer balance updates all happen inside a single transaction.
 */
function createInvoice(req: AuthRequest, res: Response): Response | void {
  try {
    const {
      invoice_no,
      customer_id,
      invoice_date,
      due_date,
      status = 'Unpaid' as InvoiceStatus,
      discount_scope,
      discount_type,
      discount_value,
      items,
      notes,
      terms,
      total_amount,
      record_payment,
      payment,
    } = req.body as {
      invoice_no?: string;
      customer_id: number | string;
      invoice_date: string;
      due_date: string;
      status?: InvoiceStatus;
      discount_scope?: string;
      discount_type?: string;
      discount_value?: number;
      items: InvoiceItemDTO[];
      notes?: string;
      terms?: string;
      total_amount: number | string;
      record_payment?: boolean;
      payment?: PaymentDTO;
    };

    if (!customer_id || !invoice_date || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer, date, and items are required' });
    }

    const parsedCustomerId = parseInt(String(customer_id), 10);
    const userId = req.user!.id;

    // === ENTIRE operation inside one transaction ===
    const transaction = db.transaction(() => {
      const totalAmountNum = parseCurrency(total_amount);
      const paymentAmountNum = record_payment && payment
        ? parseCurrency(payment.amount)
        : 0;

      // Determine initial paid/balance/status
      const initialPaidAmount = paymentAmountNum;
      const initialBalanceAmount = subtractCurrency(totalAmountNum, paymentAmountNum);

      let initialStatus: InvoiceStatus;
      if (record_payment && payment && paymentAmountNum > 0) {
        initialStatus = paymentAmountNum >= totalAmountNum ? 'Paid' : 'Partially Paid';
      } else {
        initialStatus = status || 'Unpaid';
      }

      // Insert invoice
      const invoiceResult = db.prepare(`
        INSERT INTO invoices (
          invoice_no, customer_id, invoice_date, due_date, status,
          total_amount, paid_amount, balance_amount, notes,
          discount_scope, discount_type, discount_value, terms, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoice_no,
        parsedCustomerId,
        invoice_date,
        due_date,
        initialStatus,
        totalAmountNum,
        initialPaidAmount,
        initialBalanceAmount,
        notes || null,
        discount_scope || 'invoice',
        discount_type || 'percentage',
        discount_value || 0,
        terms || null,
        userId
      );

      const invoiceId = invoiceResult.lastInsertRowid as number;

      // Insert invoice items and deduct stock
      for (const item of items) {
        const amount = multiplyCurrency(item.quantity, item.unit_price);

        const warehouseId = findWarehouseForItem(
          item.item_id,
          item.quantity,
          item.warehouse_id
        );

        db.prepare(`
          INSERT INTO invoice_items (
            invoice_id, item_id, quantity, unit_price, amount,
            tax_rate, discount_type, discount_value
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          invoiceId,
          item.item_id,
          item.quantity,
          item.unit_price,
          amount,
          item.tax_rate || 0,
          item.discount_type || 'percentage',
          item.discount_value || 0
        );

        // Deduct stock (negative quantity for SALE)
        StockMovementModel.recordMovement(
          {
            item_id: item.item_id,
            warehouse_id: warehouseId,
            movement_type: 'SALE',
            quantity: -item.quantity,
            unit_cost: item.unit_price,
            reference_doctype: 'INVOICE',
            reference_docno: invoice_no!,
            remarks: `Sold via Invoice ${invoice_no}`,
            movement_date: invoice_date,
          },
          userId,
          db
        );
      }

      // Create customer ledger entry (debit to increase AR)
      createLedgerEntry(
        parsedCustomerId,
        'INVOICE',
        invoice_no!,
        totalAmountNum, // debit
        0,              // credit
        `Invoice ${invoice_no}`
      );

      // --- FIX #2: Payment recording INSIDE transaction ---
      if (record_payment && payment && paymentAmountNum > 0) {
        // FIX #5: Atomic payment number generation
        const newPaymentNo = generatePaymentNoAtomic();

        const paymentResult = db.prepare(`
          INSERT INTO payments (
            payment_no, customer_id, payment_date, amount,
            payment_method, reference_no, notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          newPaymentNo,
          parsedCustomerId,
          payment.payment_date,
          paymentAmountNum,
          payment.payment_method,
          payment.reference_no || null,
          payment.notes || null
        );

        const paymentId = paymentResult.lastInsertRowid as number;

        // Payment allocation
        db.prepare(`
          INSERT INTO payment_allocations (payment_id, invoice_id, amount)
          VALUES (?, ?, ?)
        `).run(paymentId, invoiceId, paymentAmountNum);

        // Ledger entry for payment (credit to reduce AR)
        createLedgerEntry(
          parsedCustomerId,
          'PAYMENT',
          newPaymentNo,
          0,                // debit
          paymentAmountNum, // credit
          `Payment ${newPaymentNo} for Invoice ${invoice_no}`
        );
      }

      // --- FIX #6: Customer balance update inside transaction ---
      updateCustomerBalance(parsedCustomerId);

      return invoiceId;
    });

    const invoiceId = transaction();

    // Fetch the created invoice for response (read-only, outside txn is fine)
    const createdInvoice = db.prepare(`
      SELECT
        i.*,
        c.customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.billing_address as customer_address
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(invoiceId) as InvoiceRow;

    res.status(201).json(createdInvoice);
  } catch (error: unknown) {
    // FIX #7: Generic error message, log detail server-side
    logger.error('Create invoice error:', { error });
    res.status(500).json({ error: 'Failed to create invoice' });
  }
}

/**
 * PUT /api/invoices/:id
 * Update an existing invoice. Reverses old stock movements before
 * applying new ones. Payment changes and customer balance updates
 * are all inside the transaction.
 */
function updateInvoice(req: AuthRequest, res: Response): Response | void {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id as string, 10);

    const {
      invoice_no,
      customer_id,
      invoice_date,
      due_date,
      status,
      discount_scope,
      discount_type,
      discount_value,
      items,
      notes,
      terms,
      total_amount,
      deleted_payments,
      record_payment,
      payment,
    } = req.body as {
      invoice_no: string;
      customer_id: number | string;
      invoice_date: string;
      due_date: string;
      status?: InvoiceStatus;
      discount_scope?: string;
      discount_type?: string;
      discount_value?: number;
      items: InvoiceItemDTO[];
      notes?: string;
      terms?: string;
      total_amount: number | string;
      deleted_payments?: number[];
      record_payment?: boolean;
      payment?: PaymentDTO;
    };

    if (!customer_id || !invoice_date || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer, date, and items are required' });
    }

    const parsedCustomerId = parseInt(String(customer_id), 10);
    const userId = req.user!.id;

    // Get the original invoice before the transaction
    const originalInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as InvoiceRow | undefined;
    if (!originalInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const transaction = db.transaction(() => {
      // === Handle deleted payments ===
      if (deleted_payments && Array.isArray(deleted_payments) && deleted_payments.length > 0) {
        for (const deletedPaymentId of deleted_payments) {
          const paymentInfo = db.prepare('SELECT payment_no FROM payments WHERE id = ?').get(deletedPaymentId) as PaymentRow | undefined;
          if (paymentInfo) {
            db.prepare('DELETE FROM customer_ledger WHERE reference_no = ?').run(paymentInfo.payment_no);
          }

          const allocations = db.prepare(
            'SELECT invoice_id FROM payment_allocations WHERE payment_id = ?'
          ).all(deletedPaymentId) as AllocationRow[];

          db.prepare('DELETE FROM payment_allocations WHERE payment_id = ?').run(deletedPaymentId);
          db.prepare('DELETE FROM payments WHERE id = ?').run(deletedPaymentId);

          // Update paid/balance amounts for each affected invoice
          for (const alloc of allocations) {
            const paidResult = db.prepare(`
              SELECT COALESCE(SUM(amount), 0) as total_paid
              FROM payment_allocations
              WHERE invoice_id = ?
            `).get(alloc.invoice_id) as PaidResultRow;

            const invoiceForBalance = db.prepare(
              'SELECT total_amount FROM invoices WHERE id = ?'
            ).get(alloc.invoice_id) as { total_amount: number } | undefined;

            const totalPaid = parseCurrency(paidResult.total_paid);
            const totalAmt = parseCurrency(invoiceForBalance?.total_amount);
            const newBalance = subtractCurrency(totalAmt, totalPaid);

            db.prepare(
              'UPDATE invoices SET paid_amount = ?, balance_amount = ? WHERE id = ?'
            ).run(totalPaid, newBalance, alloc.invoice_id);
          }
        }
      }

      // === Handle new payment recording (FIX #2: inside transaction) ===
      let newPaymentAmount = 0;
      if (record_payment && payment && parseCurrency(payment.amount) > 0) {
        newPaymentAmount = parseCurrency(payment.amount);

        // FIX #5: Atomic payment number generation
        const newPaymentNo = generatePaymentNoAtomic();

        const paymentResult = db.prepare(`
          INSERT INTO payments (
            payment_no, customer_id, payment_date, amount,
            payment_method, reference_no, notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          newPaymentNo,
          parsedCustomerId,
          payment.payment_date,
          newPaymentAmount,
          payment.payment_method,
          payment.reference_no || null,
          payment.notes || null
        );

        const newPaymentId = paymentResult.lastInsertRowid as number;

        db.prepare(`
          INSERT INTO payment_allocations (payment_id, invoice_id, amount)
          VALUES (?, ?, ?)
        `).run(newPaymentId, invoiceId, newPaymentAmount);

        // Ledger entry for payment (credit to reduce AR)
        createLedgerEntry(
          parsedCustomerId,
          'PAYMENT',
          newPaymentNo,
          0,
          newPaymentAmount,
          `Payment ${newPaymentNo} for Invoice ${invoice_no}`
        );
      }

      // === Recalculate paid/balance ===
      const paidResult = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total_paid
        FROM payment_allocations
        WHERE invoice_id = ?
      `).get(invoiceId) as PaidResultRow;

      const totalPaid = parseCurrency(paidResult.total_paid);
      const totalAmountNum = parseCurrency(total_amount);
      const newBalanceAmount = subtractCurrency(totalAmountNum, totalPaid);

      // Determine status
      let newStatus: InvoiceStatus;
      if (newBalanceAmount <= 0 && totalAmountNum > 0) {
        newStatus = 'Paid';
      } else if (newBalanceAmount > 0 && newBalanceAmount < totalAmountNum) {
        newStatus = 'Partially Paid';
      } else {
        newStatus = status || 'Unpaid';
      }

      // Update invoice record
      db.prepare(`
        UPDATE invoices
        SET
          invoice_no = ?, customer_id = ?, invoice_date = ?, due_date = ?,
          status = ?, total_amount = ?, paid_amount = ?, balance_amount = ?, notes = ?,
          discount_scope = ?, discount_type = ?, discount_value = ?, terms = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        invoice_no,
        parsedCustomerId,
        invoice_date,
        due_date,
        newStatus,
        totalAmountNum,
        totalPaid,
        newBalanceAmount,
        notes || null,
        discount_scope || 'invoice',
        discount_type || 'percentage',
        discount_value || 0,
        terms || null,
        invoiceId
      );

      // === FIX #4: Reverse old stock before inserting new items ===
      const oldItems = db.prepare(
        'SELECT item_id, quantity, unit_price FROM invoice_items WHERE invoice_id = ?'
      ).all(invoiceId) as Array<{ item_id: number; quantity: number; unit_price: number }>;

      reverseStockForItems(oldItems, originalInvoice.invoice_no, userId, 'INVOICE_UPDATE');

      // Delete existing invoice items
      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoiceId);

      // Insert new invoice items and create new stock movements
      for (const item of items) {
        const amount = multiplyCurrency(item.quantity, item.unit_price);

        db.prepare(`
          INSERT INTO invoice_items (
            invoice_id, item_id, quantity, unit_price, amount,
            tax_rate, discount_type, discount_value
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          invoiceId,
          item.item_id,
          item.quantity,
          item.unit_price,
          amount,
          item.tax_rate || 0,
          item.discount_type || 'percentage',
          item.discount_value || 0
        );

        // FIX #3: Stock validation with warning
        const warehouseId = findWarehouseForItem(
          item.item_id,
          item.quantity,
          item.warehouse_id
        );

        // Deduct stock for new items
        StockMovementModel.recordMovement(
          {
            item_id: item.item_id,
            warehouse_id: warehouseId,
            movement_type: 'SALE',
            quantity: -item.quantity,
            unit_cost: item.unit_price,
            reference_doctype: 'INVOICE',
            reference_docno: invoice_no,
            remarks: `Sold via Invoice ${invoice_no} (updated)`,
            movement_date: invoice_date,
          },
          userId,
          db
        );
      }

      // Update ledger entry for the invoice if total changed
      // Delete old invoice ledger entry and recreate with new amount
      db.prepare("DELETE FROM customer_ledger WHERE reference_no = ? AND transaction_type = 'INVOICE'").run(invoice_no);
      createLedgerEntry(
        parsedCustomerId,
        'INVOICE',
        invoice_no,
        totalAmountNum,
        0,
        `Invoice ${invoice_no} (updated)`
      );

      // --- FIX #6: Customer balance update inside transaction ---
      if (originalInvoice.customer_id !== parsedCustomerId) {
        updateCustomerBalance(originalInvoice.customer_id);
      }
      updateCustomerBalance(parsedCustomerId);

      // Update invoice status and balance
      updateInvoiceStatus(invoiceId);
    });

    transaction();

    // Fetch updated invoice for response
    const updatedInvoice = db.prepare(`
      SELECT
        i.*,
        c.customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.billing_address as customer_address
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(invoiceId) as InvoiceRow;

    res.json(updatedInvoice);
  } catch (error: unknown) {
    logger.error('Update invoice error:', { error });
    res.status(500).json({ error: 'Failed to update invoice' });
  }
}

/**
 * DELETE /api/invoices/:id
 * Delete an invoice, reversing all stock movements, cleaning up payments,
 * allocations, and ledger entries.
 */
function deleteInvoice(req: AuthRequest, res: Response): Response | void {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id as string, 10);
    const userId = req.user!.id;

    const invoice = db.prepare(
      'SELECT id, customer_id, invoice_no, invoice_date FROM invoices WHERE id = ?'
    ).get(invoiceId) as InvoiceRow | undefined;

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoiceItems = db.prepare(
      'SELECT item_id, quantity, unit_price FROM invoice_items WHERE invoice_id = ?'
    ).all(invoiceId) as Array<{ item_id: number; quantity: number; unit_price: number }>;

    const transaction = db.transaction(() => {
      // Clean up payment allocations and orphaned payments
      const allocations = db.prepare(
        'SELECT payment_id FROM payment_allocations WHERE invoice_id = ?'
      ).all(invoiceId) as AllocationRow[];

      db.prepare('DELETE FROM payment_allocations WHERE invoice_id = ?').run(invoiceId);

      for (const alloc of allocations) {
        const otherAllocations = db.prepare(
          'SELECT COUNT(*) as count FROM payment_allocations WHERE payment_id = ?'
        ).get(alloc.payment_id) as CountRow;

        if (otherAllocations.count === 0) {
          const paymentInfo = db.prepare(
            'SELECT payment_no FROM payments WHERE id = ?'
          ).get(alloc.payment_id) as PaymentRow | undefined;

          if (paymentInfo) {
            db.prepare('DELETE FROM customer_ledger WHERE reference_no = ?').run(paymentInfo.payment_no);
          }

          db.prepare('DELETE FROM payments WHERE id = ?').run(alloc.payment_id);
        }
      }

      // Reverse stock movements
      reverseStockForItems(invoiceItems, invoice.invoice_no, userId, 'INVOICE_DELETE');

      // Delete invoice items
      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoiceId);

      // Delete related ledger entries
      db.prepare('DELETE FROM customer_ledger WHERE reference_no = ?').run(invoice.invoice_no);

      // Delete invoice
      db.prepare('DELETE FROM invoices WHERE id = ?').run(invoiceId);

      // --- FIX #6: Customer balance update inside transaction ---
      updateCustomerBalance(invoice.customer_id);
    });

    transaction();

    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error: unknown) {
    logger.error('Delete invoice error:', { error });
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
}

/**
 * GET /api/invoices/:id/payments
 * Retrieve all payments allocated to a specific invoice.
 */
function getInvoicePayments(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id as string, 10);

    const payments = db.prepare(`
      SELECT
        p.id,
        p.payment_no,
        p.payment_date,
        p.payment_method,
        p.reference_no,
        p.notes,
        pa.amount
      FROM payment_allocations pa
      JOIN payments p ON pa.payment_id = p.id
      WHERE pa.invoice_id = ?
      ORDER BY p.payment_date DESC
    `).all(invoiceId) as InvoicePaymentRow[];

    res.json({
      success: true,
      data: payments,
    });
  } catch (error: unknown) {
    logger.error('Get invoice payments error:', { error });
    res.status(500).json({ error: 'Failed to fetch invoice payments' });
  }
}

export {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicePayments,
};

export default {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicePayments,
};
