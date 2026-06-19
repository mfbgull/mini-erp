// ============================================
// AR Reports Types — matched to API responses
// ============================================

export interface ARAgingCustomer {
  customer_id: number;
  customer_name: string;
  customer_code?: string;
  total_outstanding: number;
  current_amount: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_over_90: number;
}

export interface ARAgingSummary {
  totalReceivables?: number;
  current_amount?: number;
  total_1_30?: number;
  total_31_60?: number;
  total_61_90?: number;
  total_over_90?: number;
}

export interface ARAgingData {
  agingBuckets: ARAgingCustomer[];
  summary: ARAgingSummary;
}

export interface ReceivablesSummaryData {
  total_invoices: number;
  total_outstanding: number;
  total_paid: number;
  overdue_count: number;
  overdue_amount: number;
  statusBreakdown: {
    unpaid: { count: number };
    partiallyPaid: { count: number };
    overdue: { count: number };
  };
}

export interface TopDebtor {
  customer_id: number;
  customer_name: string;
  customer_code?: string;
  outstanding_balance: number;
  total_invoiced: number;
  invoice_count: number;
}

export interface DSOData {
  dso: number;
  period: number;
  totalSales: number;
  totalAR: number;
  avgInvoiceValue: number;
  calculation?: string;
}

export type ReportType = 'aging' | 'summary' | 'topDebtors' | 'dso';
