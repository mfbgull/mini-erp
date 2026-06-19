import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { invalidatePOQueries } from './usePurchaseOrderData';
import type { POSubmitData } from '../utils/purchaseOrderTypes';

export const useSavePurchaseOrder = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEdit = !!id;

  return useMutation({
    mutationFn: async (data: POSubmitData) => {
      if (isEdit) {
        return api.put(`/purchase-orders/${id}`, data);
      } else {
        return api.post('/purchase-orders', data);
      }
    },
    onSuccess: () => {
      toast.success(`Purchase order ${isEdit ? 'updated' : 'created'} successfully`);
      invalidatePOQueries(queryClient, id);
      navigate('/purchase-orders');
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} purchase order`);
    }
  });
};
