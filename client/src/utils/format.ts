interface CurrencySettings {
  currency_symbol?: string;
  currency_code?: string;
  decimal_places?: number;
}

declare global {
  interface Window {
    defaultCurrency?: string;
  }
}

export const formatCurrency = (amount: number | string, settings: CurrencySettings | null = null): string => {
  try {
    const currencySymbol = settings?.currency_symbol || (typeof window !== 'undefined' ? window.defaultCurrency : '$');
    const currencyCode = settings?.currency_code || 'USD';
    const decimalPlaces = parseInt(settings?.decimal_places?.toString() || '2');

    const numAmount = parseFloat(amount.toString());
    if (isNaN(numAmount)) {
      return `${currencySymbol} 0.00`;
    }

    const formattedAmount = numAmount.toFixed(decimalPlaces);

    return `${currencySymbol} ${formattedAmount}`;
  } catch (error) {
    console.warn('Error formatting currency:', error);
    const fallbackSymbol = typeof window !== 'undefined' ? window.defaultCurrency : '$';
    return `${fallbackSymbol} ${parseFloat((amount || 0).toString()).toFixed(2)}`;
  }
};

export const formatCurrencyWithDefaultSettings = (amount: number | string): string => {
  return formatCurrency(amount);
};
