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
  movingAvg?: number | null;
}

export interface TrendData {
  historicalTrends: MonthlySaleData[];
  itemBreakdown: {
    itemName: string;
    totalSold: number;
    trend: 'growing' | 'stable' | 'declining';
  }[];
}

// ============ Stock Balance Types ============
export interface StockBalance {
  id: number;
  item_id: number;
  warehouse_id: number;
  quantity: number;
  last_updated: string;
}

// ============ Warehouse Types ============
export interface Warehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

// ============ Sales Order Types ============
export interface SalesOrder {
  id: number;
  so_no: string;
  customer_id: number;
  customer_name?: string;
  warehouse_id: number;
  order_date: string;
  expected_delivery_date?: string;
  status: 'Draft' | 'Confirmed' | 'Partial' | 'Completed' | 'Cancelled';
  total_amount: number;
  discount_scope?: 'item' | 'invoice';
  discount_type?: 'flat' | 'percentage';
  discount_value?: number;
  notes?: string;
  terms?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  source_id?: number;
  source_type?: string;
}

export interface SalesOrderWithWarehouse extends SalesOrder {
  warehouse_code?: string;
  warehouse_name?: string;
  created_by_username?: string;
}

// ============ Quotation Types ============
export interface Quotation {
  id: number;
  quotation_no: string;
  customer_id: number;
  customer_name?: string;
  warehouse_id: number;
  quotation_date: string;
  valid_until?: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  total_amount: number;
  discount_scope?: 'item' | 'invoice';
  discount_type?: 'flat' | 'percentage';
  discount_value?: number;
  notes?: string;
  terms?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  source_id?: number;
  source_type?: string;
}

export interface QuotationWithWarehouse extends Quotation {
  warehouse_code?: string;
  warehouse_name?: string;
  created_by_username?: string;
}

// ============ Invoice Types (Extended) ============
export interface InvoiceWithUsername extends Invoice {
  created_by_username?: string;
}

// ============ Pricing Summary Types ============
export interface PricingSummary {
  customer_name: string;
  transaction_count: number;
  lowest_price: number;
  highest_price: number;
  avg_price: number;
}

export interface LastSale {
  last_invoice_id?: string;
  invoice_date?: string;
  last_price?: number;
}

// ============ Integration Service Types ============
export interface Setting {
  key: string;
  value: string;
}

export interface TaxRate {
  rate: number;
  state?: string;
  zip?: string;
  country?: string;
  name?: string;
}

export interface TaxCalculation {
  amount: number;
  rate: number;
  tax: number;
  jurisdiction: string;
}

export interface TaxJarResponse {
  error?: string;
  tax?: TaxCalculation;
  validation?: any;
  categories?: Array<{ name: string }>;
}

export interface FixerResponse {
  success?: boolean;
  error?: { info: string };
  base?: string;
  date?: string;
  rates?: Record<string, number>;
}

export interface WeatherResponse {
  error?: { info: string };
  main?: { temp: number; humidity: number };
  weather?: Array<{ description: string }>;
  name?: string;
}

export interface NotificationResponse {
  success?: boolean;
  message?: string;
}

export interface EmailResponse {
  success?: boolean;
  message?: string;
  messageId?: string;
}

export interface NumverifyResponse {
  success?: boolean;
  valid?: boolean;
  error?: { info: string };
  number?: {
    country_code: string;
    country_name: string;
    location: string;
    carrier: string;
    line_type: string;
  };
}

// ============ Report Types ============
export interface ReceivablesSummary {
  total_invoices: number;
  total_outstanding: number;
  total_paid: number;
  unpaid_count: number;
  partial_count: number;
  unused_overdue_count: number;
  overdue_amount?: number;
  total_current?: number;
  total_1_30?: number;
  total_31_60?: number;
  total_61_90?: number;
  total_over_90?: number;
  statusBreakdown?: {
    unpaid: { count: number; amount: number };
    partiallyPaid: { count: number; amount: number };
    overdue: { count: number; amount: number };
  };
}

export interface SalesSummary {
  total_invoices: number;
  total_revenue: number;
  unique_customers: number;
  unique_items: number;
  avg_invoice_value: number;
}

// ============ Batch Costing Types ============
export interface StockBatch {
  id: number;
  batch_no: string;
  item_id: number;
  warehouse_id: number;
  source_type: 'PRODUCTION' | 'PURCHASE';
  source_id: number;
  quantity_original: number;
  quantity_remaining: number;
  unit_cost: number;
  received_date: string;
  created_at?: string;
  // Joined fields
  item_code?: string;
  item_name?: string;
  warehouse_code?: string;
  warehouse_name?: string;
  source_no?: string; // production_no or purchase_no
}

export interface BatchSummary {
  batch_no: string;
  item_id: number;
  item_code: string;
  item_name: string;
  warehouse_name: string;
  source_type: string;
  source_no: string;
  quantity_original: number;
  quantity_remaining: number;
  unit_cost: number;
  total_value: number;
  received_date: string;
}

// ============ Activity Log Types ============
export interface ActivityLogDbEntry {
  id: number;
  user_id: number | null;
  username?: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string;
  metadata: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface ActivityStat {
  action?: string;
  count?: number;
  username?: string;
  date?: string;
}
