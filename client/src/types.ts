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
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id?: number;
  item_id: number;
  item_name: string;
  quantity: number;
  rate: number;
  amount: number;
}

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

export interface Item {
  id: number;
  item_code: string;
  item_name: string;
  description?: string;
  unit_of_measure: string;
  unit_price: number;
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