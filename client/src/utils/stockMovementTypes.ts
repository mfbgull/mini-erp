export interface StockMovement {
  id: number;
  movement_no: string;
  movement_date: string;
  item_code?: string;
  item_name?: string;
  warehouse_name?: string;
  movement_type: string;
  quantity: number;
  unit_of_measure?: string;
  remarks?: string;
  batch_no?: string;
  unit_cost?: number;
  item_id?: number;
  warehouse_id?: number;
}

export interface StockMovementFormData {
  from_warehouse_id: string;
  to_warehouse_id: string;
  movement_date: string;
  remarks: string;
}

export interface LineItem {
  item_id: string;
  quantity: number;
  available_stock: number;
}

export interface Warehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
}

export interface InventoryItem {
  id: number;
  item_code: string;
  item_name: string;
  unit_of_measure?: string;
  standard_cost?: number;
}

export interface StockBalance {
  item_id: number;
  warehouse_id: number;
  quantity: number;
}
