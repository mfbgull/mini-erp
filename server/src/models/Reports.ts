import Database from 'better-sqlite3';

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
  const rows = db.prepare(`
    SELECT i.invoice_no, i.invoice_date, i.due_date, i.total_amount, i.paid_amount, i.balance_amount, i.status
    FROM invoices i WHERE i.customer_id = ? AND i.balance_amount > 0 ORDER BY i.invoice_date DESC
  `).all(customerId);
  return { statements: rows };
}

// Moved from reportsController
function getTopDebtors(db: Database.Database, limit: number = 10) {
  const rows = db.prepare(`
    SELECT c.customer_name, c.customer_code, SUM(i.balance_amount) as total_outstanding,
      SUM(i.balance_amount) as outstanding_balance,
      SUM(i.total_amount) as total_invoiced,
      COUNT(i.id) as invoice_count
    FROM invoices i JOIN customers c ON i.customer_id = c.id
    WHERE i.status IN ('Unpaid', 'Partially Paid', 'Overdue') AND i.balance_amount > 0
    GROUP BY i.customer_id ORDER BY total_outstanding DESC LIMIT ?
  `).all(limit);
  return rows;
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
  const totalSales = totalCreditSales.total;
  const totalAR = avgReceivables.avg_balance;
  const avgInvoiceValue = totalCreditSales.total > 0 ? totalCreditSales.total / (db.prepare(`SELECT COUNT(*) as count FROM invoices WHERE invoice_date BETWEEN ? AND ?`).get(startDateStr, endDateStr) as { count: number }).count : 0;

  return { dso, avgReceivables: avgReceivables.avg_balance, totalCreditSales: totalCreditSales.total, totalSales, totalAR, avgInvoiceValue, period: { startDate: startDateStr, endDate: endDateStr } };
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
  const detail = db.prepare(`
    SELECT i.invoice_date, i.invoice_no, c.customer_name,
           i.total_amount, i.paid_amount, i.balance_amount, i.status,
           COALESCE(SUM(ii.quantity), 0) as total_items
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
    WHERE i.invoice_date BETWEEN ? AND ?
    GROUP BY i.id
    ORDER BY i.invoice_date DESC
  `).all(startDate, endDate);

  const sales = detail.map((row: any) => ({
    invoice_date: row.invoice_date,
    invoice_no: row.invoice_no,
    customer_name: row.customer_name,
    total_sales: row.total_amount,
    total_items: row.total_items,
    paid_amount: row.paid_amount,
    balance_amount: row.balance_amount,
    status: row.status
  }));

  const totalInvoices = sales.length;
  const totalSales = sales.reduce((s, r) => s + (r.total_sales || 0), 0);
  const totalItemsSold = sales.reduce((s, r) => s + (r.total_items || 0), 0);
  const totalPaid = sales.reduce((s, r) => s + (r.paid_amount || 0), 0);
  const totalBalance = sales.reduce((s, r) => s + (r.balance_amount || 0), 0);
  const averageInvoiceValue = totalInvoices > 0 ? totalSales / totalInvoices : 0;

  const summary = { totalInvoices, totalSales, totalItemsSold, averageInvoiceValue, totalPaid, totalBalance };

  return { period: { startDate, endDate }, summary, sales };
}

// Moved from reportsController
function getSalesByCustomer(db: Database.Database, startDate: string, endDate: string) {
  return db.prepare(`
    SELECT c.customer_name, c.customer_code, c.email, c.phone,
      COUNT(DISTINCT i.id) as total_invoices,
      SUM(i.total_amount) as total_sales,
      AVG(i.total_amount) as average_order_value,
      COALESCE(SUM(ii.quantity), 0) as total_items,
      MAX(i.invoice_date) as last_purchase_date
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
    WHERE i.invoice_date BETWEEN ? AND ?
    GROUP BY i.customer_id ORDER BY total_sales DESC
  `).all(startDate, endDate);
}

