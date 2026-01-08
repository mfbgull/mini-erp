import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { logCRUD, ActionType } from '../services/activityLogger';
import db from '../config/database';

function getCustomers(req: Request, res: Response): void {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'customer_name', sortOrder = 'ASC' } = req.query;

    let query = `
      SELECT
        id, customer_code, customer_name, contact_person, email, phone,
        billing_address, shipping_address, payment_terms, payment_terms_days,
        credit_limit, current_balance,
        CASE
          WHEN credit_limit > 0 THEN ROUND((current_balance / credit_limit) * 100,2)
          ELSE 0
        END as credit_utilization_percent,
        is_active, created_at, updated_at
      FROM customers
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search) {
      query += ` AND (customer_name LIKE ? OR customer_code LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    const status = req.query.status;
    if (status && status !== 'all') {
      if (status === 'active') {
        query += ' AND is_active = 1';
      } else if (status === 'inactive') {
        query += ' AND is_active = 0';
      }
    }

    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const customers = db.prepare(query).all(...params);

    let countQuery = `
      SELECT COUNT(*) as total
      FROM customers
      WHERE 1=1
    `;

    let countParams: any[] = [];
    if (search) {
      countQuery += ` AND (customer_name LIKE ? OR customer_code LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        countQuery += ' AND is_active = 1';
      } else if (status === 'inactive') {
        countQuery += ' AND is_active = 0';
      }
    }

    const total = db.prepare(countQuery).get(...countParams).total as number;

    res.json({
      success: true,
      data: customers,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        hasNext: Number(page) < Math.ceil(total / Number(limit)),
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    });
  }
}

function getCustomer(req: Request, res: Response): void {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        id, customer_code, customer_name, contact_person, email, phone,
        billing_address, shipping_address, payment_terms, payment_terms_days,
        credit_limit, current_balance, opening_balance,
        CASE
          WHEN credit_limit > 0 THEN ROUND((current_balance / credit_limit) * 100,2)
          ELSE 0
        END as credit_utilization_percent,
        is_active, created_at, updated_at
      FROM customers
      WHERE id = ?
    `;

    const customer = db.prepare(query).get(id) as any;

    if (!customer) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
      return;
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer'
    });
  }
}

function createCustomer(req: AuthRequest, res: Response): void {
  try {
    const {
      customer_name,
      contact_person,
      email,
      phone,
      billing_address,
      shipping_address,
      payment_terms,
      payment_terms_days,
      credit_limit,
      opening_balance
    } = req.body;

    if (!customer_name || !phone) {
      res.status(400).json({
        success: false,
        error: 'Customer name and phone are required'
      });
      return;
    }

    const maxCodeResult = db.prepare('SELECT MAX(customer_code) as max_code FROM customers WHERE customer_code LIKE \'CUST%\'').get() as { max_code: string } | undefined;
    let newCustomerCode = 'CUST001';

    if (maxCodeResult && maxCodeResult.max_code) {
      const lastNumber = parseInt(maxCodeResult.max_code.replace('CUST', ''));
      newCustomerCode = `CUST${String(lastNumber + 1).padStart(3, '0')}`;
    }

    const stmt = db.prepare(`
      INSERT INTO customers (
        customer_code, customer_name, contact_person, email, phone,
        billing_address, shipping_address, payment_terms, payment_terms_days,
        credit_limit, current_balance, opening_balance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      newCustomerCode,
      customer_name,
      contact_person || '',
      email || '',
      phone,
      billing_address || '',
      shipping_address || '',
      payment_terms || '',
      payment_terms_days || 14,
      credit_limit || 0,
      opening_balance || 0,
      opening_balance || 0
    );

    if (opening_balance && parseFloat(opening_balance) !== 0) {
      const ledgerStmt = db.prepare(`
        INSERT INTO customer_ledger (
          customer_id, transaction_date, transaction_type, reference_no,
          debit, credit, balance, description
        ) VALUES (?, date('now'), ?, ?, ?, ?, ?, ?)
      `);

      let debit = 0, credit = 0;
      if (parseFloat(opening_balance) > 0) {
        debit = opening_balance;
      } else {
        credit = Math.abs(parseFloat(opening_balance));
      }

      const newBalance = parseFloat(opening_balance);

      ledgerStmt.run(
        result.lastInsertRowid,
        'OPENING_BALANCE',
        `OPEN-${newCustomerCode}`,
        debit,
        credit,
        newBalance,
        'Opening Balance'
      );
    }

    const createdCustomer = db.prepare(
      'SELECT * FROM customers WHERE id = ?'
    ).get(result.lastInsertRowid);

    // Log customer creation using activity logger
    const customerName = req.body.customer_name;
    logCRUD(ActionType.CUSTOMER_CREATE, 'Customer', result.lastInsertRowid as number, `Created customer: ${customerName}`, req.user!.id, {
      customer_code: newCustomerCode,
      customer_name: customerName,
      credit_limit: req.body.credit_limit
    });

    res.status(201).json({
      success: true,
      data: createdCustomer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    });
  }
}

function updateCustomer(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const {
      customer_name,
      contact_person,
      email,
      phone,
      billing_address,
      shipping_address,
      payment_terms,
      payment_terms_days,
      credit_limit,
      is_active
    } = req.body;

    const existingCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!existingCustomer) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
      return;
    }

    const stmt = db.prepare(`
      UPDATE customers SET
        customer_name = COALESCE(?, customer_name),
        contact_person = COALESCE(?, contact_person),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        billing_address = COALESCE(?, billing_address),
        shipping_address = COALESCE(?, shipping_address),
        payment_terms = COALESCE(?, payment_terms),
        payment_terms_days = COALESCE(?, payment_terms_days),
        credit_limit = COALESCE(?, credit_limit),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      customer_name, contact_person, email, phone,
      billing_address, shipping_address, payment_terms,
      payment_terms_days, credit_limit, is_active, id
    );

    const updatedCustomer = db.prepare(
      'SELECT * FROM customers WHERE id = ?'
    ).get(id);

    // Log customer update using activity logger
    logCRUD(ActionType.CUSTOMER_UPDATE, 'Customer', parseInt(id, 10), `Updated customer: ${customer_name || existingCustomer.customer_name}`, req.user!.id, {
      changes: Object.keys(req.body).filter(k => req.body[k] !== undefined)
    });

    res.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer'
    });
  }
}

