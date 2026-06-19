import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import type { ARAgingData, ReceivablesSummaryData, TopDebtor, DSOData } from '../utils/arReportsTypes';

export function useARReportsData({ dateRange }: { dateRange: { from: string; to: string } }) {
  const aging = useQuery<ARAgingData>({
    queryKey: ['arAging', dateRange.to],
    queryFn: async () => {
      const response = await api.get('/reports/ar-aging', { params: { asOfDate: dateRange.to } });
      return response.data.data;
    },
  });

  const summary = useQuery<ReceivablesSummaryData>({
    queryKey: ['arSummary', dateRange.to],
    queryFn: async () => {
      const response = await api.get('/reports/ar-summary', { params: { asOfDate: dateRange.to } });
      return response.data.data;
    },
  });

  const debtors = useQuery<TopDebtor[]>({
    queryKey: ['topDebtors', dateRange.to],
    queryFn: async () => {
      const response = await api.get('/reports/top-debtors', { params: { asOfDate: dateRange.to } });
      return response.data.data;
    },
  });

  const dso = useQuery<DSOData>({
    queryKey: ['dso', dateRange.from, dateRange.to],
    queryFn: async () => {
      const response = await api.get('/reports/dso', { params: { fromDate: dateRange.from, toDate: dateRange.to } });
      return response.data.data;
    },
  });

  return {
    agingData: aging.data ?? null,
    agingLoading: aging.isLoading,
    summaryData: summary.data ?? null,
    summaryLoading: summary.isLoading,
    debtorsData: debtors.data ?? null,
    debtorsLoading: debtors.isLoading,
    dsoData: dso.data ?? null,
    dsoLoading: dso.isLoading,
  };
}
