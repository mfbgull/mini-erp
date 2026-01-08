import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

interface ActivityLogEntry {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string;
  log_level: string;
  ip_address: string | null;
  metadata: string | null;
  duration_ms: number | null;
  created_at: string;
}

interface ActivityLogFilters {
  user_id?: number;
  entity_type?: string;
  entity_id?: number;
  action?: string;
  log_level?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface ActivityLogResponse {
  success: boolean;
  data: ActivityLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

interface ActivityStats {
  actions: { action: string; count: number }[];
  users: { username: string | null; count: number }[];
  dailyActivity: { date: string; count: number }[];
  totalLogs: number;
}

interface ActivityLogContextType {
  logs: ActivityLogEntry[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  stats: ActivityStats | undefined;
  refetch: () => void;
  fetchLogs: (filters: ActivityLogFilters) => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | null>(null);

export function ActivityLogProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const response = await api.get<ActivityLogResponse>('/activity-logs');
      return response.data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['activity-stats'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ActivityStats }>('/activity-logs/stats');
      return response.data.data;
    }
  });

  const fetchLogs = async (filters: ActivityLogFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    await api.get(`/activity-logs?${params.toString()}`);
    refetch();
  };

  return (
    <ActivityLogContext.Provider
      value={{
        logs: data?.data || [],
        total: data?.total || 0,
        isLoading,
        error: error as Error | null,
        stats,
        refetch,
        fetchLogs
      }}
    >
      {children}
    </ActivityLogContext.Provider>
  );
}

export function useActivityLog() {
  const context = useContext(ActivityLogContext);
  if (!context) {
    throw new Error('useActivityLog must be used within ActivityLogProvider');
  }
  return context;
}

// Hook for fetching activity logs with filters
export function useActivityLogs(filters: ActivityLogFilters) {
  return useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await api.get<ActivityLogResponse>(`/activity-logs?${params.toString()}`);
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      // Ensure data is an array
      if (!Array.isArray(response.data.data)) {
        console.warn('Expected array but got:', response.data.data);
        response.data.data = [];
      }
      
      return response.data;
    },
    retry: 1,
    staleTime: 30000 // Cache for 30 seconds
  });
}

// Hook for fetching activity stats
export function useActivityStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['activity-stats', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const response = await api.get<{ success: boolean; data: ActivityStats }>(`/activity-logs/stats?${params.toString()}`);
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      // Ensure data exists and has correct structure
      if (!response.data.data) {
        console.warn('Expected data object but got:', response.data.data);
        return {
          actions: [],
          users: [],
          dailyActivity: [],
          totalLogs: 0
        };
      }
      
      return response.data.data;
    },
    retry: 1,
    staleTime: 60000 // Cache for 1 minute
  });
}

// Hook for fetching recent activity
export function useRecentActivity(limit: number = 20) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ActivityLogEntry[] }>(`/activity-logs/recent?limit=${limit}`);
      return response.data.data;
    }
  });
}

// Hook for fetching entity types for filter
export function useEntityTypes() {
  return useQuery({
    queryKey: ['entity-types'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: string[] }>('/activity-logs/entity-types');
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      // Ensure data is an array
      if (!Array.isArray(response.data.data)) {
        console.warn('Expected array but got:', response.data.data);
        return [];
      }
      
      return response.data.data;
    },
    retry: 1,
    staleTime: 300000 // Cache for 5 minutes
  });
}

// Hook for fetching actions for filter
export function useActions() {
  return useQuery({
    queryKey: ['actions'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: string[] }>('/activity-logs/actions');
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      // Ensure data is an array
      if (!Array.isArray(response.data.data)) {
        console.warn('Expected array but got:', response.data.data);
        return [];
      }
      
      return response.data.data;
    },
    retry: 1,
    staleTime: 300000 // Cache for 5 minutes
  });
}

// Hook for fetching users for filter
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: { id: number; username: string; full_name: string }[] }>('/activity-logs/users');
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      // Ensure data is an array
      if (!Array.isArray(response.data.data)) {
        console.warn('Expected array but got:', response.data.data);
        return [];
      }
      
      return response.data.data;
    },
    retry: 1,
    staleTime: 300000 // Cache for 5 minutes
  });
}
