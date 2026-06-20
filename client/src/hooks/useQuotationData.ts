import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { salesApi } from '../utils/salesApi';
import type { CustomerOption, InventoryItemOption } from '../types';

// Query key factory
export const qtnKeys = {
  all: ['quotations'] as const,
  list: (filters?: Record<string, unknown>) => ['quotations', filters] as const,
  single: (id?: number | string) => ['quotation', id] as const,
  customers: ['customers'] as const,
  items: ['items'] as const,
  settings: ['settings'] as const,
};

// Cache invalidation helper
export const invalidateQuotationQueries = (queryClient: ReturnType<typeof useQueryClient>, id?: number | string) => {
  queryClient.invalidateQueries({ queryKey: qtnKeys.all });
  if (id) {
    queryClient.invalidateQueries({ queryKey: qtnKeys.single(id) });
  }
};



// ============================================
// Individual query hooks
// ============================================

export const useCustomers = () => {
  return useQuery<CustomerOption[]>({
    queryKey: qtnKeys.customers,
    queryFn: async () => {
      const response = await api.get('/customers');
      return Array.isArray(response.data.data) ? response.data.data : [];
    }
  });
};

export const useInventoryItems = () => {
  return useQuery<InventoryItemOption[]>({
    queryKey: qtnKeys.items,
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data || [];
    }
  });
};

export const useSettingsData = () => {
  return useQuery<Record<string, { value?: string }>>({
    queryKey: qtnKeys.settings,
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    }
  });
};

export const useQuotationData = (id?: string) => {
  return useQuery({
    queryKey: qtnKeys.single(id),
    queryFn: async () => {
      const response = await salesApi.getQuotation(Number(id));
      return response.data || response;
    },
    enabled: !!id
  });
};

// ============================================
// Aggregate hook
// ============================================

export const useQuotationFormData = (id?: string) => {
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: inventoryItems = [], isLoading: itemsLoading } = useInventoryItems();
  const { data: settings = {} } = useSettingsData();
  const { data: quotationData, isLoading: quotationLoading } = useQuotationData(id);

  const company = {
    name: (settings as Record<string, { value?: string }>).company_name?.value || 'Mini ERP',
    email: (settings as Record<string, { value?: string }>).company_email?.value || 'support@minierp.com',
    phone: (settings as Record<string, { value?: string }>).company_phone?.value || '+1 123 456 7890',
    address: (settings as Record<string, { value?: string }>).company_address?.value || '456 Enterprise Ave, BC 12345',
  };

  return {
    customers,
    inventoryItems,
    settings,
    company,
    quotationData,
    isLoading: customersLoading || itemsLoading || quotationLoading
  };
};