function deleteCustomer(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;

    const existingCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!existingCustomer) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
      return;
    }

    const invoiceCount = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?').get(id).count as number;
    const paymentCount = db.prepare('SELECT COUNT(*) as count FROM payments WHERE customer_id = ?').get(id).count as number;

    if (invoiceCount > 0 || paymentCount > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete customer with existing transactions'
      });
      return;
    }

    const stmt = db.prepare('UPDATE customers SET is_active = 0 WHERE id = ?');
    stmt.run(id);

    // Log customer deactivation using activity logger
    logCRUD(ActionType.CUSTOMER_DELETE, 'Customer', parseInt(id, 10), `Deactivated customer: ${existingCustomer.customer_name}`, req.user!.id, {
      customer_code: existingCustomer.customer_code
    });

    res.json({
      success: true,
      message: 'Customer deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer'
    });
  }
}

function getCustomerLedger(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { sortBy = 'transaction_date', sortOrder = 'DESC' } = req.query;

    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
    if (!customer) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
      return;
    }

    const query = `
      SELECT
        id, transaction_date, transaction_type, reference_no,
        debit, credit, balance, description, created_at
      FROM customer_ledger
      WHERE customer_id = ?
      ORDER BY ${sortBy} ${sortOrder}
    `;

    const ledgerEntries = db.prepare(query).all(id);

    res.json({
      success: true,
      data: ledgerEntries
    });
  } catch (error) {
    console.error('Error fetching customer ledger:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer ledger'
    });
  }
}

function getCustomerStatement(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { fromDate, toDate } = req.query;

    const customer = db.prepare('SELECT id, customer_name FROM customers WHERE id = ?').get(id);
    if (!customer) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
      return;
    }

    let query = `
      SELECT
        transaction_date, transaction_type, reference_no,
        debit, credit, balance, description
      FROM customer_ledger
      WHERE customer_id = ?
    `;

    const params: any[] = [id];

    if (fromDate) {
      query += ' AND transaction_date >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      query += ' AND transaction_date <= ?';
      params.push(toDate);
    }

    query += ' ORDER BY transaction_date ASC';

    const statementData = db.prepare(query).all(...params);

    let openingBalanceQuery = 'SELECT balance FROM customer_ledger WHERE customer_id = ?';
    const openingBalanceParams: any[] = [id];

    if (fromDate) {
      openingBalanceQuery += ' AND transaction_date < ? ORDER BY transaction_date DESC LIMIT 1';
      openingBalanceParams.push(fromDate);
    } else {
      openingBalanceQuery += ' ORDER BY transaction_date DESC LIMIT 1';
    }

    const openingBalanceResult = db.prepare(openingBalanceQuery).get(...openingBalanceParams) as { balance: number } | undefined;
    const openingBalance = openingBalanceResult ? openingBalanceResult.balance : 0;

    let runningBalance = parseFloat(String(openingBalance));
    let closingBalance = runningBalance;

    for (const entry of statementData as any[]) {
      runningBalance += parseFloat(entry.debit || 0) - parseFloat(entry.credit || 0);
    }
    closingBalance = runningBalance;

    res.json({
      success: true,
      data: {
        customer: customer,
        period: {
          fromDate: fromDate || null,
          toDate: toDate || null
        },
        openingBalance: parseFloat(String(openingBalance)),
        closingBalance: parseFloat(String(closingBalance)),
        transactions: statementData
      }
    });
  } catch (error) {
    console.error('Error fetching customer statement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer statement'
    });
  }
}

function getCustomerBalance(req: Request, res: Response): void {
  try {
    const { id } = req.params;

    const customer = db.prepare('SELECT id, customer_name, current_balance FROM customers WHERE id = ?').get(id);
    if (!customer) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        customerId: customer.id,
        customerName: customer.customer_name,
        currentBalance: parseFloat(customer.current_balance)
      }
    });
  } catch (error) {
    console.error('Error fetching customer balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer balance'
    });
  }
}

function recalculateAllBalances(req: AuthRequest, res: Response): void {
  try {
    // Get all customers
    const customers = db.prepare('SELECT id FROM customers').all();
    
    let updatedCount = 0;
    
    for (const customer of customers) {
      // Calculate balance from invoices
      const balanceResult = db.prepare(`
        SELECT COALESCE(SUM(balance_amount), 0) as total_balance
        FROM invoices
        WHERE customer_id = ? AND status IN ('Unpaid', 'Partially Paid', 'Overdue')
      `).get(customer.id) as { total_balance: number };
      
      const newBalance = balanceResult.total_balance;
      
      // Update customer balance
      db.prepare('UPDATE customers SET current_balance = ? WHERE id = ?').run(newBalance, customer.id);
      updatedCount++;
    }
    
    res.json({
      success: true,
      message: `Recalculated balances for ${updatedCount} customers`
    });
  } catch (error) {
    console.error('Error recalculating balances:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to recalculate balances'
    });
  }
}

export default {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
  getCustomerStatement,
  getCustomerBalance,
  recalculateAllBalances
};
