import { Request, Response } from 'express';
import db from '../config/database';

function getARAgingReport(req: Request, res: Response): void {
  try {
    const { asOfDate = new Date().toISOString().split('T')[0] } = req.query;

    const query = `
      SELECT 
        c.customer_name,
        c.customer_code,
        SUM(i.balance_amount) as total_outstanding,
        SUM(
          CASE 
            WHEN julianday(?) - julianday(i.due_date) <= 0 THEN i.balance_amount
            ELSE 0
          END
        ) as current_amount,
        SUM(
          CASE 
            WHEN julianday(?) - julianday(i.due_date) > 0 AND julianday(?) - julianday(i.due_date) <= 30 THEN i.balance_amount
            ELSE 0
          END
        ) as days_1_30,
        SUM(
          CASE 
            WHEN julianday(?) - julianday(i.due_date) > 30 AND julianday(?) - julianday(i.due_date) <= 60 THEN i.balance_amount
            ELSE 0
          END
        ) as days_31_60,
        SUM(
          CASE 
            WHEN julianday(?) - julianday(i.due_date) > 60 AND julianday(?) - julianday(i.due_date) <= 90 THEN i.balance_amount
            ELSE 0
          END
        ) as days_61_90,
        SUM(
          CASE 
            WHEN julianday(?) - julianday(i.due_date) > 90 THEN i.balance_amount
            ELSE 0
          END
        ) as days_over_90
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.status IN ('Unpaid', 'Partially Paid', 'Overdue') AND i.balance_amount > 0
      GROUP BY i.customer_id, c.customer_name, c.customer_code
      ORDER BY total_outstanding DESC
    `;

    const agingData = db.prepare(query).all(
      asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate
    );

    const summaryQuery = `
      SELECT 
        SUM(balance_amount) as total_receivables,
        SUM(
          CASE 
            WHEN julianday(?) - julianday(due_date) <= 0 THEN balance_amount
            ELSE 0
          END
        ) as total_current,
        SUM(
          CASE 
            WHEN julianday(?) - julianday(due_date) > 0 AND julianday(?) - julianday(due_date) <= 30 THEN balance_amount
            ELSE 0
          END
        ) as total_1_30,
        SUM(
          CASE 
            WHEN julianday(?) - julianday(due_date) > 30 AND julianday(?) - julianday(due_date) <= 60 THEN balance_amount
            ELSE 0
          END
        ) as total_31_60,
        SUM(
          CASE 
            WHEN julianday(?) - julianday(due_date) > 60 AND julianday(?) - julianday(due_date) <= 90 THEN balance_amount
            ELSE 0
          END
        ) as total_61_90,
        SUM(
          CASE 
            WHEN julianday(?) - julianday(due_date) > 90 THEN balance_amount
            ELSE 0
          END
        ) as total_over_90
      FROM invoices
      WHERE status IN ('Unpaid', 'Partially Paid', 'Overdue') AND balance_amount > 0
    `;

    const summary = db.prepare(summaryQuery).get(
      asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate
    ) as any;

    res.json({
      success: true,
      data: {
        asOfDate: asOfDate,
        agingBuckets: agingData,
        summary: {
          totalReceivables: parseFloat(summary.total_receivables || 0),
          current: parseFloat(summary.total_current || 0),
          days1_30: parseFloat(summary.total_1_30 || 0),
          days31_60: parseFloat(summary.total_31_60 || 0),
          days61_90: parseFloat(summary.total_61_90 || 0),
          daysOver90: parseFloat(summary.total_over_90 || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching AR aging report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AR aging report'
    });
  }
}

function getCustomerStatements(req: Request, res: Response): void {
  try {
    const { customerId, fromDate, toDate } = req.query;

    let query = `
      SELECT 
        c.id as customer_id,
        c.customer_name,
        c.customer_code,
        c.current_balance as opening_balance,
        COALESCE(SUM(i.total_amount), 0) as total_debits,
        COALESCE(SUM(i.paid_amount), 0) as total_credits,
        c.current_balance as closing_balance
      FROM customers c
      LEFT JOIN invoices i ON c.id = i.customer_id
    `;

    const params: (string | number)[] = [];

    if (customerId) {
      query += ' WHERE c.id = ?';
      params.push(Number(customerId));
    } else {
      query += ' WHERE c.is_active = 1';
    }

    if (fromDate) {
      query += ' AND i.invoice_date >= ?';
      params.push(fromDate as string);
    }

    if (toDate) {
      query += ' AND i.invoice_date <= ?';
      params.push(toDate as string);
    }

    query += `
      GROUP BY c.id, c.customer_name, c.customer_code, c.current_balance
      ORDER BY c.customer_name
    `;

    const statements = db.prepare(query).all(...params);

    const formattedStatements = (statements as any[]).map(s => ({
      customer_id: s.customer_id,
      customer_name: s.customer_name,
      customer_code: s.customer_code,
      opening_balance: parseFloat(s.opening_balance || 0),
      total_debits: parseFloat(s.total_debits || 0),
      total_credits: parseFloat(s.total_credits || 0),
      closing_balance: parseFloat(s.closing_balance || 0)
    }));

    res.json({
      success: true,
      data: {
        statements: formattedStatements
      }
    });
  } catch (error) {
    console.error('Error fetching customer statements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer statements'
    });
  }
}

function getTopDebtors(req: Request, res: Response): void {
  try {
    const { limit = 10 } = req.query;

    const query = `
      SELECT 
        c.id,
        c.customer_name,
        c.customer_code,
        SUM(i.balance_amount) as outstanding_balance,
        SUM(i.total_amount) as total_invoiced,
        COUNT(i.id) as invoice_count
      FROM customers c
      JOIN invoices i ON c.id = i.customer_id
      WHERE i.status IN ('Unpaid', 'Partially Paid', 'Overdue') AND i.balance_amount > 0
      GROUP BY c.id, c.customer_name, c.customer_code
      ORDER BY outstanding_balance DESC
      LIMIT ?
    `;

    const topDebtors = db.prepare(query).all(parseInt(limit as string));

    res.json({
      success: true,
      data: topDebtors
    });
  } catch (error) {
    console.error('Error fetching top debtors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top debtors'
    });
  }
}

function getDSOMetric(req: Request, res: Response): void {
  try {
    const { period = '30' } = req.query;

    const periodInvoicesQuery = `
      SELECT 
        SUM(total_amount) as total_sales,
        COUNT(id) as total_invoices
      FROM invoices
      WHERE invoice_date >= date('now', '-${period} days')
    `;

    const periodInvoices = db.prepare(periodInvoicesQuery).get() as { total_sales: number; total_invoices: number };

    const arBalanceQuery = `
      SELECT 
        SUM(balance_amount) as total_ar
      FROM invoices
      WHERE status IN ('Unpaid', 'Partially Paid', 'Overdue')
    `;

    const arBalance = db.prepare(arBalanceQuery).get() as { total_ar: number };

    const totalSales = periodInvoices.total_sales || 0;
    const totalAR = arBalance.total_ar || 0;

    const dso = totalSales > 0 ? (totalAR / totalSales) * parseInt(period as string) : 0;

    const avgInvoiceValue = periodInvoices.total_invoices > 0 
      ? totalSales / periodInvoices.total_invoices 
      : 0;

    res.json({
      success: true,
      data: {
        dso: parseFloat(dso.toFixed(2)),
        period: parseInt(period as string),
        totalSales: parseFloat(String(totalSales)),
        totalAR: parseFloat(String(totalAR)),
        totalInvoices: periodInvoices.total_invoices || 0,
        avgInvoiceValue: parseFloat(avgInvoiceValue.toFixed(2)),
        calculation: 'DSO = (Total AR / Total Sales for Period) * Period'
      }
    });
  } catch (error) {
    console.error('Error calculating DSO:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate Days Sales Outstanding'
    });
  }
}

