import api from './api';

// ============================================
// Types
// ============================================

export interface QuotationItem {
  id?: number;
  item_id: number;
  item_name?: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  discount_type?: 'percentage' | 'flat';
  discount_value?: number;
  amount: number;
}

export interface Quotation {
  id: number;
  quotation_no: string;
  customer_id: number;
  customer_name?: string;
  quotation_date: string;
  expiry_date?: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Converted' | 'Expired';
  source_type?: string;
  source_id?: number;
  notes?: string;
  terms?: string;
  warehouse_id?: number;
  warehouse_name?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  items?: QuotationItem[];
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SalesOrderItem {
  id?: number;
  item_id: number;
  item_name?: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  discount_type?: 'percentage' | 'flat';
  discount_value?: number;
  amount: number;
}

export interface SalesOrder {
  id: number;
  so_no: string;
  customer_id: number;
  customer_name?: string;
  so_date: string;
  delivery_date?: string;
  status: 'Draft' | 'Confirmed' | 'Invoiced' | 'Completed' | 'Cancelled';
  source_type?: string;
  source_id?: number;
  notes?: string;
  warehouse_id?: number;
  warehouse_name?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  items?: SalesOrderItem[];
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SalesCycleChain {
  quotation?: Quotation;
  salesOrder?: SalesOrder;
  invoice?: any;
}

// ============================================
// API Functions
// ============================================

export const salesApi = {
  // ============ Quotations ============
  
  // Get all quotations with filters
  getQuotations: async (filters?: { status?: string; customer_id?: number; from_date?: string; to_date?: string }) => {
    const response = await api.get('/quotations', { params: filters });
    return response.data;
  },

  // Get single quotation
  getQuotation: async (id: number) => {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  },

  // Create new quotation
  createQuotation: async (data: Partial<Quotation>) => {
    const response = await api.post('/quotations', data);
    return response.data;
  },

  // Update quotation
  updateQuotation: async (id: number, data: Partial<Quotation>) => {
    const response = await api.put(`/quotations/${id}`, data);
    return response.data;
  },

  // Delete quotation
  deleteQuotation: async (id: number) => {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  },

  // Convert quotation to sales order
  convertQuotationToSalesOrder: async (id: number, overrides?: Partial<SalesOrder>) => {
    const response = await api.post(`/quotations/${id}/convert`, overrides || {});
    return response.data;
  },

  // Get sales cycle chain for quotation
  getQuotationCycleChain: async (id: number) => {
    const response = await api.get(`/quotations/${id}/cycle-chain`);
    return response.data;
  },

  // Get invoices for quotation
  getQuotationInvoices: async (id: number) => {
    const response = await api.get(`/quotations/${id}/invoices`);
    return response.data;
  },

  // ============ Sales Orders ============
  
  // Get all sales orders with filters
  getSalesOrders: async (filters?: { status?: string; customer_id?: number; from_date?: string; to_date?: string }) => {
    const response = await api.get('/sales-orders', { params: filters });
    return response.data;
  },

  // Get single sales order
  getSalesOrder: async (id: number) => {
    const response = await api.get(`/sales-orders/${id}`);
    return response.data;
  },

  // Create new sales order
  createSalesOrder: async (data: Partial<SalesOrder>) => {
    const response = await api.post('/sales-orders', data);
    return response.data;
  },

  // Update sales order
  updateSalesOrder: async (id: number, data: Partial<SalesOrder>) => {
    const response = await api.put(`/sales-orders/${id}`, data);
    return response.data;
  },

  // Delete sales order
  deleteSalesOrder: async (id: number) => {
    const response = await api.delete(`/sales-orders/${id}`);
    return response.data;
  },

  // Get single sales order
  getSalesOrder: async (id: number) => {
    const response = await api.get(`/sales-orders/${id}`);
    return response.data;
  },

  // Create new sales order
  createSalesOrder: async (data: Partial<SalesOrder>) => {
    const response = await api.post('/sales-orders', data);
    return response.data;
  },

  // Update sales order
  updateSalesOrder: async (id: number, data: Partial<SalesOrder>) => {
    const response = await api.put(`/sales-orders/${id}`, data);
    return response.data;
  },

  // Delete sales order
  deleteSalesOrder: async (id: number) => {
    const response = await api.delete(`/sales-orders/${id}`);
    return response.data;
  },

  // Convert sales order to invoice
  convertSalesOrderToInvoice: async (id: number) => {
    const response = await api.post(`/sales-orders/${id}/convert-to-invoice`);
    return response.data;
  },

  // Get sales order cycle chain
  getSalesOrderCycleChain: async (id: number) => {
    const response = await api.get(`/sales-orders/${id}/cycle-chain`);
    return response.data;
  },

  // ============ Dashboard ============
  getSalesSummary: async () => {
    const response = await api.get('/sales/summary');
    return response.data;
  }
};

export default salesApi;