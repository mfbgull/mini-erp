/**
 * useCustomerMutations — all React Query mutations for the Customer Detail Page.
 * Extracted so the page component only consumes hooks, not mutation logic.
 */

import toast from 'react-hot-toast';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateCustomerQueries } from './useCustomerData';
import api from '../utils/api';

/* ── Mutations ──────────────────────────────────────────────────── */

export function useDeleteInvoice(id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: number) => {
      return api.delete(`/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      toast.success('Invoice deleted successfully');
      invalidateCustomerQueries(queryClient, id);
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to delete invoice');
    },
  });
}

export function useCancelInvoice(id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: number) => {
      return api.put(`/invoices/${invoiceId}/cancel`);
    },
    onSuccess: () => {
      toast.success('Invoice cancelled successfully');
      invalidateCustomerQueries(queryClient, id);
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to cancel invoice');
    },
  });
}

export function useDeletePayment(id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: number) => {
      return api.delete(`/payments/${paymentId}`);
    },
    onSuccess: () => {
      toast.success('Payment deleted successfully');
      invalidateCustomerQueries(queryClient, id);
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to delete payment');
    },
  });
}

export function useUpdatePayment(onSuccess?: () => void) {
  return useMutation({
    mutationFn: async ({ paymentId, data }: { paymentId: number; data: Record<string, unknown> }) => {
      return api.put(`/payments/${paymentId}`, data);
    },
    onSuccess: () => {
      toast.success('Payment updated successfully');
      onSuccess?.();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to update payment');
    },
  });
}
