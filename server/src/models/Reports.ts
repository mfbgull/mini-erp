import Database from 'better-sqlite3';
import { SalesSummary } from '../types';

interface ReceivablesSummaryRow {
  total_invoices: number;
  total_outstanding: number;
  total_paid: number;
  unused_overdue_count: number;
  partial_unpaid_count: number;
  overdue_db_count: number;
  unpaid_amount: number;
  partially_paid_amount: number;
  overdue_amount: number;
}

function getARAgingReport(asOfDate: string, db: Database.Database) {
  const agingData = db.prepare(`
    SELECT c.customer_name, c.customer_code, SUM(i.balance_amount) as total_outstanding,
      SUM(CASE WHEN julianday(?) - julianday(i.due_date) <= 0 THEN i.balance_amount ELSE 0 END) as current_amount,
      SUM(CASE WHEN julianday(?) - julianday(i.due_date) > 0 AND julianday(?) - julianday(i.due_date) <= 30 THEN i.balance_amount ELSE 0 END) as days_1_30,
      SUM(CASE WHEN julianday(?) - julianday(i.due_date) > 30 AND julianday(?) - julianday(i.due_date) <= 60 THEN i.balance_amount ELSE 0 END) as days_31_60,
      SUM(CASE WHEN julianday(?) - julianday(i.due_date) > 60 AND julianday(?) - julianday(i.due_date) <= 90 THEN i.balance_amount ELSE 0 END) as days_61_90,
      SUM(CASE WHEN julianday(?) - julianday(i.due_date) > 90 THEN i.balance_amount ELSE 0 END) as days_over_90
    FROM invoices i JOIN customers c ON i.customer_id = c.id
    WHERE i.status IN ('Unpaid', 'Partially Paid', 'Overdue') AND i.balance_amount > 0
    GROUP BY i.customer_id, c.customer_name, c.customer_code ORDER BY total_outstanding DESC
  `).all(asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate);

  const summary = db.prepare(`
    SELECT SUM(balance_amount) as totalReceivables,
      SUM(CASE WHEN julianday(?) - julianday(due_date) <= 0 THEN balance_amount ELSE 0 END) as current_amount,
      SUM(CASE WHEN julianday(?) - julianday(due_date) > 0 AND julianday(?) - julianday(due_date) <= 30 THEN balance_amount ELSE 0 END) as total_1_30,
      SUM(CASE WHEN julianday(?) - julianday(due_date) > 30 AND julianday(?) - julianday(due_date) <= 60 THEN balance_amount ELSE 0 END) as total_31_60,
      SUM(CASE WHEN julianday(?) - julianday(due_date) > 60 AND julianday(?) - julianday(due_date) <= 90 THEN balance_amount ELSE 0 END) as total_61_90,
      SUM(CASE WHEN julianday(?) - julianday(due_date) > 90 THEN balance_amount ELSE 0 END) as total_over_90
    FROM invoices WHERE status IN ('Unpaid', 'Partially Paid', 'Overdue') AND balance_amount > 0
  `).get(asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate);

  return { asOfDate, agingBuckets: agingData, summary };
}

// Moved from reportsController
function getCustomerStatements(db: Database.Database, customerId: number) {
  return db.prepare(`
    SELECT i.invoice_no, i.invoice_date, i.due_date, i.total_amount, i.paid_amount, i.balance_amount, i.status
    FROM invoices i WHERE i.customer_id = ? AND i.balance_amount > 0 ORDER BY i.invoice_date DESC
  `).all(customerId);
}

// Moved from reportsController
function getTopDebtors(db: Database.Database, limit: number = 10) {
  return db.prepare(`
    SELECT c.customer_name, c.customer_code, SUM(i.balance_amount) as total_outstanding, COUNT(i.id) as invoice_count
    FROM invoices i JOIN customers c ON i.customer_id = c.id
    WHERE i.status IN ('Unpaid', 'Partially Paid', 'Overdue') AND i.balance_amount > 0
    GROUP BY i.customer_id ORDER BY total_outstanding DESC LIMIT ?
  `).all(limit);
}

