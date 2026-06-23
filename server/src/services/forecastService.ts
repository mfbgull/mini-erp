import db from '../config/database';
import { ForecastResult, ForecastDashboardData, ForecastAlert, TrendData, MonthlySaleData } from '../types';

/**
 * Batch-fetch 12-month sales history for all given item IDs in a single query.
 * Returns a Map<itemId, number[]> where each array is monthly totals in ASC order.
 */
function getAllHistoricalSales(itemIds: number[]): Map<number, number[]> {
  if (itemIds.length === 0) return new Map();

  const placeholders = itemIds.map(() => '?').join(',');
  const results = db.prepare(`
    SELECT
      ii.item_id,
      strftime('%Y-%m', i.invoice_date) as month,
      SUM(ii.quantity) as total_quantity
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    WHERE ii.item_id IN (${placeholders})
      AND i.invoice_date >= date('now', '-12 months')
      AND i.status != 'Cancelled'
    GROUP BY ii.item_id, strftime('%Y-%m', i.invoice_date)
    ORDER BY ii.item_id, month ASC
  `).all(...itemIds) as { item_id: number; month: string; total_quantity: number }[];

  const salesMap = new Map<number, number[]>();
  for (const r of results) {
    if (!salesMap.has(r.item_id)) {
      salesMap.set(r.item_id, []);
    }
    salesMap.get(r.item_id)!.push(r.total_quantity);
  }

  // Ensure every requested item has an entry (empty array = no sales)
  for (const id of itemIds) {
    if (!salesMap.has(id)) {
      salesMap.set(id, []);
    }
  }

  return salesMap;
}

/**
 * Weighted Moving Average — applies highest weight to the most recent data.
 * Sales data comes in ASC order (oldest first), so we iterate from the end.
 */
function calculateWMA(sales: number[]): number {
  if (sales.length === 0) return 0;
  if (sales.length === 1) return sales[0];

  const weights = [0.5, 0.3, 0.2];
  let sum = 0;
  let weightSum = 0;
  const count = Math.min(sales.length, 3);

  // Apply weights from most recent (end of array) to oldest
  for (let i = 0; i < count; i++) {
    const idx = sales.length - 1 - i; // most recent first
    sum += sales[idx] * weights[i];
    weightSum += weights[i];
  }

  return sum / weightSum;
}

/**
 * Detects trend direction from sales data (ASC order — oldest first).
 * Compares the most recent 3 months to determine direction.
 */
function detectTrend(sales: number[]): { direction: 'growing' | 'stable' | 'declining'; percentage: number } {
  if (sales.length === 0) {
    return { direction: 'stable', percentage: 0 };
  }
  if (sales.length < 3) {
    return { direction: 'stable', percentage: 0 };
  }

  // Most recent 3 months
  const recent = sales.slice(-3); // [oldest_of_3, middle, newest]
  const oldest = recent[0];
  const newest = recent[recent.length - 1];

  if (oldest === 0) {
    if (newest > 0) return { direction: 'growing', percentage: 100 };
    return { direction: 'stable', percentage: 0 };
  }

  const change = ((newest - oldest) / oldest) * 100;

  if (change > 5) return { direction: 'growing', percentage: Math.round(change * 10) / 10 };
  if (change < -5) return { direction: 'declining', percentage: Math.round(change * 10) / 10 };
  return { direction: 'stable', percentage: Math.round(change * 10) / 10 };
}

function calculateConfidence(sales: number[]): number {
  if (sales.length < 3) return 50;

  const mean = sales.reduce((a, b) => a + b, 0) / sales.length;
  if (mean === 0) return 50;

  const squaredDiffs = sales.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / sales.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  if (cv < 0.15) return 90;
  if (cv < 0.30) return 70;
  return 50;
}

/**
 * Returns a reorder recommendation based on current stock vs predicted demand.
 * Handles NaN edge case when predictedDemand is 0.
 */
function getRecommendation(currentStock: number, predictedDemand: number): 'order_now' | 'order_soon' | 'monitor' | 'adequate' {
  // If no demand data, we can't recommend — flag as monitor
  if (predictedDemand <= 0) return 'monitor';

  const ratio = currentStock / predictedDemand;

  if (ratio < 0.3) return 'order_now';
  if (ratio < 0.5) return 'order_soon';
  if (ratio < 1.0) return 'monitor';
  return 'adequate';
}

/**
 * Generate forecast for a single item using pre-fetched batch data.
 */