// Moved from reportsController
function getSalesByItem(db: Database.Database, startDate: string, endDate: string) {
  return db.prepare(`
    SELECT it.item_code, it.item_name, it.category as item_category,
      SUM(ii.quantity) as total_quantity_sold,
      SUM(ii.amount) as total_sales,
      AVG(ii.unit_price) as avg_selling_price
    FROM invoice_items ii JOIN items it ON ii.item_id = it.id JOIN invoices i ON ii.invoice_id = i.id
    WHERE i.invoice_date BETWEEN ? AND ? GROUP BY ii.item_id ORDER BY total_sales DESC
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

  const reportData = { valuation, totalValue: totalValue.total };

  return {
    stockValuation: reportData.valuation,
    summary: {
      totalValue: reportData.totalValue,
      totalItems: reportData.valuation.length
    }
  };
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

  const rows = db.prepare(query).all(...params);

  const totalInbound = rows.filter((r: any) => r.movement_type?.toLowerCase() === 'in').length;
  const totalOutbound = rows.filter((r: any) => r.movement_type?.toLowerCase() === 'out').length;

  return {
    movements: rows,
    summary: {
      totalInbound,
      totalOutbound,
      netMovement: totalInbound - totalOutbound
    }
  };
}

// Moved from reportsController
function getSupplierAnalysis(db: Database.Database, startDate: string, endDate: string) {
  const rows = db.prepare(`
    SELECT s.supplier_name, s.supplier_code, s.email, s.phone,
      COUNT(po.id) as total_orders, SUM(po.total_amount) as total_purchase_value,
      AVG(po.total_amount) as average_order_value,
      MAX(po.po_date) as last_purchase_date,
      COUNT(poi.id) as total_items
    FROM purchase_orders po 
    JOIN suppliers s ON po.supplier_id = s.id 
    LEFT JOIN purchase_order_items poi ON poi.po_id = po.id
    WHERE po.po_date BETWEEN ? AND ?
    GROUP BY po.supplier_id ORDER BY total_purchase_value DESC
  `).all(startDate, endDate);
  return rows.map((r: any) => ({
    ...r,
    total_purchase_value: r.total_purchase_value || 0,
    average_order_value: r.average_order_value || 0,
    on_time_delivery_rate: 100,
    total_items: r.total_items || 0
  }));
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
    SELECT COALESCE(ABS(SUM(sm.quantity * sm.unit_cost)), 0) as total FROM stock_movements sm
    WHERE sm.movement_type = 'SALE' AND sm.movement_date BETWEEN ? AND ?
  `).get(startDate, endDate) as { total: number };

  const expenses = db.prepare(`SELECT expense_category, SUM(amount) as total FROM expenses WHERE expense_date BETWEEN ? AND ? GROUP BY expense_category ORDER BY total DESC`).all(startDate, endDate) as Array<{ expense_category: string; total: number }>;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0);
  const grossProfit = revenue.total - cogs.total;
  const netProfit = grossProfit - totalExpenses;
  const grossProfitMargin = revenue.total > 0 ? (grossProfit / revenue.total) * 100 : 0;
  const netProfitMargin = revenue.total > 0 ? (netProfit / revenue.total) * 100 : 0;

  return { startDate, endDate, totalRevenue: revenue.total, totalCogs: cogs.total, grossProfit, expenses, totalExpenses, netProfit, grossProfitMargin, netProfitMargin };
}