// Moved from reportsController
function getDSOMetric(db: Database.Database, period: number = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const avgReceivables = db.prepare(`
    SELECT AVG(balance_amount) as avg_balance FROM invoices WHERE status IN ('Unpaid', 'Partially Paid', 'Overdue') AND invoice_date BETWEEN ? AND ?
  `).get(startDateStr, endDateStr) as { avg_balance: number };

  const totalCreditSales = db.prepare(`SELECT SUM(total_amount) as total FROM invoices WHERE invoice_date BETWEEN ? AND ?`).get(startDateStr, endDateStr) as { total: number };
  const days = period;
  const dso = totalCreditSales.total > 0 ? (avgReceivables.avg_balance / totalCreditSales.total) * days : 0;

  return { dso, avgReceivables: avgReceivables.avg_balance, totalCreditSales: totalCreditSales.total, period: { startDate: startDateStr, endDate: endDateStr } };
}

// Moved from reportsController
function getReceivablesSummary(db: Database.Database, asOfDate: string = new Date().toISOString().split('T')[0]) {
  const result = db.prepare(`
    SELECT
      COUNT(*) as total_invoices,
      SUM(balance_amount) as total_outstanding,
      SUM(paid_amount) as total_paid,
      COUNT(CASE WHEN status = 'Unpaid' THEN 1 END) as unused_overdue_count,
      COUNT(CASE WHEN status = 'Partially Paid' THEN 1 END) as partial_unpaid_count,
      COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as overdue_db_count,
      SUM(CASE WHEN status = 'Unpaid' THEN balance_amount ELSE 0 END) as unpaid_amount,
      SUM(CASE WHEN status = 'Partially Paid' THEN balance_amount ELSE 0 END) as partially_paid_amount,
      SUM(CASE WHEN status = 'Overdue' THEN balance_amount ELSE 0 END) as overdue_amount
    FROM invoices WHERE status IN ('Unpaid', 'Partially Paid', 'Overdue') AND balance_amount > 0
  `).get() as ReceivablesSummaryRow;

  return {
    total_invoices: result.total_invoices,
    total_outstanding: result.total_outstanding,
    total_paid: result.total_paid,
    unpaid_count: result.unused_overdue_count,
    partial_count: result.partial_unpaid_count,
    overdue_count: result.overdue_db_count,
    overdue_amount: result.overdue_amount,
    total_current: result.unpaid_amount,
    total_1_30: result.partially_paid_amount,
    total_31_60: 0,
    total_61_90: 0,
    total_over_90: result.overdue_amount,
    statusBreakdown: {
      unpaid: { count: result.unused_overdue_count, amount: result.unpaid_amount },
      partiallyPaid: { count: result.partial_unpaid_count, amount: result.partially_paid_amount },
      overdue: { count: result.overdue_db_count, amount: result.overdue_amount },
    },
  };
}

function getSalesSummary(db: Database.Database, startDate: string, endDate: string) {
  const summary = db.prepare(`
    SELECT COUNT(DISTINCT i.id) as total_invoices, COALESCE(SUM(i.total_amount), 0) as total_revenue,
      COUNT(DISTINCT i.customer_id) as unique_customers, COUNT(DISTINCT ii.item_id) as unique_items,
      AVG(i.total_amount) as avg_invoice_value
    FROM invoices i LEFT JOIN invoice_items ii ON i.id = ii.invoice_id WHERE i.invoice_date BETWEEN ? AND ?
  `).get(startDate, endDate) as SalesSummary;

  const dailySales = db.prepare(`SELECT invoice_date, COUNT(*) as count, SUM(total_amount) as total FROM invoices WHERE invoice_date BETWEEN ? AND ? GROUP BY invoice_date ORDER BY invoice_date`).all(startDate, endDate);

  return { period: { startDate, endDate }, summary, dailySales };
}

