import Database from 'better-sqlite3';

interface DashboardSummary {
  totalItems: number;
  totalStockValue: number;
  totalSalesRevenue: number;
  totalPurchases: number;
  warehouseStockCount: number;
  lowStockItems: Array<{
    id: number;
    item_code: string;
    item_name: string;
    current_stock: number;
    reorder_level: number;
    category: string;
  }>;
  stockByCategory: Array<{ category: string; total_stock: number }>;
  salesByDay: Array<{ date: string; total: number }>;
  purchasesByDay: Array<{ date: string; total: number }>;
  recentProductions: number;
}

function getSummary(db: Database.Database): DashboardSummary {
  const itemCount = db.prepare('SELECT COUNT(*) as count FROM items WHERE is_active = 1').get() as { count: number };

  const stockValue = db.prepare(`
    SELECT COALESCE(SUM(current_stock * standard_cost), 0) as total
    FROM items WHERE is_active = 1
  `).get() as { total: number };

  const salesRevenue = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices
  `).get() as { total: number };

  const purchaseTotal = db.prepare(`
    SELECT COALESCE(SUM(total_cost), 0) as total FROM purchases
  `).get() as { total: number };

  const warehouseStocks = db.prepare(`
    SELECT COUNT(*) as count FROM stock_balances WHERE quantity > 0
  `).get() as { count: number };

  const lowStockItems = db.prepare(`
    SELECT id, item_code, item_name, current_stock, reorder_level, category
    FROM items
    WHERE is_active = 1 AND reorder_level > 0 AND current_stock <= reorder_level
    ORDER BY (current_stock * 1.0 / reorder_level) ASC
    LIMIT 20
  `).all() as DashboardSummary['lowStockItems'];

  const stockByCategory = db.prepare(`
    SELECT category, COALESCE(SUM(current_stock), 0) as total_stock
    FROM items
    WHERE is_active = 1 AND category IS NOT NULL AND category != ''
    GROUP BY category
    ORDER BY total_stock DESC
  `).all() as DashboardSummary['stockByCategory'];

  const salesByDay = db.prepare(`
    SELECT invoice_date as date, COALESCE(SUM(total_amount), 0) as total
    FROM invoices
    WHERE invoice_date >= date('now', '-7 days')
    GROUP BY invoice_date
    ORDER BY invoice_date
  `).all() as DashboardSummary['salesByDay'];

  const purchasesByDay = db.prepare(`
    SELECT purchase_date as date, COALESCE(SUM(total_cost), 0) as total
    FROM purchases
    WHERE purchase_date >= date('now', '-7 days')
    GROUP BY purchase_date
    ORDER BY purchase_date
  `).all() as DashboardSummary['purchasesByDay'];

  const productionCount = db.prepare(`
    SELECT COUNT(*) as count FROM productions
    WHERE production_date >= date('now', '-30 days')
  `).get() as { count: number };

  return {
    totalItems: itemCount.count,
    totalStockValue: stockValue.total,
    totalSalesRevenue: salesRevenue.total,
    totalPurchases: purchaseTotal.total,
    warehouseStockCount: warehouseStocks.count,
    lowStockItems,
    stockByCategory,
    salesByDay,
    purchasesByDay,
    recentProductions: productionCount.count,
  };
}

export default { getSummary };