function getReceivablesSummary(req: Request, res: Response): void {
  try {
    const statusQuery = `
      SELECT 
        status,
        COUNT(id) as count,
        SUM(total_amount) as total_amount,
        SUM(balance_amount) as balance_amount
      FROM invoices
      WHERE status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue')
      GROUP BY status
    `;

    const statusData = db.prepare(statusQuery).all();

    const summaryQuery = `
      SELECT 
        COUNT(id) as total_invoices,
        SUM(total_amount) as total_value,
        SUM(paid_amount) as total_paid,
        SUM(balance_amount) as total_outstanding,
        AVG(balance_amount) as average_outstanding
      FROM invoices
      WHERE status IN ('Unpaid', 'Partially Paid', 'Overdue')
    `;

    const summary = db.prepare(summaryQuery).get() as any;

    const overdueQuery = `
      SELECT 
        COUNT(id) as overdue_count,
        SUM(balance_amount) as overdue_amount
      FROM invoices
      WHERE status = 'Overdue'
    `;

    const overdue = db.prepare(overdueQuery).get() as any;

    const statusSummary: any = {
      unpaid: 0,
      partiallyPaid: 0,
      paid: 0,
      overdue: 0
    };

    statusData.forEach((row: any) => {
      if (row.status === 'Unpaid') {
        statusSummary.unpaid = {
          count: row.count,
          amount: parseFloat(row.balance_amount || 0)
        };
      } else if (row.status === 'Partially Paid') {
        statusSummary.partiallyPaid = {
          count: row.count,
          amount: parseFloat(row.balance_amount || 0)
        };
      } else if (row.status === 'Paid') {
        statusSummary.paid = {
          count: row.count,
          amount: parseFloat(row.balance_amount || 0)
        };
      } else if (row.status === 'Overdue') {
        statusSummary.overdue = {
          count: row.count,
          amount: parseFloat(row.balance_amount || 0)
        };
      }
    });

    res.json({
      success: true,
      data: {
        totalInvoices: summary.total_invoices || 0,
        totalValue: parseFloat(summary.total_value || 0),
        totalPaid: parseFloat(summary.total_paid || 0),
        totalOutstanding: parseFloat(summary.total_outstanding || 0),
        averageOutstanding: parseFloat(summary.average_outstanding || 0),
        overdue: {
          count: overdue.overdue_count || 0,
          amount: parseFloat(overdue.overdue_amount || 0)
        },
        statusBreakdown: statusSummary
      }
    });
  } catch (error) {
    console.error('Error fetching receivables summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receivables summary'
    });
  }
}

