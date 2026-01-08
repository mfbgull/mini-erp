import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { logCRUD, ActionType } from '../services/activityLogger';
import db from '../config/database';

function createExpense(req: AuthRequest, res: Response): void {
  try {
    console.log('Create expense request body:', req.body);
    console.log('Authenticated user:', req.user);

    const {
      expense_category,
      description,
      amount,
      expense_date,
      payment_method,
      reference_no,
      vendor_name,
      project,
      status
    } = req.body;

    const userId = req.user!.id;

    console.log('Validation check - expense_category:', expense_category, 'amount:', amount, 'expense_date:', expense_date);
    if (!expense_category || !amount || !expense_date) {
      console.log('Validation failed - missing required fields');
      res.status(400).json({
        success: false,
        error: 'Expense category, amount, and expense date are required'
      });
      return;
    }

    const date = new Date(expense_date);
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const lastExpense = db.prepare(`
      SELECT expense_no FROM expenses 
      WHERE expense_no LIKE ? 
      ORDER BY expense_no DESC 
      LIMIT 1
    `).get(`EXP-${year}${month}-%`) as { expense_no: string } | undefined;

    let expenseNo: string;
    if (lastExpense) {
      const lastNum = parseInt(lastExpense.expense_no.split('-')[2]);
      expenseNo = `EXP-${year}${month}-${String(lastNum + 1).padStart(4, '0')}`;
    } else {
      expenseNo = `EXP-${year}${month}-0001`;
    }

    const parsedAmount = parseFloat(amount);
    console.log('Parsed amount:', parsedAmount, 'Original amount:', amount);

    if (isNaN(parsedAmount)) {
      console.log('Amount is not a valid number');
      res.status(400).json({
        success: false,
        error: 'Amount must be a valid number'
      });
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO expenses (
        expense_no, expense_category, description, amount, expense_date,
        payment_method, reference_no, vendor_name, project, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      expenseNo,
      expense_category,
      description || '',
      parsedAmount,
      expense_date,
      payment_method || null,
      reference_no || null,
      vendor_name || null,
      project || null,
      status || 'Approved',
      userId
    );

    // Log expense creation using activity logger
    logCRUD(ActionType.EXPENSE_CREATE, 'Expense', result.lastInsertRowid as number, `Created expense: ${expenseNo} - ${expense_category} ($${parsedAmount})`, req.user!.id, {
      expense_no: expenseNo,
      expense_category,
      amount: parsedAmount,
      vendor_name
    });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: {
        id: result.lastInsertRowid,
        expense_no: expenseNo,
        expense_category,
        description,
        amount: parseFloat(amount),
        expense_date,
        payment_method,
        reference_no,
        vendor_name,
        project,
        status: status || 'Approved',
        created_by: userId
      }
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create expense'
    });
  }
}

function getExpenses(req: Request, res: Response): void {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      vendor,
      from_date,
      to_date,
      search
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT
        e.id,
        e.expense_no,
        e.expense_category,
        e.description,
        e.amount,
        e.expense_date,
        e.payment_method,
        e.reference_no,
        e.vendor_name,
        e.project,
        e.status,
        e.created_at,
        u.full_name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (category) {
      query += ' AND e.expense_category = ?';
      params.push(category as string);
    }

    if (status) {
      query += ' AND e.status = ?';
      params.push(status as string);
    }

    if (vendor) {
      query += ' AND e.vendor_name LIKE ?';
      params.push(`%${vendor}%`);
    }

    if (from_date) {
      query += ' AND e.expense_date >= ?';
      params.push(from_date as string);
    }

    if (to_date) {
      query += ' AND e.expense_date <= ?';
      params.push(to_date as string);
    }

    if (search) {
      query += ' AND (e.description LIKE ? OR e.expense_category LIKE ? OR e.vendor_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    let countQuery = `SELECT COUNT(*) as count FROM expenses e WHERE 1=1`;
    const countParams: (string | number)[] = [];

    if (category) {
      countQuery += ' AND e.expense_category = ?';
      countParams.push(category as string);
    }

    if (status) {
      countQuery += ' AND e.status = ?';
      countParams.push(status as string);
    }

    if (vendor) {
      countQuery += ' AND e.vendor_name LIKE ?';
      countParams.push(`%${vendor}%`);
    }

    if (from_date) {
      countQuery += ' AND e.expense_date >= ?';
      countParams.push(from_date as string);
    }

    if (to_date) {
      countQuery += ' AND e.expense_date <= ?';
      countParams.push(to_date as string);
    }

    if (search) {
      countQuery += ' AND (e.description LIKE ? OR e.expense_category LIKE ? OR e.vendor_name LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = db.prepare(countQuery).get(...countParams) as { count: number };

    query += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const expenses = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(countResult.count / limitNum),
        total_expenses: countResult.count,
        per_page: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expenses'
    });
  }
}

