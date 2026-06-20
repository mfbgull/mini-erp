import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import type { IntegrationSettings, IntegrationService } from '../types';

export const useIntegrationSettings = () => {
  return useQuery<IntegrationSettings>({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await api.get('/integrations/settings');
      return response.data;
    },
  });
};

export const useUpdateIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ service, config }: { service: IntegrationService; config: Record<string, unknown> }) => {
      return api.put(`/integrations/settings/${service}`, config);
    },
    onSuccess: () => {
      toast.success('Settings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    },
  });
};

export const useTestIntegration = (endpoint: 'email' | 'notification') => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (to: string) => {
      return api.post(`/integrations/test/${endpoint}`, { to });
    },
    onSuccess: () => {
      toast.success(`Test ${endpoint === 'email' ? 'email sent' : 'SMS sent'} successfully!`);
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || `Failed to send test ${endpoint}`);
    },
  });
};
