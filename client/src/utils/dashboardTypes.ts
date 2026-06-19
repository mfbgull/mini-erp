export interface LowStockItem {
  id: number;
  item_code: string;
  item_name: string;
  current_stock: number;
  reorder_level: number;
  category: string;
}

export interface StockByCategory {
  category: string;
  total_stock: number;
}

export interface DayTotal {
  date: string;
  total: number;
}

export interface DashboardSummary {
  totalItems: number;
  totalStockValue: number;
  totalSalesRevenue: number;
  totalPurchases: number;
  warehouseStockCount: number;
  lowStockItems: LowStockItem[];
  stockByCategory: StockByCategory[];
  salesByDay: DayTotal[];
  purchasesByDay: DayTotal[];
  recentProductions: number;
}
