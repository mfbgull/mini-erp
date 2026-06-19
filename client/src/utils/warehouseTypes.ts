export interface Warehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
  location?: string;
  description?: string;
  is_active?: boolean;
}

export interface WarehouseFormData {
  warehouse_code: string;
  warehouse_name: string;
  location: string;
  description: string;
}
