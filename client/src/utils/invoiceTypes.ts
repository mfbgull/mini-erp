/* ── Sales Invoice Page Types ───────────────────────────────────── */
/* Domain-specific types — not shared broadly, kept in utils/         */

import type { ChangeEvent, KeyboardEvent, RefObject } from 'react';

/* ── Enums / Const arrays ────────────────────────────────────────── */

export const INVOICE_STATUSES = ['Draft', 'Sent', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'] as const;
export type InvoiceStatus = typeof INVOICE_STATUSES[number];

export const DISCOUNT_TYPES = ['flat', 'percentage'] as const;
export type DiscountType = typeof DISCOUNT_TYPES[number];

export const PAYMENT_METHOD_OPTIONS = ['Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Online Payment'] as const;
export type PaymentMethodOption = typeof PAYMENT_METHOD_OPTIONS[number];

/* ── Core Data Types ────────────────────────────────────────────── */

export interface Discount {
  type: DiscountType;
  value: number;
}

export interface InvoiceFormItem {
  id: number;
  item_id: number | string;
  description: string;
  quantity: number;
  rate: number;
  tax: number;
  discount: Discount;
}

export interface InvoiceCompany {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
}

export interface InvoiceFormPayment {
  record_payment: boolean;
  payment_date: string;
  payment_amount: number;
  payment_method: string;
  reference_no: string;
  payment_notes: string;
}

export interface PaymentMethodEntry {
  id: number;
  method: string;
  amount: number;
  reference_no: string;
}

export interface InvoiceFormState {
  invoice_no: string;
  status: InvoiceStatus | string;
  invoice_date: string;
  due_date: string;
  customer_id: number | string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_current_balance?: number;
  customer_credit_limit?: number;
  customer_credit_utilization?: number;
  discountScope: 'item' | 'invoice';
  discount: Discount;
  items: InvoiceFormItem[];
  notes: string;
  terms: string;
  created_by: number | null;
  company: InvoiceCompany;
  payment: InvoiceFormPayment;
  paymentMethods: PaymentMethodEntry[];
  id?: number;
  total_amount?: number;
  paid_amount?: number;
  balance_amount?: number;
}

export interface ExistingPayment {
  id: number;
  payment_date: string;
  payment_method: string;
  amount: number;
  reference_no?: string;
  notes?: string;
}

/* ── Price History ──────────────────────────────────────────────── */

export interface PriceHistoryData {
  customer_name: string;
  transaction_count: number;
  lowest_price: number;
  highest_price: number;
  avg_price: number;
  last_price: number;
  last_invoice_id?: string;
  invoice_date: string;
}

export interface PriceHintState {
  itemId: number | string;
  rowId: number | string;
  currentPrice: number;
  history: PriceHistoryData;
}

/* ── Component Props ────────────────────────────────────────────── */

export interface InvoiceFormHeaderProps {
  invoice: InvoiceFormState;
  customers: Array<{ id: number; customer_name: string; customer_code?: string; email?: string; phone?: string; billing_address?: string; credit_limit?: number }>;
  customersLoading: boolean;
  customersError: boolean;
  errors: Record<string, string>;
  mutationPending: boolean;
  invoiceId: string | undefined;
  onCustomerSelect: (customer: { id: number; customer_name: string; email?: string; phone?: string; billing_address?: string; credit_limit?: number }) => Promise<void>;
  onUpdateInvoice: (updates: Partial<InvoiceFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  formatCurrency: (amount: number | string | null | undefined) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export interface SearchableCellProps {
  value: string;
  itemId: number;
  items: Array<{ id: number; item_name: string; item_code: string; current_stock?: number; standard_selling_price?: number; is_raw_material?: boolean | number; is_finished_good?: boolean | number; is_purchased?: boolean | number }>;
  invoiceItems: InvoiceFormItem[];
  isLastItem: boolean;
  editingCell: string | null;
  onSetEditingCell: (cellId: string | null, options?: { focusNextField?: string; focusRowId?: number }) => void;
  onUpdateItem: (id: number, field: string, value: unknown) => void;
  onAddNewItem: () => number;
  onSetPendingFocus: (itemId: number) => void;
  formatCurrency: (amount: number | string | null | undefined) => string;
  getNextField: (field: string) => string | undefined;
  isLastField: (field: string) => boolean;
  setInvoice?: React.Dispatch<React.SetStateAction<InvoiceFormState>>;
}

export interface EditableCellProps {
  value: string | number;
  itemId: number;
  field: string;
  type?: string;
  isLastItem: boolean;
  editingCell: string | null;
  items: InvoiceFormItem[];
  fieldOrder: readonly string[];
  onSetEditingCell: (cellId: string | null) => void;
  onUpdateItem: (id: number, field: string, value: unknown) => void;
  onAddNewItem: () => number;
  onSetPendingFocus: (itemId: number) => void;
  getNextField: (field: string, discountScope?: 'item' | 'invoice') => string | undefined;
  isLastField: (field: string) => boolean;
}

export interface ItemsTableProps {
  getNextField: (field: string, discountScope?: 'item' | 'invoice') => string | undefined;
  invoice: InvoiceFormState;
  items: Array<{ id: number; item_name: string; item_code: string; current_stock?: number; standard_selling_price?: number;  is_raw_material?: boolean | number; is_finished_good?: boolean | number; is_purchased?: boolean | number }>;
  editingCell: string | null;
  errors: Record<string, string>;
  priceHint: PriceHintState | null;
  onSetEditingCell: (cellId: string | null, options?: { focusNextField?: string; focusRowId?: number }) => void;
  onUpdateItem: (id: number, field: string, value: unknown) => void;
  onRemoveItem: (id: number) => void;
  onAddNewItem: () => number;
  onSetPendingFocus: (itemId: number) => void;
  onSetPriceHint: (hint: PriceHintState | null) => void;
  onUpdateInvoice: (updates: Partial<InvoiceFormState>) => void;
  onSetNewItemId: (id: number | null) => void;
  formatCurrency: (amount: number | string | null | undefined) => string;
  getCurrencySymbol: () => string;
  calculateItemTotal: (item: InvoiceFormItem) => number;
  calculateSubtotal: () => number;
  calculateTax: () => number;
  calculateDiscount: () => number;
  calculateTotal: () => number;
  isLastField: (field: string) => boolean;
}

export interface PaymentPanelProps {
  invoice: InvoiceFormState;
  invoiceId: string | undefined;
  existingPayments: ExistingPayment[];
  deletedPayments: number[];
  showNewPaymentForm: boolean;
  paymentMutationPending: boolean;
  editingPayment: ExistingPayment | null;
  onUpdateInvoice: (updates: Partial<InvoiceFormState>) => void;
  onAddPaymentMethod: () => void;
  onRemovePaymentMethod: (id: number) => void;
  onUpdatePaymentMethod: (id: number, field: string, value: string) => void;
  onRecordPayment: () => void;
  onSetShowNewPaymentForm: (show: boolean) => void;
  onEditPayment: (payment: ExistingPayment) => void;
  onDeletePayment: (paymentId: number) => void;
  formatCurrency: (amount: number | string | null | undefined) => string;
  getCurrencySymbol: () => string;
  calculateTotal: () => number;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export interface ExistingPaymentsTableProps {
  existingPayments: ExistingPayment[];
  deletedPayments: number[];
  onEditPayment: (payment: ExistingPayment) => void;
  onDeletePayment: (paymentId: number) => void;
  formatCurrency: (amount: number | string | null | undefined) => string;
}

/* ── API Submission Types ───────────────────────────────────────── */

export interface InvoiceSubmitItem {
  item_id: number | string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_type: string;
  discount_value: number;
}

export interface InvoiceSubmitData {
  invoice_no: string;
  customer_id: number | string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  discount_scope: string;
  discount_type: string;
  discount_value: number;
  notes: string;
  terms: string;
  items: InvoiceSubmitItem[];
  status?: string;
  record_payment?: boolean;
  payment?: {
    payment_date: string;
    amount: number;
    payment_method: string;
    reference_no: string;
    notes: string;
  };
  deleted_payments?: number[];
}
