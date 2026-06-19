import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import type { ARAgingData, ReceivablesSummaryData, TopDebtor, DSOData } from '../utils/arReportsTypes';

export function useARReportsData({ dateRange: _dateRange }: { dateRange: { from: string; to: string } }) {
  const aging = useQuery<ARAgingData>({
    queryKey: ['arAging'],
    queryFn: async () => {
      const response = await api.get('/reports/ar-aging');
      return response.data.data;
    },
  });

  const summary = useQuery<ReceivablesSummaryData>({
    queryKey: ['arSummary'],
    queryFn: async () => {
      const response = await api.get('/reports/ar-summary');
      return response.data.data;
    },
  });

  const debtors = useQuery<TopDebtor[]>({
    queryKey: ['topDebtors'],
    queryFn: async () => {
      const response = await api.get('/reports/top-debtors');
      return response.data.data;
    },
  });

  const dso = useQuery<DSOData>({
    queryKey: ['dso'],
    queryFn: async () => {
      const response = await api.get('/reports/dso');
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