function buildItemForecast(
  item: { id: number; item_code: string; item_name: string; category: string; current_stock: number },
  sales: number[]
): ForecastResult {
  const monthlyAvg = calculateWMA(sales);
  const nextWeek = Math.round(monthlyAvg / 4);
  const nextMonth = Math.round(monthlyAvg);
  const nextQuarter = Math.round(monthlyAvg * 3);

  const { direction, percentage } = detectTrend(sales);
  const confidence = calculateConfidence(sales);
  const recommendation = getRecommendation(item.current_stock, nextMonth);

  return {
    itemId: item.id,
    itemCode: item.item_code,
    itemName: item.item_name,
    category: item.category || 'Uncategorized',
    currentStock: item.current_stock,
    predictedDemand: {
      nextWeek,
      nextMonth,
      nextQuarter
    },
    trend: direction,
    trendPercentage: percentage,
    confidence,
    recommendation,
    lastUpdated: new Date().toISOString().split('T')[0]
  };
}

/**
 * Saves forecasts to the demand_forecasts table for caching.
 */
function saveForecastsToDb(forecasts: ForecastResult[]): void {
  const today = new Date().toISOString().split('T')[0];
  const existingCheck = db.prepare(
    `SELECT COUNT(*) as count FROM demand_forecasts WHERE forecast_date = ?`
  ).get(today) as { count: number };

  // Clear old forecasts for today
  if (existingCheck.count > 0) {
    db.prepare('DELETE FROM demand_forecasts WHERE forecast_date = ?').run(today);
  }

  const insert = db.prepare(`
    INSERT INTO demand_forecasts (item_id, forecast_date, period, predicted_quantity, confidence_level, trend_direction, trend_percentage, model_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: ForecastResult[]) => {
    for (const f of items) {
      for (const [period, qty] of Object.entries({
        'next_week': f.predictedDemand.nextWeek,
        'next_month': f.predictedDemand.nextMonth,
        'next_quarter': f.predictedDemand.nextQuarter
      })) {
        insert.run(f.itemId, today, period, qty, f.confidence, f.trend, f.trendPercentage, 'weighted_moving_average');
      }
    }
  });

  insertMany(forecasts);
}

/**
 * Reads cached forecasts from the database for today.
 * Returns null if no valid cached data exists.
 */
function readCachedForecasts(): ForecastResult[] | null {
  const today = new Date().toISOString().split('T')[0];

  // Check if we have fresh forecasts — within TTL window
  const cachedRows = db.prepare(`
    SELECT df.*, i.item_code, i.item_name, i.category, i.current_stock
    FROM demand_forecasts df
    JOIN items i ON i.id = df.item_id
    WHERE df.forecast_date = ?
    ORDER BY df.item_id, df.period
  `).all(today) as (Record<string, unknown> & {
    item_id: number; item_code: string; item_name: string; category: string;
    current_stock: number; period: string; predicted_quantity: number;
    confidence_level: number; trend_direction: string; trend_percentage: number;
  })[];

  if (cachedRows.length === 0) return null;

  // Group by item_id
  const itemMap = new Map<number, ForecastResult>();
  for (const row of cachedRows) {
    if (!itemMap.has(row.item_id)) {
      itemMap.set(row.item_id, {
        itemId: row.item_id,
        itemCode: row.item_code,
        itemName: row.item_name,
        category: row.category || 'Uncategorized',
        currentStock: row.current_stock,
        predictedDemand: { nextWeek: 0, nextMonth: 0, nextQuarter: 0 },
        trend: (row.trend_direction as 'growing' | 'stable' | 'declining') || 'stable',
        trendPercentage: row.trend_percentage || 0,
        confidence: row.confidence_level || 0,
        recommendation: 'monitor',
        lastUpdated: today
      });
    }

    const item = itemMap.get(row.item_id)!;
    if (row.period === 'next_week') item.predictedDemand.nextWeek = Math.round(row.predicted_quantity);
    if (row.period === 'next_month') item.predictedDemand.nextMonth = Math.round(row.predicted_quantity);
    if (row.period === 'next_quarter') item.predictedDemand.nextQuarter = Math.round(row.predicted_quantity);
  }

  // Compute recommendation for each cached item (stock might have changed)
  for (const item of itemMap.values()) {
    item.recommendation = getRecommendation(item.currentStock, item.predictedDemand.nextMonth);
  }

  return Array.from(itemMap.values());
}

/**
 * Generate forecasts for all finished goods using batch queries.
 * Reduces from (1 + 2N) queries to 2 queries total.
 */
export function generateAllForecasts(): ForecastResult[] {
  const items = db.prepare(`
    SELECT id, item_code, item_name, category, current_stock
    FROM items
    WHERE is_finished_good = 1 AND is_active = 1
  `).all() as { id: number; item_code: string; item_name: string; category: string; current_stock: number }[];

  const ids = items.map(i => i.id);
  const salesMap = getAllHistoricalSales(ids);

  const forecasts = items.map(item =>
    buildItemForecast(item, salesMap.get(item.id) || [])
  );

  saveForecastsToDb(forecasts);
  return forecasts;
}

/**
 * Get forecasts with caching. Returns cached data if available and fresh,
 * otherwise generates new forecasts, persists them, and returns.
 */
export function getOrGenerateForecasts(): ForecastResult[] {
  const cached = readCachedForecasts();
  if (cached) return cached;
  return generateAllForecasts();
}

export function getDashboardData(): ForecastDashboardData {
  const forecasts = getOrGenerateForecasts();

  const alerts: ForecastAlert[] = forecasts
    .filter(f => f.recommendation === 'order_now' || f.recommendation === 'order_soon')
    .map(f => ({
      itemId: f.itemId,
      itemName: f.itemName,
      currentStock: f.currentStock,
      predictedDemand: f.predictedDemand.nextMonth,
      alertLevel: f.recommendation === 'order_now' ? 'critical' as const : 'warning' as const,
      recommendation: f.recommendation
    }))
    .sort((a, b) => {
      const ratioA = a.predictedDemand > 0 ? a.currentStock / a.predictedDemand : 0;
      const ratioB = b.predictedDemand > 0 ? b.currentStock / b.predictedDemand : 0;
      return ratioA - ratioB;
    });

  const criticalAlerts = alerts.filter(a => a.alertLevel === 'critical').length;
  const itemsNeedingRestock = alerts.length;
  const avgConfidence = forecasts.length > 0
    ? Math.round(forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length)
    : 0;

  return {
    summary: {
      totalItems: forecasts.length,
      itemsNeedingRestock,
      avgConfidence,
      criticalAlerts
    },
    alerts,
    topGrowing: forecasts.filter(f => f.trend === 'growing').slice(0, 5),
    topDeclining: forecasts.filter(f => f.trend === 'declining').slice(0, 5)
  };
}

export function getTrendData(itemId?: number): TrendData {
  let items: { id: number; item_name: string }[];

  if (itemId) {
    items = db.prepare(`SELECT id, item_name FROM items WHERE id = ?`).all(itemId) as { id: number; item_name: string }[];
  } else {
    items = db.prepare(`
      SELECT id, item_name FROM items 
      WHERE is_finished_good = 1 AND is_active = 1
      LIMIT 10
    `).all() as { id: number; item_name: string }[];
  }

  const monthlySalesQuery = itemId 
    ? `SELECT strftime('%Y-%m', i.invoice_date) as month, SUM(ii.quantity) as total
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       WHERE ii.item_id = ? AND i.invoice_date >= date('now', '-12 months') AND i.status != 'Cancelled'
       GROUP BY month ORDER BY month ASC`
    : `SELECT strftime('%Y-%m', i.invoice_date) as month, SUM(ii.quantity) as total
       FROM invoice_items ii
       JOIN invoices i ON i.id = ii.invoice_id
       WHERE i.invoice_date >= date('now', '-12 months') AND i.status != 'Cancelled'
       GROUP BY month ORDER BY month ASC`;

  const monthlyData = itemId 
    ? db.prepare(monthlySalesQuery).all(itemId) as { month: string; total: number }[]
    : db.prepare(monthlySalesQuery).all() as { month: string; total: number }[];

  // Historical data with moving average (NOT labeled as "predicted")
  const historicalTrends: MonthlySaleData[] = monthlyData.map(m => ({
    month: m.month,
    actual: m.total,
    predicted: null
  }));

  // Add 3-month moving average as trend line (not prediction)
  const totals = historicalTrends.map(t => t.actual || 0);
  for (let i = 2; i < historicalTrends.length; i++) {
    const window = totals.slice(i - 2, i + 1);
    historicalTrends[i].movingAvg = Math.round(calculateWMA(window));
  }

  // Add forecast for the next month if we have enough data
  if (totals.length >= 3) {
    const nextMonthDate = getNextMonth(monthlyData[monthlyData.length - 1]?.month);
    const forecast = Math.round(calculateWMA(totals));
    historicalTrends.push({
      month: nextMonthDate,
      actual: null,
      predicted: forecast
    });
  }

  const ids = items.map(i => i.id);
  const salesMap = getAllHistoricalSales(ids);

  const itemBreakdown = items.map(item => {
    const sales = salesMap.get(item.id) || [];
    const totalSold = sales.reduce((a, b) => a + b, 0);
    const { direction } = detectTrend(sales);
    return {
      itemName: item.item_name,
      totalSold,
      trend: direction
    };
  }).sort((a, b) => b.totalSold - a.totalSold);

  return { historicalTrends, itemBreakdown };
}

function getNextMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split('-').map(Number);
  const date = new Date(year, month, 1); // month is 0-indexed in Date constructor
  date.setMonth(date.getMonth() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
