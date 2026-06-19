/* ── Sales Order Page Types ─────────────────────────────────────── */

/* ── Enums / Const arrays ────────────────────────────────────────── */

export const SO_STATUSES = ['Draft', 'Confirmed', 'Invoiced', 'Completed', 'Cancelled'] as const;
export type SalesOrderStatus = typeof SO_STATUSES[number];

export const DISCOUNT_TYPES = ['flat', 'percentage'] as const;
export type DiscountType = typeof DISCOUNT_TYPES[number];

/* ── Core Data Types ────────────────────────────────────────────── */

export interface Discount {
  type: DiscountType;
  value: number;
}

export interface SOFormItem {
  id: number;
  item_id: number | string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: Discount;
}

export interface SOCompany {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface SelectedCustomer {
  id: number;
  customer_name: string;
  email?: string;
  phone?: string;
  billing_address?: string;
}

/* ── Component Props ────────────────────────────────────────────── */

export interface SOFormHeaderProps {
  customer: SelectedCustomer | null;
  soDate: string;
  deliveryDate: string;
  status: string;
  warehouseId: string;
  customers: Array<{ id: number; customer_name: string; customer_code?: string; email?: string; phone?: string }>;
  warehouses: Array<{ id: number; warehouse_name?: string; name?: string }>;
  company: SOCompany;
  mutationPending: boolean;
  id: string | undefined;
  formatCurrency: (amount: number | string | null | undefined) => string;
  calculateTotal: () => number;
  onSelectCustomer: (customer: SelectedCustomer) => void;
  onSetSoDate: (date: string) => void;
  onSetDeliveryDate: (date: string) => void;
  onSetStatus: (status: string) => void;
  onSetWarehouseId: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onPreview?: () => void;
}

export interface SOSearchableCellProps {
  value: string;
  itemId: number;
  inventoryItems: Array<{ id: number; item_name: string; item_code: string; current_stock?: number; standard_selling_price?: number; is_raw_material?: boolean | number; is_finished_good?: boolean | number; is_purchased?: boolean | number }>;
  soItems: SOFormItem[];
  isLastItem: boolean;
  editingCell: string | null;
  onSetEditingCell: (cellId: string | null) => void;
  onUpdateItem: (id: number, field: string, value: unknown) => void;
  onAddNewItem: () => number;
  onSetPendingFocus: (itemId: number) => void;
  formatCurrency: (amount: number | string | null | undefined) => string;
  getNextField: (field: string) => string | undefined;
  isLastField: (field: string) => boolean;
}

export interface SOEditableCellProps {
  value: string | number;
  itemId: number;
  field: string;
  type?: string;
  isLastItem: boolean;
  editingCell: string | null;
  items: SOFormItem[];
  fieldOrder: readonly string[];
  onSetEditingCell: (cellId: string | null) => void;
  onUpdateItem: (id: number, field: string, value: unknown) => void;
  onAddNewItem: () => number;
  onSetPendingFocus: (itemId: number) => void;
  getNextField: (field: string) => string | undefined;
  isLastField: (field: string) => boolean;
}

export interface SOItemsTableProps {
  items: SOFormItem[];
  editingCell: string | null;
  inventoryItems: Array<{ id: number; item_name: string; item_code: string; current_stock?: number; standard_selling_price?: number; is_raw_material?: boolean | number; is_finished_good?: boolean | number; is_purchased?: boolean | number }>;
  notes: string;
  onSetNotes: (notes: string) => void;
  onSetEditingCell: (cellId: string | null) => void;
  onUpdateItem: (id: number, field: string, value: unknown) => void;
  onRemoveItem: (id: number) => void;
  onAddNewItem: () => number;
  onSetPendingFocus: (itemId: number) => void;
  onSetNewItemId: (id: number | null) => void;
  formatCurrency: (amount: number | string | null | undefined) => string;
  getCurrencySymbol: () => string;
  calculateItemTotal: (item: SOFormItem) => number;
  calculateSubtotal: () => number;
  calculateDiscount: () => number;
  calculateTax: () => number;
  calculateTotal: () => number;
  getNextField: (field: string, discountScope?: 'item' | 'invoice') => string | undefined;
  isLastField: (field: string) => boolean;
}

export interface SOMobileWizardProps {
  customer: SelectedCustomer | null;
  soDate: string;
  deliveryDate: string;
  status: string;
  warehouseId: string;
  notes: string;
  items: SOFormItem[];
  currentStep: number;
  customers: Array<{ id: number; customer_name: string; customer_code?: string; email?: string; phone?: string }>;
  warehouses: Array<{ id: number; warehouse_name?: string; name?: string }>;
  inventoryItems: Array<{ id: number; item_name: string; item_code: string; current_stock?: number; standard_selling_price?: number }>;
  mutationPending: boolean;
  id: string | undefined;
  formatCurrency: (amount: number | string | null | undefined) => string;
  calculateItemTotal: (item: SOFormItem) => number;
  calculateSubtotal: () => number;
  calculateDiscount: () => number;
  calculateTax: () => number;
  calculateTotal: () => number;
  onSelectCustomer: (customer: SelectedCustomer) => void;
  onSetSoDate: (date: string) => void;
  onSetDeliveryDate: (date: string) => void;
  onSetStatus: (status: string) => void;
  onSetWarehouseId: (id: string) => void;
  onSetNotes: (notes: string) => void;
  onSetCurrentStep: (step: number) => void;
  onAddItem: (item: SOFormItem) => void;
  onRemoveItem: (id: number) => void;
  onSubmit: () => void;
}

/* ── API Submission Types ───────────────────────────────────────── */

export interface SOSubmitItem {
  item_id: number | string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_type: string;
  discount_value: number;
}

export interface SOSubmitData {
  customer_id: number;
  customer_name: string;
  so_date: string;
  delivery_date?: string;
  status: string;
  notes: string;
  warehouse_id?: string;
  total_amount: number;
  items: SOSubmitItem[];
}
