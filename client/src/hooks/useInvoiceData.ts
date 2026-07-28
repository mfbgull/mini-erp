/**
 * useInvoiceData — all React Query data fetching for the Sales Invoice Page.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

import api from '../utils/api';

/* ── Query Key Factory ──────────────────────────────────────────── */

export const invoiceKeys = {
  all: ['invoices'] as const,
  customers: ['customers'] as const,
  items: ['items'] as const,
  settings: ['settings'] as const,
  customerInvoices: (id: string | number | undefined) => ['customerInvoices', id] as const,
};

/* ── Invalidation helper ────────────────────────────────────────── */

export function invalidateInvoiceQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  customerId?: string | number,
): void {
  queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
  queryClient.invalidateQueries({ queryKey: invoiceKeys.customers });
  if (customerId) {
    queryClient.invalidateQueries({ queryKey: invoiceKeys.customerInvoices(customerId) });
  }
}

/* ── Individual Queries ─────────────────────────────────────────── */

/**
 * Fetch customers list.
 */
export function useCustomers() {
  return useQuery({
    queryKey: invoiceKeys.customers,
    queryFn: async () => {
      const response = await api.get('/customers');
      return Array.isArray(response.data.data) ? response.data.data : [];
    },
  });
}

/**
 * Fetch inventory items.
 */
export function useItems() {
  return useQuery({
    queryKey: invoiceKeys.items,
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data;
    },
  });
}

/**
 * Fetch company settings.
 */
export function useSettings() {
  return useQuery({
    queryKey: invoiceKeys.settings,
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });
}

/* ── Aggregate Hook ─────────────────────────────────────────────── */

interface UseInvoiceDataResult {
  customers: Array<{
    id: number;
    customer_name: string;
    customer_code?: string;
    email?: string;
    phone?: string;
    billing_address?: string;
    credit_limit?: number;
  }>;
  customersLoading: boolean;
  customersError: boolean;
  items: Array<{
    id: number;
    item_code: string;
    item_name: string;
    current_stock?: number;
    standard_selling_price?: number;
    is_raw_material?: boolean;
    is_finished_good?: boolean;
    is_purchased?: boolean;
    sale_type?: 'packed' | 'loose';
    qty_decimal_precision?: number;
    rounding_step?: number | null;
  }>;
  settings: Record<string, { value: string }>;
}

export function useInvoiceData(): UseInvoiceDataResult {
  const { data: customers = [], isLoading: customersLoading, isError: customersError } = useCustomers();
  const { data: items = [] } = useItems();
  const { data: settings = {} } = useSettings();

  return {
    customers,
    customersLoading,
    customersError,
    items,
    settings,
  };
}
