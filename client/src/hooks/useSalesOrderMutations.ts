/**
 * useSalesOrderMutations — all React Query mutations for the Sales Order Form Page.
 */

import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateSOQueries } from './useSalesOrderData';
import { salesApi } from '../utils/salesApi';

export function useSaveSalesOrder(id: string | undefined) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (id) {
        return salesApi.updateSalesOrder(Number(id), data);
      }
      return salesApi.createSalesOrder(data);
    },
    onSuccess: () => {
      toast.success(`Sales order ${id ? 'updated' : 'created'} successfully`);
      invalidateSOQueries(queryClient);
      navigate('/sales-orders');
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || `Failed to ${id ? 'update' : 'create'} sales order`);
    },
  });
}
