import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

interface SettingValue {
  value: string;
  description?: string;
}

interface Settings {
  [key: string]: SettingValue;
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  refreshSettings: () => Promise<Settings | undefined>;
  getSettingValue: (key: string, defaultValue?: string) => string;
  formatCurrency: (amount: number | string | null | undefined) => string;
  getCurrencySymbol: () => string;
}

interface SettingsProviderProps {
  children: ReactNode;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const { data, isLoading, refetch } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
      setLoading(false);
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [data, isLoading]);

  // Function to refresh settings
  const refreshSettings = async (): Promise<Settings | undefined> => {
    setLoading(true);
    const newData = await refetch();
    if (newData.data) {
      setSettings(newData.data);
    }
    setLoading(false);
    return newData.data;
  };

  // Helper function to get a specific setting value
  const getSettingValue = (key: string, defaultValue: string = ''): string => {
    return settings?.[key]?.value || defaultValue;
  };

  const formatCurrency = (amount: number | string | null | undefined): string => {
    if (!settings) {
      return `$ ${parseFloat(String(amount || 0)).toFixed(2)}`;
    }
    const currencySymbol = settings.currency_symbol?.value || '$';
    const decimalPlaces = parseInt(settings.decimal_places?.value || '2');
    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount)) {
      return `${currencySymbol} 0.00`;
    }
    return `${currencySymbol} ${numAmount.toFixed(decimalPlaces)}`;
  };

  const getCurrencySymbol = (): string => {
    if (!settings) {
      return '$';
    }
    return settings.currency_symbol?.value || '$';
  };

  const value: SettingsContextType = {
    settings,
    loading,
    refreshSettings,
    getSettingValue,
    formatCurrency,
    getCurrencySymbol
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