// Moved from reportsController
function getSalesByCustomer(db: Database.Database, startDate: string, endDate: string) {
  return db.prepare(`
    SELECT c.customer_name, c.customer_code, COUNT(i.id) as invoice_count,
      SUM(i.total_amount) as total_sales, AVG(i.total_amount) as avg_sale
    FROM invoices i JOIN customers c ON i.customer_id = c.id WHERE i.invoice_date BETWEEN ? AND ?
    GROUP BY i.customer_id ORDER BY total_sales DESC
  `).all(startDate, endDate);
}

// Moved from reportsController
function getSalesByItem(db: Database.Database, startDate: string, endDate: string) {
  return db.prepare(`
    SELECT it.item_code, it.item_name, SUM(ii.quantity) as total_qty, SUM(ii.amount) as total_revenue, AVG(ii.unit_price) as avg_price
    FROM invoice_items ii JOIN items it ON ii.item_id = it.id JOIN invoices i ON ii.invoice_id = i.id
    WHERE i.invoice_date BETWEEN ? AND ? GROUP BY ii.item_id ORDER BY total_revenue DESC
  `).all(startDate, endDate);
}

// Moved from reportsController
function getStockValuationReport(db: Database.Database) {
  const valuation = db.prepare(`
    SELECT i.id, i.item_code, i.item_name, i.category, i.unit_of_measure, i.standard_cost,
      COALESCE(SUM(sb.quantity), 0) as total_stock, COALESCE(SUM(sb.quantity), 0) * i.standard_cost as total_value
    FROM items i LEFT JOIN stock_balances sb ON i.id = sb.item_id WHERE i.is_active = 1
    GROUP BY i.id ORDER BY total_value DESC
  `).all();

  const totalValue = db.prepare(`SELECT COALESCE(SUM(current_stock * standard_cost), 0) as total FROM items WHERE is_active = 1`).get() as { total: number };

  return { valuation, totalValue: totalValue.total };
}

