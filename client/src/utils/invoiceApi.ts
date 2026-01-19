import api from './api';

// ============================================
// Types
// ============================================

export interface SearchResult {
  id: number;
  [key: string]: any;
}

export interface TaxRate {
  id: number;
  name: string;
  rate: number;
  is_default: boolean;
}

export interface PaymentTerm {
  id: number;
  name: string;
  days: number;
  is_default: boolean;
}

export interface DraftData {
  id: number;
  session_id: string;
  customer_id: number | null;
  invoice_date: string | null;
  due_date: string | null;
  terms: string | null;
  notes: string | null;
  items_data: string | null;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface InvoiceSubmitData {
  draft_id?: string;
  invoice_no?: string;
  customer_id: number;
  invoice_date: string;
  due_date: string;
  status?: string;
  terms?: string;
  notes?: string;
  items: InvoiceItemData[];
  record_payment?: boolean;
  payment?: PaymentData;
}

export interface InvoiceItemData {
  item_id: number;
  name?: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  discount_type?: 'percentage' | 'flat';
  discount_value?: number;
}

export interface PaymentData {
  payment_date?: string;
  amount: number;
  payment_method: string;
  reference_no?: string;
  notes?: string;
}

// ============================================
// API Functions
// ============================================

export const mobileInvoiceApi = {
  // Draft Management
  createDraft: async (data: {
    session_id?: string;
    customer_id?: number;
    invoice_date?: string;
    due_date?: string;
    terms?: string;
    notes?: string;
    items_data?: any[];
  }): Promise<{ success: boolean; data: { id: number; session_id: string }; message: string }> => {
    const response = await api.post('/mobile-invoices/draft', data);
    return response.data;
  },

  updateDraft: async (id: string, data: Partial<DraftData>): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/mobile-invoices/draft/${id}`, data);
    return response.data;
  },

  getDraft: async (id: string): Promise<{ success: boolean; data: DraftData }> => {
    const response = await api.get(`/mobile-invoices/draft/${id}`);
    return response.data;
  },

  deleteDraft: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/mobile-invoices/draft/${id}`);
    return response.data;
  },

  // Search Endpoints
  searchItems: async (query: string, limit: number = 20): Promise<{ success: boolean; data: SearchResult[]; count: number }> => {
    const response = await api.get(`/mobile-invoices/items/search`, {
      params: { q: query, limit }
    });
    return response.data;
  },

  searchCustomers: async (query: string, limit: number = 20): Promise<{ success: boolean; data: SearchResult[]; count: number }> => {
    const response = await api.get(`/mobile-invoices/customers/search`, {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Configuration
  getTaxRates: async (): Promise<{ success: boolean; data: TaxRate[] }> => {
    const response = await api.get('/mobile-invoices/tax-rates');
    return response.data;
  },

  getPaymentTerms: async (): Promise<{ success: boolean; data: PaymentTerm[] }> => {
    const response = await api.get('/mobile-invoices/payment-terms');
    return response.data;
  },

  // Final Submission
  submitInvoice: async (data: InvoiceSubmitData): Promise<{ success: boolean; data: any; message: string }> => {
    const response = await api.post('/mobile-invoices/submit', data);
    return response.data;
  }
};

export default mobileInvoiceApi;
