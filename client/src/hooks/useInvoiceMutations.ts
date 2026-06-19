/**
 * useInvoiceMutations — all React Query mutations for the Sales Invoice Page.
 */

import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateInvoiceQueries } from './useInvoiceData';
import api from '../utils/api';

/* ── Save Invoice (create or update) ────────────────────────────── */

export function useSaveInvoice(invoiceId: string | undefined, customerId: string | number | undefined) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (invoiceId) {
        return api.put(`/invoices/${invoiceId}`, data);
      }
      return api.post('/invoices', data);
    },
    onSuccess: () => {
      toast.success(invoiceId ? 'Invoice updated successfully!' : 'Invoice created successfully!');
      invalidateInvoiceQueries(queryClient, customerId);
      if (customerId) {
        navigate(`/customers/${customerId}`);
      }
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || `Failed to ${invoiceId ? 'update' : 'create'} invoice`);
    },
  });
}

/* ── Record Payment ─────────────────────────────────────────────── */

export function useRecordPayment(invoiceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData: Record<string, unknown>) => {
      return api.post('/payments', paymentData);
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully!');
      invalidateInvoiceQueries(queryClient);
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to record payment');
    },
  });
}
