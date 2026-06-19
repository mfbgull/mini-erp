export interface POSItem {
  id: number;
  item_code: string;
  item_name: string;
  current_stock: number;
  unit_of_measure: string;
  standard_selling_price: number;
  is_active: boolean | number;
  is_raw_material: boolean | number;
  is_finished_good: boolean | number;
  is_purchased: boolean | number;
  category?: string;
}

export interface CartItem {
  id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  unit_of_measure: string;
  quantity: number;
  unit_price: number;
  available_stock: number;
  line_total: number;
}

export interface PaymentMethod {
  id: number;
  method: string;
  amount: string;
  reference_no: string;
}

export interface POSWarehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
}