function getBalanceSheet(asOfDate: string, db: Database.Database) {
  const assets = db.prepare(`
    SELECT COALESCE(SUM(ABS(current_stock) * standard_cost), 0) as inventory_value FROM items WHERE is_active = 1
  `).get() as { inventory_value: number };

  const ar = db.prepare(`
    SELECT COALESCE(SUM(balance_amount), 0) as total FROM invoices WHERE status IN ('Unpaid', 'Partially Paid', 'Overdue')
  `).get() as { total: number };

  const ap = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_orders WHERE status = 'Completed'
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
  // customer_ledger doesn't have an account_name column, so group by transaction_type as proxy accounts
  return db.prepare(`
    SELECT transaction_type as account_name, SUM(debit) as total_debit, SUM(credit) as total_credit
    FROM customer_ledger WHERE transaction_date <= ? GROUP BY transaction_type ORDER BY account_name
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
  return { startDate, endDate, totalInflow: inflows.total, totalOutflow: outflows.total, netCashFlow: inflows.total - outflows.total };
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
  const rows = db.prepare(`
    SELECT i.id, i.item_code, i.item_name, i.category, i.unit_of_measure,
           COALESCE(SUM(sb.quantity), 0) as total_stock, i.reorder_level, i.standard_cost
    FROM items i LEFT JOIN stock_balances sb ON i.id = sb.item_id WHERE i.is_active = 1
    GROUP BY i.id ORDER BY i.item_name
  `).all() as Array<{ id: number; item_code: string; item_name: string; category: string | null; unit_of_measure: string; total_stock: number; reorder_level: number; standard_cost: number }>;

  const stockLevels = rows.map(row => {
    const currentStock = Math.max(0, row.total_stock);
    return {
      id: row.id,
      item_code: row.item_code,
      item_name: row.item_name,
      item_category: row.category || '',
      unit_of_measure: row.unit_of_measure,
      current_stock: currentStock,
      minimum_stock: row.reorder_level || 0,
      reorder_level: row.reorder_level || 0,
      standard_selling_price: row.standard_cost || 0,
      stock_status: currentStock === 0
        ? 'Out of Stock'
        : currentStock < (row.reorder_level || 0)
          ? 'Low Stock'
          : 'In Stock'
    };
  });

  const totalItems = stockLevels.length;
  const inStock = stockLevels.filter(s => s.stock_status === 'In Stock').length;
  const lowStock = stockLevels.filter(s => s.stock_status === 'Low Stock').length;
  const outOfStock = stockLevels.filter(s => s.stock_status === 'Out of Stock').length;

  return { stockLevels, summary: { totalItems, inStock, lowStock, outOfStock } };
}

function getLowStockReport(db: Database.Database) {
  const rows = db.prepare(`
    SELECT i.id, i.item_code, i.item_name, i.category, i.unit_of_measure,
           COALESCE(SUM(sb.quantity), 0) as current_stock, i.reorder_level,
           i.standard_selling_price
    FROM items i LEFT JOIN stock_balances sb ON i.id = sb.item_id
    WHERE i.reorder_level > 0
    GROUP BY i.id
    HAVING COALESCE(SUM(sb.quantity), 0) <= i.reorder_level
    ORDER BY (COALESCE(SUM(sb.quantity), 0) * 1.0 / i.reorder_level) ASC
  `).all() as Array<{ id: number; item_code: string; item_name: string; category: string | null; unit_of_measure: string; current_stock: number; reorder_level: number; standard_selling_price: number }>;

  return rows.map(row => ({
    id: row.id,
    item_code: row.item_code,
    item_name: row.item_name,
    item_category: row.category || '',
    unit_of_measure: row.unit_of_measure,
    current_stock: row.current_stock,
    minimum_stock: row.reorder_level,
    shortage: Math.max(row.reorder_level - row.current_stock, 0),
    reorder_level: row.reorder_level,
    standard_selling_price: row.standard_selling_price || 0,
    stock_status: row.current_stock === 0
      ? 'Out of Stock'
      : row.current_stock < row.reorder_level
        ? 'Low Stock'
        : 'In Stock'
  }));
}

function getPurchaseSummary(startDate: string, endDate: string, db: Database.Database) {
  const rows = db.prepare(`
    SELECT po.id as po_id, po.po_no as purchase_order_number, po.po_date as purchase_date,
      s.supplier_name, po.total_amount as total_cost, po.status,
      (SELECT COUNT(*) FROM purchase_order_items WHERE po_id = po.id) as total_items,
      (SELECT COALESCE(SUM(received_quantity * unit_price), 0) FROM purchase_order_items WHERE po_id = po.id) as received_amount,
      (po.total_amount - (SELECT COALESCE(SUM(received_quantity * unit_price), 0) FROM purchase_order_items WHERE po_id = po.id)) as balance_amount
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.po_date BETWEEN ? AND ?
    ORDER BY po.po_date DESC
  `).all(startDate, endDate) as Array<{
    po_id: number; purchase_order_number: string; purchase_date: string;
    supplier_name: string; total_cost: number; status: string;
    total_items: number; received_amount: number; balance_amount: number;
  }>;

  const totalOrders = rows.length;
  const totalCost = rows.reduce((s, r) => s + (r.total_cost || 0), 0);
  const totalPurchasedItems = rows.reduce((s, r) => s + (r.total_items || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalCost / totalOrders : 0;

  return {
    purchases: rows,
    summary: { totalOrders, totalCost, totalItems: totalPurchasedItems, averageOrderValue }
  };
}

function getProductionEfficiency(startDate: string, endDate: string, db: Database.Database) {
  const rows = db.prepare(`
    SELECT p.id, p.production_no, p.output_item_id, i.item_name as output_item_name,
      p.output_quantity, p.production_date, p.bom_id
    FROM productions p JOIN items i ON p.output_item_id = i.id
    WHERE p.production_date BETWEEN ? AND ? ORDER BY p.production_date DESC
  `).all(startDate, endDate) as Array<{
    id: number; production_no: string; output_item_id: number;
    output_item_name: string; output_quantity: number; production_date: string; bom_id: number | null;
  }>;

  const production = rows.map(r => ({
    production_date: r.production_date,
    production_order_number: r.production_no,
    output_item_name: r.output_item_name,
    output_quantity: r.output_quantity || 0,
    completed_quantity: r.output_quantity || 0,
    scrapped_quantity: 0,
    status: 'Completed',
    item_name: r.output_item_name,
    planned_quantity: r.output_quantity || 0,
    work_order_number: r.production_no
  }));

  const totalProductionOrders = production.length;
  const totalOutput = production.reduce((s, r) => s + (r.output_quantity || 0), 0);
  const totalCompleted = totalOutput;
  const totalScrapped = 0;

  return {
    production,
    summary: { totalProductionOrders, totalOutput, totalCompleted, totalScrapped }
  };
}

function getBOMUsage(bomId: number, db: Database.Database) {
  return db.prepare(`
    SELECT bi.*, i.item_name, i.item_code, i.unit_of_measure
    FROM bom_items bi JOIN items i ON bi.item_id = i.id WHERE bi.bom_id = ? ORDER BY bi.item_id
  `).all(bomId);
}

function getBOMUsageReport(startDate: string, endDate: string, itemId: number | null, db: Database.Database) {
  let query = `
    SELECT b.id as bom_id, b.bom_name, i.item_name as parent_item_name,
      (SELECT COUNT(*) FROM productions WHERE bom_id = b.id AND production_date BETWEEN ? AND ?) as usage_count,
      (SELECT MAX(production_date) FROM productions WHERE bom_id = b.id AND production_date BETWEEN ? AND ?) as last_used_date,
      (SELECT COUNT(*) FROM bom_items WHERE bom_id = b.id) as total_components,
      CASE WHEN b.is_active THEN 'Active' ELSE 'Inactive' END as status
    FROM boms b
    JOIN items i ON b.finished_item_id = i.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [startDate, endDate, startDate, endDate];
  if (itemId) {
    query += ' AND b.finished_item_id = ?';
    params.push(itemId);
  }
  query += ' ORDER BY usage_count DESC, b.bom_name';

  const rows = db.prepare(query).all(...params) as Array<{
    bom_id: number; bom_name: string; parent_item_name: string;
    usage_count: number; last_used_date: string | null;
    total_components: number; status: string;
  }>;

  return {
    usage: rows.map(r => ({
      bom_name: r.bom_name,
      parent_item_name: r.parent_item_name,
      usage_count: r.usage_count || 0,
      last_used_date: r.last_used_date,
      total_components: r.total_components || 0,
      status: r.status,
      bom_id: r.bom_id
    }))
  };
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
    SELECT s.supplier_name, s.supplier_code, SUM(po.total_amount) as outstanding
    FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.status IN ('Approved', 'Received') GROUP BY s.id ORDER BY outstanding DESC
  `).all();
}

function getExpenseReport(startDate: string, endDate: string, category?: string, db?: Database.Database) {
  const conditions: string[] = ['expense_date BETWEEN ? AND ?'];
  const params: (string | number)[] = [startDate, endDate];
  if (category) { conditions.push('expense_category = ?'); params.push(category); }

  const whereClause = conditions.join(' AND ');

  // Individual expense rows for the grid
  const expenses = db!.prepare(
    `SELECT id, expense_no, expense_category, description, amount, expense_date,
            payment_method, reference_no, vendor_name, project, status
      FROM expenses WHERE ${whereClause} ORDER BY expense_date DESC`
  ).all(...params) as Array<{ id: number; expense_no: string; expense_category: string; description: string | null; amount: number; expense_date: string; payment_method: string | null; reference_no: string | null; vendor_name: string | null; project: string | null; status: string }>;

  // Category breakdown
  const categoryBreakdown = db!.prepare(
    `SELECT expense_category, COUNT(*) as count, SUM(amount) as total_amount
     FROM expenses WHERE ${whereClause} GROUP BY expense_category ORDER BY total_amount DESC`
  ).all(...params);

  // Summary from the same result set
  const totalAmount = expenses.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalExpenses = expenses.length;
  const averageAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

  return { summary: { totalAmount, totalExpenses, averageAmount }, expenses, categoryBreakdown };
}

export default {
  getARAgingReport, getCustomerStatements, getTopDebtors, getDSOMetric,
  getReceivablesSummary, getSalesSummary, getSalesByCustomer, getSalesByItem,
  getStockValuationReport, getInventoryMovementReport, getSupplierAnalysis,
  getAPSummary, getProfitLossReport, getBalanceSheet, getIncomeStatement,
  getTrialBalance, getGeneralLedger, getCashFlow, getTaxSummary, getDailySales, getMonthlySales,
  getGrossProfit, getStockLevelReport, getLowStockReport, getBatchTraceability,
  getPurchaseSummary, getProductionEfficiency, getBOMUsage, getBOMUsageReport, getCustomerOutstanding,
  getSupplierOutstanding, getExpenseReport,
};
