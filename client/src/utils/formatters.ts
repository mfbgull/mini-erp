import { format } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs. ${formatted}`;
};

export const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};