function getSalesSummary(req: Request, res: Response): void {
  try {
    const { fromDate, toDate, customerId, itemId } = req.query;

    let query = `
      SELECT
        i.invoice_date,
        i.invoice_no,
        i.customer_id,
        c.customer_name,
        SUM(ii.quantity * ii.unit_price) as total_sales,
        SUM(ii.quantity) as total_items,
        i.paid_amount,
        i.balance_amount,
        i.status
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN invoice_items ii ON i.id = ii.invoice_id
    `;

    const params: (string | number)[] = [];
    let whereClause = ' WHERE i.status != ?';
    params.push('Cancelled');

    if (fromDate) {
      whereClause += ' AND i.invoice_date >= ?';
      params.push(fromDate as string);
    }

    if (toDate) {
      whereClause += ' AND i.invoice_date <= ?';
      params.push(toDate as string);
    }

    if (customerId) {
      whereClause += ' AND i.customer_id = ?';
      params.push(Number(customerId));
    }

    if (itemId) {
      whereClause += ' AND ii.item_id = ?';
      params.push(Number(itemId));
    }

    query += whereClause;
    query += `
      GROUP BY i.id, i.invoice_date, i.invoice_no, i.customer_id, c.customer_name, i.paid_amount, i.balance_amount, i.status
      ORDER BY i.invoice_date DESC
    `;

    const salesData = db.prepare(query).all(...params);

    const summaryQuery = `
      SELECT
        COUNT(DISTINCT i.id) as total_invoices,
        SUM(ii.quantity * ii.unit_price) as total_sales,
        SUM(ii.quantity) as total_items_sold,
        AVG(ii.quantity * ii.unit_price) as average_invoice_value
      FROM invoices i
      JOIN invoice_items ii ON i.id = ii.invoice_id
      JOIN customers c ON i.customer_id = c.id
    ` + whereClause;

    const summary = db.prepare(summaryQuery).get(...params) as any;

    res.json({
      success: true,
      data: {
        sales: salesData,
        summary: {
          totalInvoices: summary.total_invoices || 0,
          totalSales: parseFloat(summary.total_sales || 0),
          totalItemsSold: summary.total_items_sold || 0,
          averageInvoiceValue: parseFloat(summary.average_invoice_value || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales summary'
    });
  }
}

function getSalesByCustomer(req: Request, res: Response): void {
  try {
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT
        c.id as customer_id,
        c.customer_name,
        c.customer_code,
        c.email,
        c.phone,
        COUNT(DISTINCT i.id) as total_invoices,
        SUM(ii.quantity * ii.unit_price) as total_sales,
        SUM(ii.quantity) as total_items,
        AVG(ii.quantity * ii.unit_price) as average_order_value,
        MAX(i.invoice_date) as last_purchase_date
      FROM customers c
      JOIN invoices i ON c.id = i.customer_id
      JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.status != 'Cancelled'
    `;

    const params: (string | number)[] = [];

    if (fromDate) {
      query += ' AND i.invoice_date >= ?';
      params.push(fromDate as string);
    }

    if (toDate) {
      query += ' AND i.invoice_date <= ?';
      params.push(toDate as string);
    }

    query += `
      GROUP BY c.id, c.customer_name, c.customer_code, c.email, c.phone
      ORDER BY total_sales DESC
    `;

    const salesByCustomer = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: salesByCustomer
    });
  } catch (error) {
    console.error('Error fetching sales by customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales by customer'
    });
  }
}

function getSalesByItem(req: Request, res: Response): void {
  try {
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT
        ii.item_id,
        i.item_name,
        i.item_code,
        i.category as item_category,
        SUM(ii.quantity) as total_quantity_sold,
        SUM(ii.quantity * ii.unit_price) as total_sales,
        AVG(ii.unit_price) as avg_selling_price,
        COUNT(DISTINCT ii.invoice_id) as invoices_count
      FROM invoice_items ii
      JOIN items i ON ii.item_id = i.id
      JOIN invoices inv ON ii.invoice_id = inv.id
      WHERE inv.status != 'Cancelled'
    `;

    const params: (string | number)[] = [];

    if (fromDate && toDate) {
      query += ' AND inv.invoice_date >= ?';
      params.push(fromDate as string);
      query += ' AND inv.invoice_date <= ?';
      params.push(toDate as string);
    }

    query += `
      GROUP BY ii.item_id, i.item_name, i.item_code, i.category
      ORDER BY total_sales DESC
    `;

    const salesByItem = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: salesByItem
    });
  } catch (error) {
    console.error('Error fetching sales by item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales by item'
    });
  }
}