// Moved from reportsController
function getInventoryMovementReport(db: Database.Database, startDate?: string, endDate?: string, itemId?: number) {
  let query = `
    SELECT sm.movement_no, sm.movement_type, sm.quantity, sm.unit_cost, sm.movement_date,
      sm.reference_doctype, sm.reference_docno, sm.remarks,
      i.item_code, i.item_name, w.warehouse_name
    FROM stock_movements sm JOIN items i ON sm.item_id = i.id JOIN warehouses w ON sm.warehouse_id = w.id WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (startDate) { query += ' AND sm.movement_date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND sm.movement_date <= ?'; params.push(endDate); }
  if (itemId !== undefined && itemId !== null) { query += ' AND sm.item_id = ?'; params.push(itemId); }
  query += ' ORDER BY sm.movement_date DESC LIMIT 500';

  return db.prepare(query).all(...params);
}

// Moved from reportsController
function getSupplierAnalysis(db: Database.Database, startDate: string, endDate: string) {
  return db.prepare(`
    SELECT s.supplier_name, COUNT(po.id) as total_orders, SUM(po.total_cost) as total_value,
      AVG(po.total_cost) as avg_order_value,
      COUNT(CASE WHEN po.status = 'Received' THEN 1 END) as completed_orders
    FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.id WHERE po.order_date BETWEEN ? AND ?
    GROUP BY po.supplier_id ORDER BY total_value DESC
  `).all(startDate, endDate);
}

// Moved from reportsController
function getBatchTraceability(db: Database.Database, itemId: number) {
  const item = db.prepare('SELECT id, item_code, item_name, unit_of_measure FROM items WHERE id = ?').get(itemId);
  if (!item) return null;

  const currentStock = db.prepare('SELECT warehouse_id, quantity FROM stock_balances WHERE item_id = ? AND quantity > 0').all(itemId);
  const movements = db.prepare(`
    SELECT sm.movement_no, sm.movement_type, sm.quantity, sm.movement_date, sm.reference_doctype, sm.reference_docno, sm.remarks, w.warehouse_name
    FROM stock_movements sm JOIN warehouses w ON sm.warehouse_id = w.id WHERE sm.item_id = ? ORDER BY sm.movement_date DESC LIMIT 50
  `).all(itemId);

  return {
    item,
    currentStock,
    movements,
    summary: { warehousesWithStock: currentStock.length, recentMovements: movements.length }
  };
}

function getAPSummary(asOfDate: string, db: Database.Database) {
  const summary = db.prepare(`
    SELECT s.supplier_name, SUM(po.total_cost - COALESCE(p.paid_amount, 0)) as outstanding
    FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN (SELECT purchase_order_id, SUM(amount) as paid_amount FROM payments GROUP BY purchase_order_id) p ON po.id = p.purchase_order_id
    WHERE po.status IN ('Approved', 'Received') GROUP BY s.supplier_name ORDER BY outstanding DESC
  `).all();

  const totalOutstanding = db.prepare(`
    SELECT SUM(total_cost - COALESCE(p.paid_amount, 0)) as total
    FROM purchase_orders LEFT JOIN (SELECT purchase_order_id, SUM(amount) as paid_amount FROM payments GROUP BY purchase_order_id) p ON id = p.purchase_order_id
    WHERE status IN ('Approved', 'Received')
  `).get() as { total: number };

  return { asOfDate, supplierSummary: summary, totalOutstanding: totalOutstanding?.total || 0 };
}

function getProfitLossReport(startDate: string, endDate: string, db: Database.Database) {
  const revenue = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE invoice_date BETWEEN ? AND ?
  `).get(startDate, endDate) as { total: number };

  const cogs = db.prepare(`
    SELECT COALESCE(SUM(sm.quantity * sm.unit_cost), 0) as total FROM stock_movements sm
    WHERE sm.movement_type = 'SALE' AND sm.movement_date BETWEEN ? AND ?
  `).get(startDate, endDate) as { total: number };

  const expenses = db.prepare(`SELECT expense_category, SUM(amount) as total FROM expenses WHERE expense_date BETWEEN ? AND ? GROUP BY expense_category ORDER BY total DESC`).all(startDate, endDate) as Array<{ expense_category: string; total: number }>;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0);
  const grossProfit = revenue.total - cogs.total;
  const netProfit = grossProfit - totalExpenses;

  return { startDate, endDate, revenue: revenue.total, cogs: cogs.total, grossProfit, expenses, totalExpenses, netProfit };
}

function getBalanceSheet(asOfDate: string, db: Database.Database) {
  const assets = db.prepare(`
    SELECT COALESCE(SUM(current_stock * standard_cost), 0) as inventory_value FROM items WHERE is_active = 1
  `).get() as { inventory_value: number };

  const ar = db.prepare(`
    SELECT COALESCE(SUM(balance_amount), 0) as total FROM invoices WHERE status IN ('Unpaid', 'Partially Paid', 'Overdue')
  `).get() as { total: number };

  const ap = db.prepare(`
    SELECT COALESCE(SUM(total_cost), 0) as total FROM purchase_orders WHERE status IN ('Approved', 'Received')
  `).get() as { total: number };

  const cash = db.prepare(`
    SELECT COALESCE(SUM(credit - debit), 0) as balance FROM customer_ledger WHERE transaction_type = 'PAYMENT'
  `).get() as { balance: number };

  return { asOfDate, assets: { inventory: assets.inventory_value, accounts_receivable: ar.total, cash: cash.balance }, liabilities: { accounts_payable: ap.total } };
}

