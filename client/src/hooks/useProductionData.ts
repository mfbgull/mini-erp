import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import type { ProductionStub, BOMRecord, StockItem, Warehouse } from '../types';

// Query key factory
export const prodKeys = {
  all: ['productions'] as const,
  single: (id?: number | string) => ['production', id] as const,
  boms: ['boms'] as const,
  items: ['items'] as const,
  warehouses: ['warehouses'] as const,
  settings: ['settings'] as const,
};

// Cache invalidation helper
export const invalidateProductionQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: prodKeys.all });
  queryClient.invalidateQueries({ queryKey: prodKeys.items });
};

// ============================================
// Individual query hooks
// ============================================

export const useProductions = () => {
  return useQuery<ProductionStub[]>({
    queryKey: prodKeys.all,
    queryFn: async () => {
      const response = await api.get('/productions');
      return response.data;
    },
  });
};

export const useProductionDetail = (id?: number | string) => {
  return useQuery({
    queryKey: prodKeys.single(id),
    queryFn: async () => {
      const response = await api.get(`/productions/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useActiveBOMs = () => {
  return useQuery<BOMRecord[]>({
    queryKey: prodKeys.boms,
    queryFn: async () => {
      const response = await api.get('/boms');
      return response.data.filter((b: BOMRecord) => b.is_active);
    },
  });
};

export const useBOMDetail = (bomId?: string) => {
  return useQuery({
    queryKey: ['bom', bomId],
    queryFn: async () => {
      const response = await api.get(`/boms/${bomId}`);
      return response.data as BOMRecord;
    },
    enabled: !!bomId,
  });
};

export const useInventoryItems = () => {
  return useQuery<StockItem[]>({
    queryKey: prodKeys.items,
    queryFn: async () => {
      const response = await api.get('/inventory/items');
      return response.data.data;
    },
  });
};

export const useInventoryItemDetail = (itemId: number | string) => {
  return useQuery({
    queryKey: ['inventory-item', itemId],
    queryFn: async () => {
      const response = await api.get(`/inventory/items/${itemId}`);
      return response.data as StockItem;
    },
    enabled: !!itemId,
  });
};

export const useWarehouses = () => {
  return useQuery<Warehouse[]>({
    queryKey: prodKeys.warehouses,
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data.data;
    },
  });
};

export const useSettingsData = () => {
  return useQuery<Record<string, { value?: string }>>({
    queryKey: prodKeys.settings,
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });
};

// ============================================
// Aggregate hook for main page
// ============================================

export const useProductionPageData = () => {
  const productionsQuery = useProductions();
  const settingsQuery = useSettingsData();

  return {
    productions: productionsQuery.data || [],
    isLoading: productionsQuery.isLoading,
    error: productionsQuery.error,
    isError: productionsQuery.isError,
    settings: settingsQuery.data || {},
  };
};

// ============================================
// Aggregate hook for form modal
// ============================================

export const useProductionFormData = (bomId?: string) => {
  const bomsQuery = useActiveBOMs();
  const itemsQuery = useInventoryItems();
  const warehousesQuery = useWarehouses();
  const bomDetailQuery = useBOMDetail(bomId);

  const items = itemsQuery.data || [];
  const rawMaterials = items.filter((i) => i.is_raw_material);
  const finishedGoods = items.filter((i) => i.is_finished_good);

  return {
    boms: bomsQuery.data || [],
    bomsLoading: bomsQuery.isLoading,
    items,
    itemsLoading: itemsQuery.isLoading,
    rawMaterials,
    finishedGoods,
    warehouses: warehousesQuery.data || [],
    warehousesLoading: warehousesQuery.isLoading,
    bomDetail: bomDetailQuery.data,
    bomDetailLoading: bomDetailQuery.isLoading,
  };
};