function getStockLevelReport(req: Request, res: Response): void {
  try {
    const { warehouseId, categoryId, showZeroStock } = req.query;

    let query = `
      SELECT
        i.id as item_id,
        i.item_name,
        i.item_code,
        i.category as item_category,
        i.unit_of_measure,
        i.standard_selling_price,
        i.standard_cost,
        COALESCE(sb.quantity, 0) as current_stock,
        COALESCE(i.reorder_level, 0) as reorder_level,
        CASE
          WHEN COALESCE(sb.quantity, 0) = 0 THEN 'Out of Stock'
          WHEN COALESCE(sb.quantity, 0) <= COALESCE(i.reorder_level, 0) THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM items i
      LEFT JOIN stock_balances sb ON i.id = sb.item_id
    `;

    const params: (string | number)[] = [];
    let whereClause = ' WHERE 1=1';

    if (warehouseId) {
      whereClause += ' AND sb.warehouse_id = ?';
      params.push(Number(warehouseId));
    }

    if (categoryId) {
      whereClause += ' AND i.category = ?';
      params.push(categoryId as string);
    }

    if (showZeroStock === 'false' || showZeroStock === 'false') {
      whereClause += ' AND COALESCE(sb.quantity, 0) > 0';
    }

    query += whereClause;
    query += ' ORDER BY current_stock ASC';

    const stockLevels = db.prepare(query).all(...params);

    const summaryQuery = `
      SELECT
        COUNT(*) as total_items,
        SUM(CASE WHEN COALESCE(sb.quantity, 0) = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN COALESCE(sb.quantity, 0) > 0 AND COALESCE(sb.quantity, 0) <= COALESCE(i.reorder_level, 0) THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN COALESCE(sb.quantity, 0) > COALESCE(i.reorder_level, 0) THEN 1 ELSE 0 END) as in_stock
      FROM items i
      LEFT JOIN stock_balances sb ON i.id = sb.item_id
      ${whereClause}
    `;

    const summary = db.prepare(summaryQuery).get(...params) as any;

    res.json({
      success: true,
      data: {
        stockLevels,
        summary: {
          totalItems: summary.total_items || 0,
          outOfStock: summary.out_of_stock || 0,
          lowStock: summary.low_stock || 0,
          inStock: summary.in_stock || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stock level report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock level report'
    });
  }
}

function getLowStockReport(req: Request, res: Response): void {
  try {
    const { warehouseId } = req.query;

    let query = `
      SELECT
        i.id as item_id,
        i.item_name,
        i.item_code,
        i.category as item_category,
        COALESCE(sb.quantity, 0) as current_stock,
        COALESCE(i.reorder_level, 0) as reorder_level,
        (COALESCE(i.reorder_level, 0) - COALESCE(sb.quantity, 0)) as shortage
      FROM items i
      LEFT JOIN stock_balances sb ON i.id = sb.item_id
      WHERE i.reorder_level > 0 AND COALESCE(sb.quantity, 0) <= i.reorder_level
    `;

    const params: (string | number)[] = [];

    if (warehouseId) {
      query += ' AND sb.warehouse_id = ?';
      params.push(Number(warehouseId));
    }

    query += ' ORDER BY shortage DESC';

    const lowStockItems = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: lowStockItems
    });
  } catch (error) {
    console.error('Error fetching low stock report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch low stock report'
    });
  }
}

