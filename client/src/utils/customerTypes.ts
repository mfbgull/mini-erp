export interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  contact_person?: string;
  email?: string;
  phone: string;
  billing_address?: string;
  shipping_address?: string;
  payment_terms?: string;
  payment_terms_days: number;
  credit_limit: number;
  credit_utilization_percent?: number;
  current_balance: number;
  opening_balance?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerFormData {
  customer_name: string;
  contact_person?: string;
  email?: string;
  phone: string;
  billing_address?: string;
  shipping_address?: string;
  payment_terms?: string;
  payment_terms_days: number;
  credit_limit: number;
  opening_balance: number;
}

/* ── Customer Detail Page types ─────────────────────────────────── */

export interface Invoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  due_date?: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  updated_at?: string;
}

export interface Payment {
  id: number;
  payment_no: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_no: string;
  notes?: string;
}

export interface LedgerEntry {
  id: number;
  transaction_date: string;
  transaction_type: string;
  reference_no: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CustomerMetrics {
  currentBalance: number;
  totalDebit: number;
  totalCredit: number;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  creditUtilization: number;
  overdueInvoicesCount: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  overdueInvoicesItemsCount: number;
  avgDaysToPay: number;
}

export type TabId = 'overview' | 'invoices' | 'payments' | 'ledger';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size: number }>;
}

/* ── Component Props ────────────────────────────────────────────── */

export interface CustomerHeaderProps {
  customer: {
    customer_name: string;
    contact_person?: string;
    phone?: string;
  };
  currentBalance: number;
  creditLimit: number;
  creditUtilization: number;
  overdueInvoicesCount: number;
  onBack: () => void;
  onRecordPayment: () => void;
  formatCurrency?: (amount: number) => string;
}

export interface CustomerModalsProps {
  id: string | number | undefined;
  customer: Customer | undefined;
  invoiceToDelete: { invoice_no: string; paid_amount?: number } | null;
  paymentToDelete: { payment_no: string } | null;
  paymentToEdit: Payment | null;
  isPaymentModalOpen: boolean;
  deleteInvoicePending: boolean;
  cancelInvoicePending?: boolean;
  deletePaymentPending: boolean;
  onClosePaymentModal: () => void;
  onCloseInvoiceDelete: () => void;
  onClosePaymentDelete: () => void;
  onClosePaymentEdit: () => void;
  onPaymentSuccess: () => void;
  onConfirmDeleteInvoice: () => void;
  onConfirmDeletePayment: () => void;
  navigate?: (path: string) => void;
}

export interface EditPaymentFormProps {
  payment: Payment;
  onClose: () => void;
  onSuccess: () => void;
}

export interface EditPaymentFormData {
  payment_date: string;
  payment_method: string;
  reference_no: string;
  notes: string;
}

export interface InvoicesTabProps {
  invoices: Invoice[];
  loading: boolean;
  onViewInvoice: (id: number) => void;
  onDeleteInvoice: (invoice: Invoice) => void;
  onCancelInvoice: (invoice: Invoice) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InvoiceColDef extends Record<string, unknown> {
  headerName?: string;
  field?: string;
  colId?: string;
  filter?: unknown;
  width?: number;
  sortable?: boolean;
  flex?: number;
  cellRenderer?: unknown;
  cellClass?: unknown;
  valueFormatter?: unknown;
}

export interface LedgerTabProps {
  ledger: LedgerEntry[];
  loading: boolean;
  customerName: string;
  formatCurrency: (amount: number | string) => string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LedgerColDef extends Record<string, unknown> {
  headerName?: string;
  field?: string;
  filter?: unknown;
  width?: number;
  sortable?: boolean;
  flex?: number;
  cellRenderer?: unknown;
  valueFormatter?: unknown;
}

export interface OverviewTabProps {
  customer: Customer;
  invoices: Invoice[];
  ledger?: LedgerEntry[];
  payments: Payment[];
  formatCurrency?: (amount: number | string) => string;
}

export interface PaymentsTabProps {
  payments: Payment[];
  loading: boolean;
  onEditPayment: (payment: Payment) => void;
  onDeletePayment: (payment: Payment) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PaymentColDef extends Record<string, unknown> {
  headerName?: string;
  field?: string;
  colId?: string;
  filter?: unknown;
  width?: number;
  sortable?: boolean;
  flex?: number;
  cellRenderer?: unknown;
  valueFormatter?: unknown;
}
