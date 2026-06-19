export interface Purchase {
  id: number;
  purchase_no: string;
  purchase_date: string;
  item_id: number;
  item_name: string;
  item_code?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier_name?: string;
  warehouse_name?: string;
  unit_of_measure?: string;
  invoice_no?: string;
  remarks?: string;
  status?: string;
}

export interface PurchaseFormData {
  item_id: string;
  warehouse_id: string;
  quantity: string;
  unit_cost: string;
  supplier_name: string;
  purchase_date: string;
  invoice_no: string;
  remarks: string;
}

export interface PurchaseStats {
  totalPurchases: number;
  totalValue: number;
  totalQuantity: number;
  uniqueSuppliers: number;
  uniqueItems: number;
  averagePurchaseValue: number;
  largestPurchase: { total_cost: number; purchase_date: string; purchase_no?: string };
  recentPurchases: number;
}