function getIncomeStatement(startDate: string, endDate: string, db: Database.Database) {
  const revenue = db.prepare(`SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE invoice_date BETWEEN ? AND ?`).get(startDate, endDate) as { total: number };
  const expenses = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date BETWEEN ? AND ?`).get(startDate, endDate) as { total: number };
  return { startDate, endDate, revenue: revenue.total, expenses: expenses.total, netIncome: revenue.total - expenses.total };
}

function getTrialBalance(asOfDate: string, db: Database.Database) {
  return db.prepare(`
    SELECT account_name, SUM(debit) as total_debit, SUM(credit) as total_credit
    FROM customer_ledger WHERE transaction_date <= ? GROUP BY account_name
  `).all(asOfDate);
}

function getGeneralLedger(startDate: string, endDate: string, db: Database.Database) {
  return db.prepare(`
    SELECT * FROM customer_ledger WHERE transaction_date BETWEEN ? AND ? ORDER BY transaction_date, id
  `).all(startDate, endDate);
}

function getCashFlow(startDate: string, endDate: string, db: Database.Database) {
  const inflows = db.prepare(`SELECT COALESCE(SUM(credit), 0) as total FROM customer_ledger WHERE transaction_type = 'PAYMENT' AND transaction_date BETWEEN ? AND ?`).get(startDate, endDate) as { total: number };
  const outflows = db.prepare(`SELECT COALESCE(SUM(debit), 0) as total FROM customer_ledger WHERE transaction_type = 'EXPENSE' AND transaction_date BETWEEN ? AND ?`).get(startDate, endDate) as { total: number };
  return { startDate, endDate, inflows: inflows.total, outflows: outflows.total, netCashFlow: inflows.total - outflows.total };
}

function getTaxSummary(startDate: string, endDate: string, db: Database.Database) {
  return db.prepare(`
    SELECT SUM(amount * tax_rate / 100) as total_tax FROM invoice_items ii JOIN invoices i ON ii.invoice_id = i.id WHERE i.invoice_date BETWEEN ? AND ?
  `).get(startDate, endDate) as { total_tax: number };
}

function getDailySales(startDate: string, endDate: string, db: Database.Database) {
  return db.prepare(`
    SELECT invoice_date, COUNT(*) as count, SUM(total_amount) as total FROM invoices WHERE invoice_date BETWEEN ? AND ? GROUP BY invoice_date ORDER BY invoice_date
  `).all(startDate, endDate);
}

function getMonthlySales(year: string, db: Database.Database) {
  return db.prepare(`
    SELECT strftime('%m', invoice_date) as month, COUNT(*) as count, SUM(total_amount) as total FROM invoices WHERE strftime('%Y', invoice_date) = ? GROUP BY month ORDER BY month
  `).all(year);
}

function getGrossProfit(startDate: string, endDate: string, db: Database.Database) {
  const revenue = db.prepare(`SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE invoice_date BETWEEN ? AND ?`).get(startDate, endDate) as { total: number };
  const cogs = db.prepare(`SELECT COALESCE(SUM(sm.quantity * sm.unit_cost), 0) as total FROM stock_movements sm WHERE sm.movement_type = 'SALE' AND sm.movement_date BETWEEN ? AND ?`).get(startDate, endDate) as { total: number };
  return { startDate, endDate, revenue: revenue.total, cogs: cogs.total, grossProfit: revenue.total - cogs.total, margin: revenue.total > 0 ? ((revenue.total - cogs.total) / revenue.total * 100) : 0 };
}

function getStockLevelReport(db: Database.Database) {
  return db.prepare(`
    SELECT i.id, i.item_code, i.item_name, i.category, i.unit_of_measure,
           COALESCE(SUM(sb.quantity), 0) as total_stock, i.reorder_level, i.standard_cost
    FROM items i LEFT JOIN stock_balances sb ON i.id = sb.item_id WHERE i.is_active = 1
    GROUP BY i.id ORDER BY i.item_name
  `).all();
}

function getLowStockReport(db: Database.Database) {
  return db.prepare(`
    SELECT i.id, i.item_code, i.item_name, i.category,
           COALESCE(SUM(sb.quantity), 0) as current_stock, i.reorder_level,
           i.standard_cost
    FROM items i LEFT JOIN stock_balances sb ON i.item_id = sb.item_id
    WHERE i.is_active = 1 AND i.reorder_level > 0
    GROUP BY i.id
    HAVING COALESCE(SUM(sb.quantity), 0) <= i.reorder_level
    ORDER BY (COALESCE(SUM(sb.quantity), 0) * 1.0 / i.reorder_level) ASC
  `).all();
}

function getPurchaseSummary(startDate: string, endDate: string, db: Database.Database) {
  return db.prepare(`
    SELECT s.supplier_name, COUNT(po.id) as count, SUM(po.total_cost) as total
    FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.order_date BETWEEN ? AND ? GROUP BY s.supplier_name ORDER BY total DESC
  `).all(startDate, endDate);
}

function getProductionEfficiency(startDate: string, endDate: string, db: Database.Database) {
  return db.prepare(`
    SELECT p.id, p.production_no, p.item_id, i.item_name, p.planned_quantity, p.actual_quantity,
           p.start_date, p.end_date,
           CASE WHEN p.planned_quantity > 0 THEN (p.actual_quantity * 100.0 / p.planned_quantity) ELSE 0 END as efficiency
    FROM productions p JOIN items i ON p.item_id = i.id WHERE p.start_date BETWEEN ? AND ? ORDER BY p.start_date DESC
  `).all(startDate, endDate);
}

function getBOMUsage(bomId: number, db: Database.Database) {
  return db.prepare(`
    SELECT bi.*, i.item_name, i.item_code, i.unit_of_measure
    FROM bom_items bi JOIN items i ON bi.item_id = i.id WHERE bi.bom_id = ? ORDER BY bi.item_id
  `).all(bomId);
}

function getCustomerOutstanding(asOfDate: string, db: Database.Database) {
  return db.prepare(`
    SELECT c.customer_name, c.customer_code, SUM(i.balance_amount) as outstanding
    FROM invoices i JOIN customers c ON i.customer_id = c.id
    WHERE i.status IN ('Unpaid', 'Partially Paid', 'Overdue') AND i.balance_amount > 0
    GROUP BY c.id ORDER BY outstanding DESC
  `).all();
}

function getSupplierOutstanding(asOfDate: string, db: Database.Database) {
  return db.prepare(`
    SELECT s.supplier_name, s.supplier_code, SUM(po.total_cost) as outstanding
    FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.status IN ('Approved', 'Received') GROUP BY s.id ORDER BY outstanding DESC
  `).all();
}

function getExpenseReport(startDate: string, endDate: string, category?: string, db?: Database.Database) {
  let query = 'SELECT expense_category, COUNT(*) as count, SUM(amount) as total FROM expenses WHERE expense_date BETWEEN ? AND ?';
  const params: (string | number)[] = [startDate, endDate];
  if (category) { query += ' AND expense_category = ?'; params.push(category); }
  query += ' GROUP BY expense_category ORDER BY total DESC';
  return db!.prepare(query).all(...params);
}

export default {
  getARAgingReport, getCustomerStatements, getTopDebtors, getDSOMetric,
  getReceivablesSummary, getSalesSummary, getSalesByCustomer, getSalesByItem,
  getStockValuationReport, getInventoryMovementReport, getSupplierAnalysis,
  getAPSummary, getProfitLossReport, getBalanceSheet, getIncomeStatement,
  getTrialBalance, getGeneralLedger, getCashFlow, getTaxSummary, getDailySales, getMonthlySales,
  getGrossProfit, getStockLevelReport, getLowStockReport, getBatchTraceability,
  getPurchaseSummary, getProductionEfficiency, getBOMUsage, getCustomerOutstanding,
  getSupplierOutstanding, getExpenseReport,
};