function getExpenseById(req: Request, res: Response): void {
  try {
    const { id } = req.params;

    const expense = db.prepare(`
      SELECT 
        e.id,
        e.expense_no,
        e.expense_category,
        e.description,
        e.amount,
        e.expense_date,
        e.payment_method,
        e.reference_no,
        e.vendor_name,
        e.project,
        e.status,
        e.created_at,
        e.updated_at,
        u.full_name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(id);

    if (!expense) {
      res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
      return;
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expense'
    });
  }
}

function updateExpense(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const {
      expense_category,
      description,
      amount,
      expense_date,
      payment_method,
      reference_no,
      vendor_name,
      project,
      status
    } = req.body;

    const existingExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any;
    if (!existingExpense) {
      res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
      return;
    }

    const stmt = db.prepare(`
      UPDATE expenses SET
        expense_category = ?,
        description = ?,
        amount = ?,
        expense_date = ?,
        payment_method = ?,
        reference_no = ?,
        vendor_name = ?,
        project = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      expense_category || existingExpense.expense_category,
      description || existingExpense.description,
      amount !== undefined ? parseFloat(amount) : existingExpense.amount,
      expense_date || existingExpense.expense_date,
      payment_method || existingExpense.payment_method,
      reference_no || existingExpense.reference_no,
      vendor_name || existingExpense.vendor_name,
      project || existingExpense.project,
      status || existingExpense.status,
      id
    );

    // Log expense update using activity logger
    logCRUD(ActionType.EXPENSE_UPDATE, 'Expense', parseInt(id, 10), `Updated expense: ${existingExpense.expense_no}`, req.user!.id, {
      expense_no: existingExpense.expense_no,
      changes: Object.keys(req.body).filter(k => req.body[k] !== undefined)
    });

    const updatedExpense = db.prepare(`
      SELECT 
        e.id,
        e.expense_no,
        e.expense_category,
        e.description,
        e.amount,
        e.expense_date,
        e.payment_method,
        e.reference_no,
        e.vendor_name,
        e.project,
        e.status,
        e.created_at,
        e.updated_at,
        u.full_name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(id);

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update expense'
    });
  }
}

function deleteExpense(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;

    const existingExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!existingExpense) {
      res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
      return;
    }

    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);

    // Log expense deletion using activity logger
    logCRUD(ActionType.EXPENSE_DELETE, 'Expense', parseInt(id, 10), `Deleted expense: ${existingExpense.expense_no}`, req.user!.id, {
      expense_no: existingExpense.expense_no,
      amount: existingExpense.amount
    });

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete expense'
    });
  }
}

function getExpensesByDateRange(req: Request, res: Response): void {
  try {
    const { from_date, to_date } = req.query;

    if (!from_date || !to_date) {
      res.status(400).json({
        success: false,
        error: 'from_date and to_date are required'
      });
      return;
    }

    const expenses = db.prepare(`
      SELECT 
        e.id,
        e.expense_no,
        e.expense_category,
        e.description,
        e.amount,
        e.expense_date,
        e.payment_method,
        e.reference_no,
        e.vendor_name,
        e.project,
        e.status,
        e.created_at,
        u.full_name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.expense_date BETWEEN ? AND ?
      ORDER BY e.expense_date DESC
    `).all(from_date, to_date);

    const totalAmount = db.prepare(`
      SELECT SUM(amount) as total FROM expenses 
      WHERE expense_date BETWEEN ? AND ?
    `).get(from_date, to_date) as { total: number } | undefined;

    res.json({
      success: true,
      data: expenses,
      summary: {
        total_expenses: expenses.length,
        total_amount: parseFloat(totalAmount?.total?.toString() || '0')
      }
    });
  } catch (error) {
    console.error('Error fetching expenses by date range:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expenses by date range'
    });
  }
}

function getExpensesByCategory(req: Request, res: Response): void {
  try {
    const { category } = req.params;
    const { from_date, to_date } = req.query;

    let query = `
      SELECT 
        e.id,
        e.expense_no,
        e.expense_category,
        e.description,
        e.amount,
        e.expense_date,
        e.payment_method,
        e.reference_no,
        e.vendor_name,
        e.project,
        e.status,
        e.created_at,
        u.full_name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.expense_category = ?
    `;

    const params: (string | number)[] = [category];

    if (from_date && to_date) {
      query += ' AND e.expense_date BETWEEN ? AND ?';
      params.push(from_date as string, to_date as string);
    }

    query += ' ORDER BY e.expense_date DESC';

    const expenses = db.prepare(query).all(...params);

    let totalQuery = 'SELECT SUM(amount) as total FROM expenses WHERE expense_category = ?';
    const totalParams: (string | number)[] = [category];

    if (from_date && to_date) {
      totalQuery += ' AND expense_date BETWEEN ? AND ?';
      totalParams.push(from_date as string, to_date as string);
    }

    const totalAmount = db.prepare(totalQuery).get(...totalParams) as { total: number } | undefined;

    res.json({
      success: true,
      data: expenses,
      summary: {
        category,
        total_expenses: expenses.length,
        total_amount: parseFloat(totalAmount?.total?.toString() || '0')
      }
    });
  } catch (error) {
    console.error('Error fetching expenses by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expenses by category'
    });
  }
}

function getExpenseSummary(req: Request, res: Response): void {
  try {
    const { from_date, to_date } = req.query;

    let query = `
      SELECT 
        expense_category,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM expenses
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (from_date && to_date) {
      query += ' AND expense_date BETWEEN ? AND ?';
      params.push(from_date as string, to_date as string);
    }

    query += ' GROUP BY expense_category ORDER BY total_amount DESC';

    const categorySummary = db.prepare(query).all(...params);

    let overallQuery = 'SELECT COUNT(*) as total_expenses, SUM(amount) as total_amount FROM expenses WHERE 1=1';
    const overallParams: (string | number)[] = [];

    if (from_date && to_date) {
      overallQuery += ' AND expense_date BETWEEN ? AND ?';
      overallParams.push(from_date as string, to_date as string);
    }

    const overallSummary = db.prepare(overallQuery).get(...overallParams) as any;

    res.json({
      success: true,
      data: {
        category_summary: categorySummary,
        overall_summary: {
          total_expenses: overallSummary.total_expenses,
          total_amount: parseFloat(overallSummary.total_amount || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expense summary'
    });
  }
}

function getExpenseCategories(req: Request, res: Response): void {
  try {
    const categories = db.prepare(`
      SELECT 
        id,
        category_name,
        description,
        is_active,
        created_at,
        updated_at
      FROM expense_categories
      ORDER BY category_name
    `).all();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expense categories'
    });
  }
}

function createExpenseCategory(req: AuthRequest, res: Response): void {
  try {
    const { category_name, description } = req.body;

    if (!category_name) {
      res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
      return;
    }

    const existingCategory = db.prepare('SELECT id FROM expense_categories WHERE category_name = ?').get(category_name);
    if (existingCategory) {
      res.status(400).json({
        success: false,
        error: 'Expense category already exists'
      });
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO expense_categories (category_name, description)
      VALUES (?, ?)
    `);

    const result = stmt.run(category_name, description || '');

    // Log expense category creation using activity logger
    logCRUD(ActionType.EXPENSE_CATEGORY_CREATE, 'ExpenseCategory', result.lastInsertRowid as number, `Created expense category: ${category_name}`, req.user!.id);

    res.status(201).json({
      success: true,
      message: 'Expense category created successfully',
      data: {
        id: result.lastInsertRowid,
        category_name,
        description: description || '',
        is_active: 1
      }
    });
  } catch (error) {
    console.error('Error creating expense category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create expense category'
    });
  }
}

function updateExpenseCategory(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const { category_name, description, is_active } = req.body;

    const existingCategory = db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(id) as any;
    if (!existingCategory) {
      res.status(404).json({
        success: false,
        error: 'Expense category not found'
      });
      return;
    }

    if (category_name && category_name !== existingCategory.category_name) {
      const duplicateCategory = db.prepare('SELECT id FROM expense_categories WHERE category_name = ? AND id != ?').get(category_name, id);
      if (duplicateCategory) {
        res.status(400).json({
          success: false,
          error: 'Expense category name already exists'
        });
        return;
      }
    }

    const stmt = db.prepare(`
      UPDATE expense_categories SET
        category_name = COALESCE(?, category_name),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      category_name,
      description,
      is_active,
      id
    );

    // Log expense category update using activity logger
    logCRUD(ActionType.EXPENSE_CATEGORY_UPDATE, 'ExpenseCategory', parseInt(id, 10), `Updated expense category: ${existingCategory.category_name}`, req.user!.id);

    const updatedCategory = db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Expense category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating expense category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update expense category'
    });
  }
}

