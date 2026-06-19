export interface PurchaseOrder {
  id: number;
  po_no: string;
  po_date: string;
  supplier_name: string;
  warehouse_name?: string;
  total_amount?: number | string;
  status: string;
  expected_delivery_date?: string;
  created_by_username?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  item_code: string;
  item_name: string;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
  received_quantity?: number;
}

export interface PurchaseOrderStats {
  total: number;
  draft: number;
  submitted: number;
  partial: number;
  completed: number;
  totalValue: number;
}

/* ── PO Form & Detail Types ─────────────────────────────────────── */

export interface SupplierOption {
  id?: number;
  supplier_name: string;
  supplier_code?: string;
  email?: string;
  phone?: string;
}

export interface WarehouseOption {
  id: number | string;
  warehouse_name?: string;
  warehouse_code?: string;
  name?: string;
}

export interface POFormItem {
  id: number;
  item_id?: number | string;
  itemId?: number;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface POSubmitData {
  supplier_id: number | undefined;
  po_date: string;
  expected_delivery_date: string;      warehouse_id: number | string | undefined;
  status: string;
  notes: string;
  items: Array<{
    item_id: number;
    quantity: number;
    unit_price: number;
  }>;
}

/* ── Component Props ────────────────────────────────────────────── */

export interface InventoryItemOption {
  id: number;
  item_name: string;
  item_code: string;
  is_purchased?: boolean;
  is_raw_material?: boolean;
  is_manufactured?: boolean;
  current_stock?: number;
  standard_cost?: number;
  purchase_price?: number;
  standard_selling_price?: number;
}

export interface POEditableCellProps {
  value: string | number;
  itemId: number;
  field: string;
  type?: string;
  isLastItem: boolean;
  items: POFormItem[];
  fieldOrder?: readonly string[];
  editingCell: string | null;
  onEditingCell: (cell: string | null) => void;
  onUpdateItem: (itemId: number, field: string, value: string | number) => void;
  onAddNewItem: () => number;
  getNextField: (field: string) => string | undefined;
  isLastField: (field: string) => boolean;
}

export interface POFormHeaderProps {
  supplier: SupplierOption | null;
  suppliers: SupplierOption[];
  poDate: string;
  deliveryDate: string;
  status: string;
  warehouseId: string;
  warehouses: WarehouseOption[];
  company: { name: string; email: string; phone: string };
  totalAmount: number;
  formatCurrency: (amount: number | string) => string;
  isEditMode: boolean;
  isSaving: boolean;
  id?: number;
  children?: React.ReactNode;
  onSelectSupplier: (supplier: SupplierOption) => void;
  onUpdatePoDate: (date: string) => void;
  onUpdateDeliveryDate: (date: string) => void;
  onUpdateStatus: (status: string) => void;
  onUpdateWarehouse: (warehouseId: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export interface POItemsTableProps {
  items: POFormItem[];
  editingCell: string | null;
  inventoryItems: InventoryItemOption[];
  formatCurrency: (amount: number | string) => string;
  notes: string;
  calculateSubtotal: () => number;
  calculateTotal: () => number;
  calculateItemTotal: (item: POFormItem) => number;
  onUpdateItem: (itemId: number, field: string, value: string | number) => void;
  onRemoveItem: (itemId: number) => void;
  onAddNewItem: () => number;
  onUpdateNotes: (notes: string) => void;
  onEditingCell: (cell: string | null) => void;
  tableContainerRef: React.RefObject<HTMLDivElement>;
  lastFocusedCellRef: React.MutableRefObject<string>;
}

export interface POMobileFormProps {
  supplier: SupplierOption | null;
  suppliers: SupplierOption[];
  items: POFormItem[];
  inventoryItems: InventoryItemOption[];
  poDate: string;
  deliveryDate: string;
  status: string;
  warehouseId: string;
  warehouses: WarehouseOption[];
  notes: string;
  isEditMode: boolean;
  isSaving: boolean;
  formatCurrency: (amount: number | string) => string;
  calculateItemTotal: (item: POFormItem) => number;
  calculateSubtotal: () => number;
  calculateTotal: () => number;
  onSelectSupplier: (supplier: SupplierOption) => void;
  onUpdatePoDate: (date: string) => void;
  onUpdateDeliveryDate: (date: string) => void;
  onUpdateStatus: (status: string) => void;
  onUpdateWarehouse: (warehouseId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateItem: (itemId: number, field: string, value: string | number) => void;
  onAddNewItem: () => number;
  onRemoveItem: (itemId: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
}
