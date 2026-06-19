import type { PurchaseOrder } from './purchaseOrderTypes';

export interface PurchaseOrderDetail extends PurchaseOrder {
  supplier_address?: string | null;
  supplier_phone?: string | null;
  supplier_email?: string | null;
  warehouse_id?: number;
}

export interface PurchaseOrderDetailItem {
  id: number;
  item_code: string;
  item_name: string;
  description?: string | null;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
  amount?: number;
  received_quantity?: number;
  returned_quantity?: number;
}

export interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface WarehouseOption {
  id: number;
  name: string;
}

export interface ReceiptItem {
  po_item_id: number;
  received_quantity: number;
}

export interface ReturnItem {
  po_item_id: number;
  return_quantity: number;
}

export interface ReceiptData {
  receipt_date: string;
  warehouse_id: number;
  remarks?: string;
  items: ReceiptItem[];
}

export interface ReturnData {
  items: ReturnItem[];
  reason?: string;
}

export interface PrintPOItem {
  item_name: string | null;
  item_code: string | null;
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  amount: number | null;
  received_quantity: number | null;
  unit_of_measure: string | null;
}
