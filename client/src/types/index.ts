// Core entity types for MiniERP

// ============ Customer Types ============
export interface Customer {
  id: number;
  customer_name: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  shipping_address?: string;
  credit_limit?: number;
  current_balance?: number;
  created_at?: string;
  updated_at?: string;
}

// ============ Item/Inventory Types ============
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
  is_raw_material?: boolean;
  is_finished_good?: boolean;
  is_purchased?: boolean;
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

export type DiscountType = 'flat' | 'percentage';

export interface Discount {
  type: DiscountType;
  value: number;
}

export interface InvoiceItem {
  id: number;
  item_id: number | string;
  description: string;
  quantity: number;
  rate: number;
  tax: number;
  discount: Discount;
}

export interface InvoicePayment {
  record_payment: boolean;
  payment_date: string;
  payment_amount: number;
  payment_method: string;
  reference_no?: string;
  payment_notes?: string;
}

export interface Invoice {
  id?: number;
  invoice_no: string;
  customer_id: number | string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_current_balance?: number;
  customer_credit_limit?: number;
  customer_credit_utilization?: number;
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
  discountScope: 'item' | 'invoice';
  discount: Discount;
  total_amount: number;
  paid_amount?: number;
  balance_amount?: number;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  created_by?: number;
  company?: CompanyInfo;
  payment: InvoicePayment;
  paymentMethods?: PaymentMethod[];
}

export interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
}

export interface PaymentMethod {
  id: number;
  method: string;
  amount: number;
  reference_no?: string;
}

// ============ Payment Types ============
export interface Payment {
  id: number;
  customer_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_no?: string;
  notes?: string;
  created_at?: string;
}

// ============ BOM Types ============
export interface BOMItem {
  id?: number;
  item_id: number | string;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
  current_stock?: number;
  quantity: number;
}

export interface BOM {
  id: number;
  bom_no: string;
  bom_name: string;
  finished_item_id: number;
  finished_item_code?: string;
  finished_item_name?: string;
  finished_uom?: string;
  quantity: number;
  description?: string;
  is_active: boolean;
  items: BOMItem[];
  item_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ============ Production Types ============
export interface Production {
  id: number;
  production_no: string;
  bom_id: number;
  bom_name?: string;
  finished_item_id: number;
  finished_item_name?: string;
  quantity_to_produce: number;
  quantity_produced?: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  production_date: string;
  notes?: string;
  created_at?: string;
}

// ============ Price History Types ============
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

// ============ Form/UI Types ============
export interface SelectOption {
  value: string | number;
  label: string;
  subtitle?: string;
}

export interface TableColumn<T> {
  headerName: string;
  field: keyof T | string;
  sortable?: boolean;
  filter?: boolean | string;
  flex?: number;
  minWidth?: number;
  valueFormatter?: (params: { value: any; data: T }) => string;
  cellRenderer?: (params: { value: any; data: T }) => React.ReactNode;
}