function getStockValuationReport(req: Request, res: Response): void {
  try {
    const { warehouseId, valuationMethod = 'average' } = req.query;

    let query = `
      SELECT
        i.id as item_id,
        i.item_name,
        i.item_code,
        i.category as item_category,
        i.unit_of_measure,
        COALESCE(sb.quantity, 0) as current_stock,
        i.standard_cost as unit_cost,
        i.standard_selling_price,
        CASE
          WHEN i.standard_cost > 0 THEN COALESCE(sb.quantity, 0) * i.standard_cost
          ELSE 0
        END as total_value
      FROM items i
      LEFT JOIN stock_balances sb ON i.id = sb.item_id
    `;

    const params: (string | number)[] = [];

    if (warehouseId) {
      query += ' AND sb.warehouse_id = ?';
      params.push(Number(warehouseId));
    }

    query += ' ORDER BY total_value DESC';

    const valuationData = db.prepare(query).all(...params);

    const totalValue = valuationData.reduce((sum: number, item: any) => sum + item.total_value, 0);

    res.json({
      success: true,
      data: {
        stockValuation: valuationData,
        summary: {
          totalItems: valuationData.length,
          totalValue: parseFloat(totalValue.toFixed(2))
        },
        valuationMethod: valuationMethod
      }
    });
  } catch (error) {
    console.error('Error fetching stock valuation report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock valuation report'
    });
  }
}

