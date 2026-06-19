// ============================================
// Production Types
// ============================================

export interface ProductionRecord {
  id: number;
  production_no: string;
  production_date: string;
  output_item_id: number;
  output_item_name: string;
  output_quantity: number;
  output_uom: string;
  finished_goods_warehouse_id: number;
  finished_goods_warehouse_name: string;
  raw_materials_warehouse_id?: number;
  raw_materials_warehouse_name?: string;
  bom_id?: number;
  total_material_cost?: number;
  overhead_cost?: number;
  remarks?: string;
  status?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  inputs?: ProductionInput[];
}

export interface ProductionInput {
  item_id: number;
  item_name: string;
  quantity: number;
  unit_of_measure: string;
  unit_cost?: number;
}

export interface ProductionStub {
  id: number;
  production_no: string;
  production_date: string;
  output_item_name: string;
  output_quantity: number;
  output_uom: string;
  finished_goods_warehouse_name: string;
  remarks?: string;
}

// Form state
export interface ProductionFormData {
  output_item_id: string;
  output_quantity: string;
  warehouse_id: string;
  raw_materials_warehouse_id: string;
  production_date: string;
  remarks: string;
  overhead_cost: string;
}

// Calculated input item (from BOM)
export interface CalculatedInputItem {
  item_id: number | string;
  quantity: number;
}

// Cost preview
export interface CostPreview {
  materialCost: number;
  overhead: number;
  totalCost: number;
  costPerUnit: number;
}

// Submit payload
export interface ProductionSubmitPayload {
  output_item_id: number;
  output_quantity: number;
  warehouse_id: number;
  raw_materials_warehouse_id: number | null;
  production_date: string;
  bom_id: number | null;
  remarks: string | null;
  overhead_cost: number;
  input_items: Array<{ item_id: number; quantity: number }>;
}

// BOM
export interface BOMRecord {
  id: number;
  bom_name?: string;
  finished_item_id: number;
  finished_item_name?: string;
  is_active?: boolean;
  items?: Array<{
    item_id: number;
    item_name?: string;
    quantity: number;
  }>;
}

// Inventory item (for stock check)
export interface StockItem {
  id: number;
  item_name: string;
  item_code: string;
  current_stock?: number;
  unit_of_measure?: string;
  is_raw_material?: boolean;
  is_finished_good?: boolean;
  standard_cost?: number;
  warehouse_balances?: Array<{
    warehouse_id: number;
    quantity: number;
  }>;
}

// Warehouse
export interface Warehouse {
  id: number;
  warehouse_code?: string;
  warehouse_name?: string;
  name?: string;
}

// Insufficient material for validation
export interface InsufficientMaterial {
  name: string;
  available: number;
  required: number;
  uom?: string;
}
