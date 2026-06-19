export interface BOMListItem {
  id: number;
  bom_no: string;
  bom_name: string;
  finished_item_id: number;
  finished_item_name: string;
  finished_item_code?: string;
  quantity: number;
  finished_uom: string;
  is_active: boolean | number;
  item_count?: number;
  total_material_cost?: number;
  description?: string;
  items?: BOMItemData[];
  created_at?: string;
  updated_at?: string;
}

export interface BOMItemData {
  id: number;
  item_id?: number;
  item_name: string;
  item_code: string;
  quantity: number;
  unit_of_measure: string;
  standard_cost?: number;
  line_cost?: number;
  current_stock?: number;
}

export interface BOMFormData {
  bom_name: string;
  finished_item_id: string;
  quantity: string | number;
  description: string;
}

export interface BOMItemFormEntry {
  item_id: string;
  quantity: string;
}

export interface BOMStats {
  totalBOMs: number;
  activeBOMs: number;
  uniqueFinishedGoods: number;
}

export interface BOMDetail {
  id: number;
  bom_no: string;
  bom_name: string;
  finished_item_name: string;
  finished_item_code?: string;
  quantity: number;
  finished_uom: string;
  is_active: boolean | number;
  description?: string;
  total_material_cost?: number;
  items: BOMItemData[];
  created_at?: string;
  updated_at?: string;
}
