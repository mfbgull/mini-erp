import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { salesApi } from '../utils/salesApi';
import { invalidateQuotationQueries } from './useQuotationData';
import type { QuotationSubmitData } from '../types';

export const useSaveQuotation = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: QuotationSubmitData) => {
      if (id) {
        return salesApi.updateQuotation(Number(id), data as unknown as Parameters<typeof salesApi.updateQuotation>[1]);
      } else {
        return salesApi.createQuotation(data as unknown as Parameters<typeof salesApi.createQuotation>[0]);
      }
    },
    onSuccess: () => {
      toast.success(`Quotation ${id ? 'updated' : 'created'} successfully`);
      invalidateQuotationQueries(queryClient, id);
      navigate('/quotations');
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || `Failed to ${id ? 'update' : 'create'} quotation`);
    }
  });
};