function deleteExpenseCategory(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;

    const existingCategory = db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(id) as any;
    if (!existingCategory) {
      res.status(404).json({
        success: false,
        error: 'Expense category not found'
      });
      return;
    }

    const expensesUsingCategory = db.prepare('SELECT COUNT(*) as count FROM expenses WHERE expense_category = ?').get(existingCategory.category_name) as { count: number };
    if (expensesUsingCategory.count > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete expense category. It is being used by existing expenses.'
      });
      return;
    }

    db.prepare('DELETE FROM expense_categories WHERE id = ?').run(id);

    // Log expense category deletion using activity logger
    logCRUD(ActionType.EXPENSE_CATEGORY_DELETE, 'ExpenseCategory', parseInt(id, 10), `Deleted expense category: ${existingCategory.category_name}`, req.user!.id);

    res.json({
      success: true,
      message: 'Expense category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete expense category'
    });
  }
}

function getExpenseStatusOptions(req: Request, res: Response): void {
  try {
    const statusOptions = [
      { value: 'Draft', label: 'Draft' },
      { value: 'Submitted', label: 'Submitted' },
      { value: 'Approved', label: 'Approved' },
      { value: 'Paid', label: 'Paid' },
      { value: 'Cancelled', label: 'Cancelled' }
    ];

    res.json({
      success: true,
      data: statusOptions
    });
  } catch (error) {
    console.error('Error fetching expense status options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expense status options'
    });
  }
}

function getExpensePaymentMethodOptions(req: Request, res: Response): void {
  try {
    const paymentMethodOptions = [
      { value: 'Cash', label: 'Cash' },
      { value: 'Check', label: 'Check' },
      { value: 'Bank Transfer', label: 'Bank Transfer' },
      { value: 'Credit Card', label: 'Credit Card' },
      { value: 'Debit Card', label: 'Debit Card' },
      { value: 'Online Transfer', label: 'Online Transfer' },
      { value: 'Other', label: 'Other' }
    ];

    res.json({
      success: true,
      data: paymentMethodOptions
    });
  } catch (error) {
    console.error('Error fetching expense payment method options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expense payment method options'
    });
  }
}

export default {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpensesByDateRange,
  getExpensesByCategory,
  getExpenseSummary,
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  getExpenseStatusOptions,
  getExpensePaymentMethodOptions
};
