import db from '../config/database';
import { ForecastResult, ForecastDashboardData, ForecastAlert, TrendData, MonthlySaleData } from '../types';

function getHistoricalSales(itemId: number, months: number = 12): number[] {
  const query = `
    SELECT 
      strftime('%Y-%m', sale_date) as month,
      SUM(quantity) as total_quantity
    FROM sales
    WHERE item_id = ?
      AND sale_date >= date('now', '-' || ? || ' months')
    GROUP BY strftime('%Y-%m', sale_date)
    ORDER BY month ASC
  `;
  
  const results = db.prepare(query).all(itemId, months) as { month: string; total_quantity: number }[];
  return results.map(r => r.total_quantity);
}

function calculateWMA(sales: number[]): number {
  if (sales.length === 0) return 0;
  if (sales.length === 1) return sales[0];
  
  const weights = [0.5, 0.3, 0.2];
  let sum = 0;
  let weightSum = 0;
  
  for (let i = 0; i < Math.min(sales.length, 3); i++) {
    sum += sales[i] * weights[i];
    weightSum += weights[i];
  }
  
  return sum / weightSum;
}

function detectTrend(sales: number[]): { direction: 'growing' | 'stable' | 'declining'; percentage: number } {
  if (sales.length < 3) {
    return { direction: 'stable', percentage: 0 };
  }
  
  const recent = sales.slice(0, Math.min(sales.length, 3));
  const first = recent[recent.length - 1];
  const last = recent[0];
  
  if (first === 0) {
    return { direction: last > 0 ? 'growing' : 'stable', percentage: 0 };
  }
  
  const change = ((last - first) / first) * 100;
  
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

function getRecommendation(currentStock: number, predictedDemand: number): 'order_now' | 'order_soon' | 'monitor' | 'adequate' {
  const ratio = currentStock / predictedDemand;
  
  if (ratio < 0.3) return 'order_now';
  if (ratio < 0.5) return 'order_soon';
  if (ratio < 1.0) return 'monitor';
  return 'adequate';
}

function getCurrentStock(itemId: number): number {
  const query = `SELECT current_stock FROM items WHERE id = ?`;
  const result = db.prepare(query).get(itemId) as { current_stock: number } | undefined;
  return result?.current_stock ?? 0;
}

export function generateItemForecast(item: { id: number; item_code: string; item_name: string; category: string }): ForecastResult {
  const sales = getHistoricalSales(item.id, 12);
  
  const monthlyAvg = calculateWMA(sales);
  const nextWeek = Math.round(monthlyAvg / 4);
  const nextMonth = Math.round(monthlyAvg);
  const nextQuarter = Math.round(monthlyAvg * 3);
  
  const { direction, percentage } = detectTrend(sales);
  const confidence = calculateConfidence(sales);
  const currentStock = getCurrentStock(item.id);
  const recommendation = getRecommendation(currentStock, nextMonth);
  
  return {
    itemId: item.id,
    itemCode: item.item_code,
    itemName: item.item_name,
    category: item.category || 'Uncategorized',
    currentStock,
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

export function generateAllForecasts(): ForecastResult[] {
  const items = db.prepare(`
    SELECT id, item_code, item_name, category 
    FROM items 
    WHERE is_finished_good = 1 AND is_active = 1
  `).all() as { id: number; item_code: string; item_name: string; category: string }[];
  
  return items.map(generateItemForecast);
}

export function getDashboardData(): ForecastDashboardData {
  const forecasts = generateAllForecasts();
  
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
    .sort((a, b) => (a.currentStock / a.predictedDemand) - (b.currentStock / b.predictedDemand));
  
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
    ? `SELECT strftime('%Y-%m', sale_date) as month, SUM(quantity) as total
       FROM sales
       WHERE item_id = ? AND sale_date >= date('now', '-12 months')
       GROUP BY month ORDER BY month ASC`
    : `SELECT strftime('%Y-%m', sale_date) as month, SUM(quantity) as total
       FROM sales
       WHERE sale_date >= date('now', '-12 months')
       GROUP BY month ORDER BY month ASC`;
  
  const monthlyData = itemId 
    ? db.prepare(monthlySalesQuery).all(itemId) as { month: string; total: number }[]
    : db.prepare(monthlySalesQuery).all() as { month: string; total: number }[];
  
  const historicalTrends: MonthlySaleData[] = monthlyData.map(m => ({
    month: m.month,
    actual: m.total,
    predicted: null
  }));
  
  const totals = historicalTrends.map(t => t.actual || 0);
  for (let i = 2; i < historicalTrends.length; i++) {
    const window = totals.slice(i - 2, i + 1);
    historicalTrends[i].predicted = Math.round(calculateWMA(window));
  }
  
  const itemBreakdown = items.map(item => {
    const sales = getHistoricalSales(item.id, 12);
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
