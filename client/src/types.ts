/* ── CRM / Customers ─────────────────────────────────────────────── */

export interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  contact_person?: string;
  email?: string;
  phone: string;
  billing_address?: string;
  shipping_address?: string;
  payment_terms?: string;
  payment_terms_days: number;
  credit_limit: number;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
}

/* ── Inventory ──────────────────────────────────────────────────── */

export interface Item {
  id: number;
  item_code: string;
  item_name: string;
  description?: string;
  unit_of_measure: string;
  unit_price: number;
  /** Also known as standard selling price (used by InvoiceWizard etc.) */
  standard_price?: number;
  /** Cost price fields (used by PurchaseOrderWizard etc.) */
  standard_cost?: number;
  purchase_price?: number;
  current_stock: number;
  reorder_level: number;
  is_active: boolean;
}

export interface Warehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
  location?: string;
  is_active: boolean;
}

export interface StockByWarehouse {
  id: number;
  item_id: number;
  item_name: string;
  warehouse_id: number;
  warehouse_name: string;
  quantity: number;
}

/* ── Purchasing ─────────────────────────────────────────────────── */

export interface Purchase {
  id: number;
  purchase_no: string;
  purchase_date: string;
  item_id: number;
  item_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier_name?: string;
  warehouse_id: number;
  warehouse_name?: string;
}

export interface PurchaseOrderItem {
  id?: number;
  item_id: number;
  item_name: string;
  item_code: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface Supplier {
  id: number;
  supplier_code: string;
  supplier_name: string;
  contact_person?: string;
  email?: string;
  phone: string;
  address?: string;
  payment_terms?: string;
  is_active: boolean;
}

/* ── Activity Log ───────────────────────────────────────────────── */

export interface Activity {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  description: string;
  user_id: number;
  username: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

/* ── Invoicing (API-level types) ────────────────────────────────── */

export interface Invoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  customer_id: number;
  customer_name: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
}

export interface InvoiceItem {
  id?: number;
  item_id: number;
  item_name: string;
  quantity: number;
  rate: number;
  amount: number;
  item_code?: string;
  unit_price?: number;
  total?: number;
  tax_id?: number;
  tax_rate?: number;
  tax_amount?: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface TaxRate {
  id: number;
  tax_name: string;
  tax_rate: number;
  is_active: boolean;
}

/* ── Auth ───────────────────────────────────────────────────────── */

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  full_name?: string;
}

/* ── Sales Returns / POS ────────────────────────────────────────── */

export interface SalesReturn {
  id: number;
  return_no: string;
  invoice_id: number;
  invoice_no: string;
  customer_id: number;
  customer_name: string;
  return_date: string;
  total_amount: number;
  reason: string;
  status: string;
}

/* ── API Generic ────────────────────────────────────────────────── */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  response?: {
    data?: { error?: string; message?: string };
    status?: number;
  };
}

/* ── Production / BOM ───────────────────────────────────────────── */

export interface ProductionOrder {
  id: number;
  production_no: string;
  item_id: number;
  item_name: string;
  quantity: number;
  start_date: string;
  end_date?: string;
  status: string;
  notes?: string;
}

export interface BOM {
  id: number;
  item_id: number;
  item_name: string;
  component_id: number;
  component_name: string;
  quantity: number;
  unit_of_measure: string;
}
