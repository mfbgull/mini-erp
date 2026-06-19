export interface Quotation {
  id: number;
  quotation_no: string;
  quotation_date: string;
  customer_name: string;
  expiry_date?: string;
  total_amount: number | string;
  status: string;
}

export interface QuotationTotals {
  count: number;
  total: number;
  draft: number;
  sent: number;
  converted: number;
}

/* ── Quotation Form Types ───────────────────────────────────────── */

export interface QuotationFormItem {
  id: number;
  item_id: number;
  description: string;
  quantity: number;
  rate: number;
  tax: number;
  discount: {
    type: 'percentage' | 'flat';
    value: number;
  };
}

export interface CustomerOption {
  id?: number;
  customer_name: string;
  customer_code?: string;
  email?: string;
  phone?: string;
}

export interface InventoryItemOption {
  id: number;
  item_name: string;
  item_code: string;
  current_stock: number;
  standard_selling_price?: number;
}

export interface QuotationSubmitData {
  customer_id: number;
  quotation_date: string;
  expiry_date: string;
  status: string;
  notes: string;
  terms: string;
  items: Array<{
    item_id: number;
    description: string;
    quantity: number;
    rate: number;
    tax: number;
    discount_type: string;
    discount_value: number;
  }>;
}

/* ── Component Props ────────────────────────────────────────────── */

export interface QuotationEditableCellProps {
  value: string | number;
  itemId: number;
  field: string;
  type?: string;
  isLastItem: boolean;
  items: QuotationFormItem[];
  fieldOrder?: readonly string[];
  editingCell: string | null;
  onEditingCell: (cell: string | null) => void;
  onUpdateItem: (itemId: number, field: string, value: string | number) => void;
  onAddNewItem: () => number;
  getNextField: (field: string) => string | undefined;
  isLastField: (field: string) => boolean;
}

export interface QuotationFormHeaderProps {
  customer: CustomerOption | null;
  customers: CustomerOption[];
  quotationDate: string;
  expiryDate: string;
  status: string;
  company: { name: string; email: string; phone: string };
  totalAmount: number;
  formatCurrency: (amount: number | string) => string;
  isEditMode: boolean;
  isSaving: boolean;
  id?: number;
  children?: React.ReactNode;
  onSelectCustomer: (customer: CustomerOption) => void;
  onUpdateQuotationDate: (date: string) => void;
  onUpdateExpiryDate: (date: string) => void;
  onUpdateStatus: (status: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export interface QuotationItemsTableProps {
  items: QuotationFormItem[];
  editingCell: string | null;
  inventoryItems: InventoryItemOption[];
  formatCurrency: (amount: number | string) => string;
  getCurrencySymbol: () => string;
  notes: string;
  terms: string;
  calculateSubtotal: () => number;
  calculateDiscount: () => number;
  calculateTax: () => number;
  calculateTotal: () => number;
  calculateItemTotal: (item: QuotationFormItem) => number;
  onUpdateItem: (itemId: number, field: string, value: string | number) => void;
  onRemoveItem: (itemId: number) => void;
  onAddNewItem: () => number;
  onUpdateNotes: (notes: string) => void;
  onUpdateTerms: (terms: string) => void;
  onEditingCell: (cell: string | null) => void;
  tableContainerRef: React.RefObject<HTMLDivElement>;
  lastFocusedCellRef: React.MutableRefObject<string>;
}

export interface QuotationMobileWizardProps {
  customer: CustomerOption | null;
  customers: CustomerOption[];
  items: QuotationFormItem[];
  inventoryItems: InventoryItemOption[];
  quotationDate: string;
  expiryDate: string;
  status: string;
  notes: string;
  terms: string;
  currentStep: number;
  isEditMode: boolean;
  isSaving: boolean;
  formatCurrency: (amount: number | string) => string;
  calculateItemTotal: (item: QuotationFormItem) => number;
  calculateSubtotal: () => number;
  calculateDiscount: () => number;
  calculateTax: () => number;
  calculateTotal: () => number;
  onSelectCustomer: (customer: CustomerOption) => void;
  onUpdateQuotationDate: (date: string) => void;
  onUpdateExpiryDate: (date: string) => void;
  onUpdateStatus: (status: string) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateTerms: (terms: string) => void;
  onAddItem: (item: QuotationFormItem) => void;
  onRemoveItem: (itemId: number) => void;
  onStepChange: (step: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
}
