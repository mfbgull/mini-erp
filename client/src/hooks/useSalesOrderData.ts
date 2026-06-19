/**
 * useSalesOrderData — all React Query data fetching for the Sales Order Form Page.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

import api from '../utils/api';

export const soKeys = {
  all: ['sales-orders'] as const,
  customers: ['customers'] as const,
  items: ['items'] as const,
  warehouses: ['warehouses'] as const,
  settings: ['settings'] as const,
};

export function invalidateSOQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.invalidateQueries({ queryKey: soKeys.all });
}

export function useCustomers() {
  return useQuery({
    queryKey: soKeys.customers,
    queryFn: async () => {
      const response = await api.get('/customers');
      return Array.isArray(response.data.data) ? response.data.data : [];
    },
  });
}

export function useInventoryItems() {
  return useQuery({
    queryKey: soKeys.items,
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data || [];
    },
  });
}

export function useWarehouses() {
  return useQuery({
    queryKey: soKeys.warehouses,
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data || [];
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: soKeys.settings,
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });
}

interface UseSODataResult {
  customers: Array<{ id: number; customer_name: string; customer_code?: string; email?: string; phone?: string }>;
  inventoryItems: Array<{ id: number; item_name: string; item_code: string; current_stock?: number; standard_selling_price?: number; is_raw_material?: boolean | number; is_finished_good?: boolean | number; is_purchased?: boolean | number }>;
  warehouses: Array<{ id: number; warehouse_name?: string; name?: string }>;
  settings: Record<string, { value: string }>;
}

export function useSOData(): UseSODataResult {
  const { data: customers = [] } = useCustomers();
  const { data: inventoryItems = [] } = useInventoryItems();
  const { data: warehouses = [] } = useWarehouses();
  const { data: settings = {} } = useSettings();

  return { customers, inventoryItems, warehouses, settings };
}
