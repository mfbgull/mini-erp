export interface InventoryItem {
  id: number;
  item_code: string;
  item_name: string;
  description?: string;
  category?: string;
  unit_of_measure: string;
  current_stock: number;
  standard_cost: number;
  standard_selling_price: number;
  reorder_level: number;
  is_raw_material: boolean | number;
  is_finished_good: boolean | number;
  is_purchased: boolean | number;
  is_manufactured: boolean | number;
  warehouse_id?: number;
  warehouse?: string;
}

export interface ItemFormData {
  item_code: string;
  item_name: string;
  description: string;
  category: string;
  unit_of_measure: string;
  reorder_level: number;
  standard_cost: number;
  standard_selling_price: number;
  is_raw_material: boolean | number;
  is_finished_good: boolean | number;
  is_purchased: boolean | number;
  is_manufactured: boolean | number;
}

export interface ItemStats {
  totalItems: number;
  totalStockValue: number;
  totalStock: number;
  lowStockAlerts: number;
  outOfStock: number;
  categories: number;
  rawMaterials: number;
  finishedGoods: number;
}
