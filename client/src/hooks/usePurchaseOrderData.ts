import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import type { SupplierOption, InventoryItemOption, WarehouseOption } from '../utils/purchaseOrderTypes';

// Query key factory
export const poKeys = {
  all: ['purchaseOrders'] as const,
  single: (id?: number | string) => ['purchaseOrder', id] as const,
  suppliers: ['suppliers'] as const,
  items: ['items'] as const,
  warehouses: ['warehouses'] as const,
  settings: ['settings'] as const,
};

// Cache invalidation helper
export const invalidatePOQueries = (queryClient: ReturnType<typeof useQueryClient>, id?: number | string) => {
  queryClient.invalidateQueries({ queryKey: poKeys.all });
  if (id) {
    queryClient.invalidateQueries({ queryKey: poKeys.single(id) });
  }
};

// ============================================
// Individual query hooks
// ============================================

export const useSuppliers = () => {
  return useQuery<SupplierOption[]>({
    queryKey: poKeys.suppliers,
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return response.data.data || [];
    }
  });
};

export const useInventoryItems = () => {
  return useQuery<InventoryItemOption[]>({
    queryKey: poKeys.items,
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data || [];
    }
  });
};

export const useWarehouses = () => {
  return useQuery<WarehouseOption[]>({
    queryKey: poKeys.warehouses,
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data || [];
    }
  });
};

export const useSettingsData = () => {
  return useQuery<Record<string, { value?: string }>>({
    queryKey: poKeys.settings,
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    }
  });
};

export const usePOData = (id?: string) => {
  return useQuery({
    queryKey: poKeys.single(id),
    queryFn: async () => {
      const response = await api.get(`/purchase-orders/${id}`);
      return response.data;
    },
    enabled: !!id
  });
};

// ============================================
// Aggregate hook
// ============================================

export const usePOFormData = (id?: string) => {
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const { data: inventoryItems = [], isLoading: itemsLoading } = useInventoryItems();
  const { data: warehouses = [] } = useWarehouses();
  const { data: settings = {} } = useSettingsData();
  const { data: poData, isLoading: poLoading } = usePOData(id);

  const company = {
    name: (settings as Record<string, { value?: string }>).company_name?.value || 'Mini ERP',
    email: (settings as Record<string, { value?: string }>).company_email?.value || 'support@minierp.com',
    phone: (settings as Record<string, { value?: string }>).company_phone?.value || '+1 123 456 7890',
    address: (settings as Record<string, { value?: string }>).company_address?.value || '456 Enterprise Ave, BC 12345',
  };

  return {
    suppliers,
    inventoryItems,
    warehouses,
    settings,
    company,
    poData,
    isLoading: (id ? poLoading : false) || suppliersLoading || itemsLoading
  };
};