function getInventoryMovementReport(req: Request, res: Response): void {
  try {
    const { fromDate, toDate, itemId, warehouseId, movementType } = req.query;

    let query = `
      SELECT
        sm.id,
        sm.item_id,
        i.item_name,
        i.item_code,
        sm.warehouse_id,
        w.warehouse_name,
        sm.movement_type,
        sm.quantity,
        sm.unit_cost,
        (sm.quantity * sm.unit_cost) as total_value,
        sm.movement_date,
        sm.reference_doctype,
        sm.reference_docno,
        sm.remarks,
        CONCAT(sm.reference_doctype, ' ', COALESCE(sm.reference_docno, '')) as reference,
        u.full_name as created_by_name
      FROM stock_movements sm
      JOIN items i ON sm.item_id = i.id
      JOIN warehouses w ON sm.warehouse_id = w.id
      LEFT JOIN users u ON sm.created_by = u.id
    `;

    const params: (string | number)[] = [];
    let whereClause = ' WHERE 1=1';

    if (fromDate && toDate) {
      whereClause += ' AND sm.movement_date >= ?';
      params.push(fromDate as string);
      whereClause += ' AND sm.movement_date <= ?';
      params.push(toDate as string);
    }

    if (itemId) {
      whereClause += ' AND sm.item_id = ?';
      params.push(Number(itemId));
    }

    if (warehouseId) {
      whereClause += ' AND sm.warehouse_id = ?';
      params.push(Number(warehouseId));
    }

    if (movementType && movementType !== 'all') {
      const dbMovementType = movementType === 'in' ? 'IN' : movementType === 'out' ? 'OUT' : String(movementType);
      whereClause += ' AND sm.movement_type = ?';
      params.push(dbMovementType);
    }

    query += whereClause;
    query += ' ORDER BY sm.movement_date DESC, sm.created_at DESC';

    const movements = db.prepare(query).all(...params);

    // Calculate summary
    const totalInbound = movements
      .filter((m: any) => m.movement_type === 'IN' || m.movement_type === 'in')
      .reduce((sum: number, m: any) => sum + Math.abs(parseFloat(m.quantity || 0)), 0);
    
    const totalOutbound = movements
      .filter((m: any) => m.movement_type === 'OUT' || m.movement_type === 'out' || m.movement_type === 'SALE' || m.movement_type === 'ADJUSTMENT')
      .reduce((sum: number, m: any) => sum + Math.abs(parseFloat(m.quantity || 0)), 0);

    res.json({
      success: true,
      data: {
        movements: movements,
        summary: {
          totalInbound: Math.round(totalInbound),
          totalOutbound: Math.round(totalOutbound),
          netMovement: Math.round(totalInbound - totalOutbound)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching inventory movement report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory movement report'
    });
  }
}

function getProfitLossReport(req: Request, res: Response): void {
  try {
    const { fromDate, toDate } = req.query;

    let revenueQuery = `
      SELECT COALESCE(SUM(ii.quantity * ii.unit_price), 0) as total_revenue
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE i.status != 'Cancelled'
    `;
    const revenueParams: (string | number)[] = [];

    if (fromDate) {
      revenueQuery += ' AND i.invoice_date >= ?';
      revenueParams.push(fromDate as string);
    }

    if (toDate) {
      revenueQuery += ' AND i.invoice_date <= ?';
      revenueParams.push(toDate as string);
    }

    const revenueResult = db.prepare(revenueQuery).get(...revenueParams) as { total_revenue: number };

    let cogsQuery = `
      SELECT
        COALESCE(SUM(ii.quantity * i.standard_cost), 0) as total_cogs
      FROM invoice_items ii
      JOIN invoices inv ON ii.invoice_id = inv.id
      JOIN items i ON ii.item_id = i.id
      WHERE inv.status != 'Cancelled'
    `;
    const cogsParams: (string | number)[] = [];

    if (fromDate) {
      cogsQuery += ' AND inv.invoice_date >= ?';
      cogsParams.push(fromDate as string);
    }

    if (toDate) {
      cogsQuery += ' AND inv.invoice_date <= ?';
      cogsParams.push(toDate as string);
    }

    const cogsResult = db.prepare(cogsQuery).get(...cogsParams) as { total_cogs: number };

    let expenseQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses
      WHERE status = 'Paid'
    `;
    const expenseParams: (string | number)[] = [];

    if (fromDate) {
      expenseQuery += ' AND expense_date >= ?';
      expenseParams.push(fromDate as string);
    }

    if (toDate) {
      expenseQuery += ' AND expense_date <= ?';
      expenseParams.push(toDate as string);
    }

    const expensesResult = db.prepare(expenseQuery).get(...expenseParams) as { total_expenses: number };

    const totalRevenue = parseFloat(String(revenueResult.total_revenue || 0));
    const totalCogs = parseFloat(String(cogsResult.total_cogs || 0));
    const totalExpenses = parseFloat(String(expensesResult.total_expenses || 0));

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalCogs: parseFloat(totalCogs.toFixed(2)),
        grossProfit: parseFloat(grossProfit.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        grossProfitMargin: totalRevenue > 0 ? parseFloat(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0,
        netProfitMargin: totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0
      }
    });
  } catch (error) {
    console.error('Error calculating profit & loss:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate profit & loss'
    });
  }
}

function getCashFlowReport(req: Request, res: Response): void {
  try {
    const { fromDate, toDate } = req.query;

    let inflowQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_inflow
      FROM payments
      WHERE 1=1
    `;
    const inflowParams: (string | number)[] = [];

    if (fromDate) {
      inflowQuery += ' AND payment_date >= ?';
      inflowParams.push(fromDate as string);
    }

    if (toDate) {
      inflowQuery += ' AND payment_date <= ?';
      inflowParams.push(toDate as string);
    }

    const inflowResult = db.prepare(inflowQuery).get(...inflowParams) as { total_inflow: number };

    let outflowQuery = `
      SELECT COALESCE(SUM(outflow_amount), 0) as total_outflow
      FROM (
        -- Purchase payments
        SELECT SUM(poi.quantity * poi.unit_price) as outflow_amount
        FROM purchase_order_items poi
        JOIN purchase_orders po ON poi.po_id = po.id
        WHERE po.status IN ('Delivered', 'Partially Delivered', 'Completed')
    `;
    const outflowParams: (string | number)[] = [];

    if (fromDate) {
      outflowQuery += ' AND po.po_date >= ?';
      outflowParams.push(fromDate as string);
    }

    if (toDate) {
      outflowQuery += ' AND po.po_date <= ?';
      outflowParams.push(toDate as string);
    }

    outflowQuery += `
        UNION ALL
        -- Expense payments
        SELECT SUM(amount) as outflow_amount
        FROM expenses
        WHERE status = 'Paid'
    `;

    if (fromDate) {
      outflowQuery += ' AND expense_date >= ?';
      outflowParams.push(fromDate as string);
    }

    if (toDate) {
      outflowQuery += ' AND expense_date <= ?';
      outflowParams.push(toDate as string);
    }

    outflowQuery += `
      )
    `;

    const outflowResult = db.prepare(outflowQuery).get(...outflowParams) as { total_outflow: number };

    const totalInflow = parseFloat(String(inflowResult.total_inflow ?? 0));
    const totalOutflow = parseFloat(String(outflowResult.total_outflow ?? 0));
    const netCashFlow = totalInflow - totalOutflow;

    res.json({
      success: true,
      data: {
        totalInflow: parseFloat(totalInflow.toFixed(2)),
        totalOutflow: parseFloat(totalOutflow.toFixed(2)),
        netCashFlow: parseFloat(netCashFlow.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error calculating cash flow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate cash flow'
    });
  }
}

function getPurchaseSummary(req: Request, res: Response): void {
  try {
    const { fromDate, toDate, supplierId, itemId } = req.query;

    let query = `
      SELECT
        po.id,
        po.po_no as purchase_order_number,
        po.supplier_id,
        s.supplier_name,
        po.po_date as purchase_date,
        po.expected_delivery_date as due_date,
        po.status,
        COALESCE(SUM(poi.quantity * poi.unit_price), 0) as total_cost,
        COALESCE(SUM(poi.quantity), 0) as total_items,
        COALESCE(SUM(poi.received_quantity * poi.unit_price), 0) as received_amount,
        COALESCE(SUM((poi.quantity - poi.received_quantity) * poi.unit_price), 0) as balance_amount
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
    `;

    const params: (string | number)[] = [];
    let whereClause = ' WHERE 1=1';

    if (fromDate && toDate) {
      whereClause += ' AND po.po_date >= ?';
      params.push(fromDate as string);
      whereClause += ' AND po.po_date <= ?';
      params.push(toDate as string);
    }

    if (supplierId) {
      whereClause += ' AND po.supplier_id = ?';
      params.push(Number(supplierId));
    }

    if (itemId) {
      whereClause += ' AND poi.item_id = ?';
      params.push(Number(itemId));
    }

    query += whereClause;
    query += `
      GROUP BY po.id, po.po_no, po.supplier_id, s.supplier_name, po.po_date, po.expected_delivery_date, po.status
      ORDER BY po.po_date DESC
    `;

    const purchases = db.prepare(query).all(...params);

    const summaryQuery = `
      SELECT
        COUNT(DISTINCT po.id) as total_orders,
        COALESCE(SUM(poi.quantity * poi.unit_price), 0) as total_amount,
        COALESCE(SUM(poi.quantity), 0) as total_items
      FROM purchase_orders po
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
    ` + whereClause;

    const summary = db.prepare(summaryQuery).get(...params) as any;
    const totalCost = parseFloat(summary.total_amount || 0);
    const totalOrders = parseInt(summary.total_orders || 0);

    res.json({
      success: true,
      data: {
        purchases: purchases,
        summary: {
          totalOrders: totalOrders,
          totalCost: totalCost,
          totalItems: parseInt(summary.total_items || 0),
          averageOrderValue: totalOrders > 0 ? totalCost / totalOrders : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching purchase summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch purchase summary'
    });
  }
}

function getSupplierAnalysis(req: Request, res: Response): void {
  try {
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT
        s.id as supplier_id,
        s.supplier_name,
        s.supplier_code,
        s.email,
        s.phone,
        COUNT(DISTINCT po.id) as total_orders,
        SUM(poi.quantity * poi.unit_price) as total_purchases,
        AVG(poi.unit_price) as average_unit_price,
        MIN(po.order_date) as first_order_date,
        MAX(po.order_date) as last_order_date,
        po.status as latest_order_status
      FROM suppliers s
      JOIN purchase_orders po ON s.id = po.supplier_id
      JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (fromDate) {
      query += ' AND po.order_date >= ?';
      params.push(fromDate as string);
    }

    if (toDate) {
      query += ' AND po.order_date <= ?';
      params.push(toDate as string);
    }

    query += `
      GROUP BY s.id, s.supplier_name, s.supplier_code, s.email, s.phone, po.status
      ORDER BY total_purchases DESC
    `;

    const suppliers = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Error fetching supplier analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplier analysis'
    });
  }
}

function getProductionSummary(req: Request, res: Response): void {
  try {
    const { fromDate, toDate, bomId } = req.query;

    let query = `
      SELECT
        wo.id,
        wo.work_order_no,
        wo.bom_id,
        b.bom_name,
        wo.quantity_to_produce,
        wo.quantity_produced,
        wo.status,
        wo.start_date,
        wo.end_date,
        wo.created_at,
        (wo.quantity_produced * 100.0 / wo.quantity_to_produce) as completion_percentage
      FROM work_orders wo
      JOIN bom b ON wo.bom_id = b.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (fromDate) {
      query += ' AND wo.created_at >= ?';
      params.push(fromDate as string);
    }

    if (toDate) {
      query += ' AND wo.created_at <= ?';
      params.push(toDate as string);
    }

    if (bomId) {
      query += ' AND wo.bom_id = ?';
      params.push(Number(bomId));
    }

    query += ' ORDER BY wo.created_at DESC';

    const workOrders = db.prepare(query).all(...params);

    let summaryQuery = `
      SELECT
        COUNT(*) as total_work_orders,
        SUM(quantity_to_produce) as total_to_produce,
        SUM(quantity_produced) as total_produced,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_orders,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_orders
      FROM work_orders
      WHERE 1=1
    `;

    const summaryParams: (string | number)[] = [];

    if (fromDate) {
      summaryQuery += ' AND created_at >= ?';
      summaryParams.push(fromDate as string);
    }

    if (toDate) {
      summaryQuery += ' AND created_at <= ?';
      summaryParams.push(toDate as string);
    }

    if (bomId) {
      summaryQuery += ' AND bom_id = ?';
      summaryParams.push(Number(bomId));
    }

    const summary = db.prepare(summaryQuery).get(...summaryParams) as any;

    res.json({
      success: true,
      data: {
        workOrders,
        summary: {
          totalWorkOrders: summary.total_work_orders || 0,
          totalToProduce: summary.total_to_produce || 0,
          totalProduced: summary.total_produced || 0,
          completedOrders: summary.completed_orders || 0,
          inProgressOrders: summary.in_progress_orders || 0,
          pendingOrders: summary.pending_orders || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching production summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production summary'
    });
  }
}

function getBOMUsageReport(req: Request, res: Response): void {
  try {
    const { fromDate, toDate, bomId } = req.query;

    let query = `
      SELECT
        b.id as bom_id,
        b.bom_name,
        b.item_id as finished_good_id,
        fi.item_name as finished_good_name,
        COUNT(DISTINCT wo.id) as usage_count,
        SUM(wo.quantity_to_produce) as total_quantity_used,
        b.quantity as bom_quantity,
        b.uom as bom_uom
      FROM bom b
      JOIN items fi ON b.item_id = fi.id
      LEFT JOIN work_orders wo ON b.id = wo.bom_id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (fromDate) {
      query += ' AND wo.created_at >= ?';
      params.push(fromDate as string);
    }

    if (toDate) {
      query += ' AND wo.created_at <= ?';
      params.push(toDate as string);
    }

    if (bomId) {
      query += ' AND b.id = ?';
      params.push(Number(bomId));
    }

    query += `
      GROUP BY b.id, b.bom_name, b.item_id, fi.item_name, b.quantity, b.uom
      ORDER BY usage_count DESC, total_quantity_used DESC
    `;

    const bomUsage = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: bomUsage
    });
  } catch (error) {
    console.error('Error fetching BOM usage report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch BOM usage report'
    });
  }
}

function getExpensesReport(req: Request, res: Response): void {
  try {
    const { fromDate, toDate, category, vendor } = req.query;

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
        u.full_name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (fromDate) {
      query += ' AND e.expense_date >= ?';
      params.push(fromDate as string);
    }

    if (toDate) {
      query += ' AND e.expense_date <= ?';
      params.push(toDate as string);
    }

    if (category) {
      query += ' AND e.expense_category = ?';
      params.push(category as string);
    }

    if (vendor) {
      query += ' AND e.vendor_name LIKE ?';
      params.push(`%${vendor}%`);
    }

    query += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    const expenses = db.prepare(query).all(...params);

    let summaryQuery = `
      SELECT
        COUNT(*) as total_expenses,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
      FROM expenses
      WHERE 1=1
    `;
    const summaryParams: (string | number)[] = [];

    if (fromDate) {
      summaryQuery += ' AND expense_date >= ?';
      summaryParams.push(fromDate as string);
    }

    if (toDate) {
      summaryQuery += ' AND expense_date <= ?';
      summaryParams.push(toDate as string);
    }

    if (category) {
      summaryQuery += ' AND expense_category = ?';
      summaryParams.push(category as string);
    }

    if (vendor) {
      summaryQuery += ' AND vendor_name LIKE ?';
      summaryParams.push(`%${vendor}%`);
    }

    const summary = db.prepare(summaryQuery).get(...summaryParams) as any;

    let categoryQuery = `
      SELECT
        expense_category,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM expenses
      WHERE 1=1
    `;
    const categoryParams: (string | number)[] = [];

    if (fromDate) {
      categoryQuery += ' AND expense_date >= ?';
      categoryParams.push(fromDate as string);
    }

    if (toDate) {
      categoryQuery += ' AND expense_date <= ?';
      categoryParams.push(toDate as string);
    }

    if (category) {
      categoryQuery += ' AND expense_category = ?';
      categoryParams.push(category as string);
    }

    if (vendor) {
      categoryQuery += ' AND vendor_name LIKE ?';
      categoryParams.push(`%${vendor}%`);
    }

    categoryQuery += ' GROUP BY expense_category ORDER BY total_amount DESC';

    const categoryBreakdown = db.prepare(categoryQuery).all(...categoryParams);

    res.json({
      success: true,
      data: {
        expenses,
        summary: {
          totalExpenses: summary.total_expenses || 0,
          totalAmount: parseFloat((summary.total_amount || 0).toFixed(2)),
          averageAmount: parseFloat((summary.average_amount || 0).toFixed(2))
        },
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching expenses report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expenses report'
    });
  }
}

export default {
  getARAgingReport,
  getCustomerStatements,
  getTopDebtors,
  getDSOMetric,
  getReceivablesSummary,
  getSalesSummary,
  getSalesByCustomer,
  getSalesByItem,
  getStockLevelReport,
  getLowStockReport,
  getStockValuationReport,
  getInventoryMovementReport,
  getProfitLossReport,
  getCashFlowReport,
  getPurchaseSummary,
  getSupplierAnalysis,
  getProductionSummary,
  getBOMUsageReport,
  getExpensesReport
};
