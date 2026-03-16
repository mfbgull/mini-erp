import { Request } from 'express';

// ============ Auth Types ============
export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// ============ Customer Types ============
export interface Customer {
  id: number;
  customer_name: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  shipping_address?: string;
  credit_limit?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCustomerDTO {
  customer_name: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  shipping_address?: string;
  credit_limit?: number;
}

// ============ Item Types ============
export interface Item {
  id: number;
  item_code: string;
  item_name: string;
  description?: string;
  category?: string;
  unit_of_measure: string;
  current_stock: number;
  reorder_level?: number;
  standard_selling_price?: number;
  standard_cost?: number;
  is_raw_material: boolean;
  is_finished_good: boolean;
  is_purchased: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============ Invoice Types ============
export type InvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Unpaid'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled';

export interface InvoiceItemDTO {
  item_id: number;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  discount_type?: 'flat' | 'percentage';
  discount_value?: number;
  warehouse_id?: number;
}

export interface PaymentDTO {
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_no?: string;
  notes?: string;
}

export interface CreateInvoiceDTO {
  invoice_no?: string;
  customer_id: number;
  invoice_date: string;
  due_date: string;
  status?: InvoiceStatus;
  discount_scope?: 'item' | 'invoice';
  discount_type?: 'flat' | 'percentage';
  discount_value?: number;
  items: InvoiceItemDTO[];
  notes?: string;
  terms?: string;
  total_amount: number;
  record_payment?: boolean;
  payment?: PaymentDTO;
}

export interface Invoice {
  id: number;
  invoice_no: string;
  customer_id: number;
  customer_name?: string;
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
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
}

// ============ BOM Types ============
export interface BOMItemDTO {
  item_id: number;
  quantity: number;
}

export interface CreateBOMDTO {
  bom_name: string;
  finished_item_id: number;
  quantity: number;
  description?: string;
  items: BOMItemDTO[];
}

export interface BOM {
  id: number;
  bom_no: string;
  bom_name: string;
  finished_item_id: number;
  finished_item_name?: string;
  quantity: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============ Sale Types ============
export interface Sale {
  id: number;
  sale_date: string;
  customer_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  invoice_id?: number;
  created_by?: number;
  created_at?: string;
}

export interface PriceHistory {
  customer_name: string;
  transaction_count: number;
  lowest_price: number;
  highest_price: number;
  avg_price: number;
  last_price: number;
  last_invoice_id?: string;
  invoice_date?: string;
}

// ============ API Response Types ============
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============ Database Types ============
export interface DatabaseResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

// ============ Forecast Types ============
export interface DemandForecast {
  id: number;
  item_id: number;
  forecast_date: string;
  period: 'next_week' | 'next_month' | 'next_quarter';
  predicted_quantity: number;
  confidence_level: number;
  trend_direction: 'growing' | 'stable' | 'declining';
  trend_percentage: number;
  model_type: string;
  created_at: string;
  updated_at: string;
}

export interface ForecastResult {
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  currentStock: number;
  predictedDemand: {
    nextWeek: number;
    nextMonth: number;
    nextQuarter: number;
  };
  trend: 'growing' | 'stable' | 'declining';
  trendPercentage: number;
  confidence: number;
  recommendation: 'order_now' | 'order_soon' | 'monitor' | 'adequate';
  lastUpdated: string;
}

export interface ForecastDashboardData {
  summary: {
    totalItems: number;
    itemsNeedingRestock: number;
    avgConfidence: number;
    criticalAlerts: number;
  };
  alerts: ForecastAlert[];
  topGrowing: ForecastResult[];
  topDeclining: ForecastResult[];
}

export interface ForecastAlert {
  itemId: number;
  itemName: string;
  currentStock: number;
  predictedDemand: number;
  alertLevel: 'critical' | 'warning' | 'monitor' | 'adequate';
  recommendation: string;
}

export interface MonthlySaleData {
  month: string;
  actual: number | null;
  predicted: number | null;
}

export interface TrendData {
  historicalTrends: MonthlySaleData[];
  itemBreakdown: {
    itemName: string;
    totalSold: number;
    trend: 'growing' | 'stable' | 'declining';
  }[];
}
