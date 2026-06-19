import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { invalidateProductionQueries } from './useProductionData';

export const useDeleteProduction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productionId: number) => {
      return api.delete(`/productions/${productionId}`);
    },
    onSuccess: () => {
      toast.success('Production record deleted successfully!');
      invalidateProductionQueries(queryClient);
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to delete production record');
    },
  });
};

export const useSaveProduction = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return api.post('/productions', data);
    },
    onSuccess: () => {
      toast.success('Production recorded successfully!');
      invalidateProductionQueries(queryClient);
      if (onSuccess) onSuccess();
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to record production');
    },
  });
};
