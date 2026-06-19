/**
 * useCustomerData — all React Query data fetching for the Customer Detail Page.
 * Extracted so the page component only consumes hooks, not query logic.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

import api from '../utils/api';
import type { Customer, Invoice, LedgerEntry, Payment } from '../utils/customerTypes';

/* ── Query Key Factory ──────────────────────────────────────────── */

export const customerKeys = {
  all: ['customers'] as const,
  detail: (id: string | undefined) => ['customer', id] as const,
  invoices: (id: string | undefined) => ['customerInvoices', id] as const,
  ledger: (id: string | undefined) => ['customerLedger', id] as const,
  payments: (id: string | undefined) => ['customerPayments', id] as const,
  allInvoices: ['invoices'] as const,
};

/* ── Invalidation helpers ───────────────────────────────────────── */

/**
 * Invalidate all customer-related queries for a given customer ID.
 * Prevents repetitive queryClient.invalidateQueries calls throughout the page.
 */
export function invalidateCustomerQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string | undefined,
): void {
  queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
  queryClient.invalidateQueries({ queryKey: customerKeys.invoices(id) });
  queryClient.invalidateQueries({ queryKey: customerKeys.ledger(id) });
  queryClient.invalidateQueries({ queryKey: customerKeys.payments(id) });
  queryClient.invalidateQueries({ queryKey: customerKeys.allInvoices });
}

/* ── Queries ────────────────────────────────────────────────────── */

export function useCustomer(id: string | undefined) {
  return useQuery<Customer>({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/customers/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCustomerInvoices(id: string | undefined) {
  return useQuery<Invoice[]>({
    queryKey: customerKeys.invoices(id),
    queryFn: async () => {
      const response = await api.get(`/invoices?customerId=${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCustomerLedger(id: string | undefined) {
  return useQuery<LedgerEntry[]>({
    queryKey: customerKeys.ledger(id),
    queryFn: async () => {
      const response = await api.get(`/customers/${id}/ledger`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always' as const,
  });
}

export function useCustomerPayments(id: string | undefined) {
  return useQuery<Payment[]>({
    queryKey: customerKeys.payments(id),
    queryFn: async () => {
      const response = await api.get(`/payments?customerId=${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

/* ── Aggregate Hook ─────────────────────────────────────────────── */

interface UseCustomerDataResult {
  customer: Customer | undefined;
  invoices: Invoice[];
  payments: Payment[];
  ledger: LedgerEntry[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  invoicesLoading: boolean;
  ledgerLoading: boolean;
  paymentsLoading: boolean;
}

export function useCustomerData(id: string | undefined): UseCustomerDataResult {
  const {
    data: customer,
    isLoading,
    error,
    isError,
  } = useCustomer(id);

  const { data: invoices = [], isLoading: invoicesLoading } = useCustomerInvoices(id);
  const { data: ledger = [], isLoading: ledgerLoading } = useCustomerLedger(id);
  const { data: payments = [], isLoading: paymentsLoading } = useCustomerPayments(id);

  return {
    customer,
    invoices,
    payments,
    ledger,
    isLoading,
    isError,
    error,
    invoicesLoading,
    ledgerLoading,
    paymentsLoading,
  };
}
