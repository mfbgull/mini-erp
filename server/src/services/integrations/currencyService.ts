/**
 * Currency Exchange Service (Fixer Integration)
 * Handles currency exchange rates for multi-currency support
 */

import axios from 'axios';
import db from '../../config/database';

interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

class CurrencyService {
  private apiKey: string | null = null;
  private enabled: boolean = false;
  private baseUrl: string = 'http://data.fixer.io/api';
  private baseCurrency: string = 'USD';
  private cachedRates: ExchangeRates | null = null;
  private lastUpdate: number = 0;
  private updateInterval: number = 3600000; // 1 hour in milliseconds

  constructor() {
    this.loadSettings();
  }

  /**
   * Load Fixer settings from database
   */
  private loadSettings(): void {
    try {
      const settings = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'currency_%'").all() as any[];

      settings.forEach((setting: any) => {
        switch (setting.key) {
          case 'currency_enabled':
            this.enabled = setting.value === 'true';
            break;
          case 'currency_api_key':
            this.apiKey = setting.value;
            break;
          case 'currency_base':
            this.baseCurrency = setting.value || 'USD';
            break;
          case 'currency_rates_update_interval':
            this.updateInterval = (parseInt(setting.value) || 3600) * 1000;
            break;
        }
      });
    } catch (error) {
      console.error('[CurrencyService] Failed to load settings:', error);
    }
  }

  /**
   * Reload settings (call after updating settings)
   */
  reloadSettings(): void {
    this.loadSettings();
    this.cachedRates = null; // Clear cache
  }

  /**
   * Check if service is enabled and configured
   */
  isConfigured(): boolean {
    return this.enabled && !!this.apiKey;
  }

  /**
   * Get exchange rates
   */
  async getExchangeRates(symbols?: string[]): Promise<{ success: boolean; data?: ExchangeRates; message?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Currency service not configured or disabled'
      };
    }

    // Check cache
    const now = Date.now();
    if (this.cachedRates && (now - this.lastUpdate) < this.updateInterval) {
      console.log('[CurrencyService] Using cached exchange rates');
      return {
        success: true,
        data: this.cachedRates
      };
    }

    try {
      const params: any = {
        access_key: this.apiKey,
        base: this.baseCurrency
      };

      if (symbols && symbols.length > 0) {
        params.symbols = symbols.join(',');
      }

      const response = await axios.get(`${this.baseUrl}/latest`, { params });

      if ((response.data as any).success === false) {
        return {
          success: false,
          message: (response.data as any).error?.info || 'Failed to fetch exchange rates'
        };
      }

      this.cachedRates = {
        base: (response.data as any).base,
        date: (response.data as any).date,
        rates: (response.data as any).rates
      };
      this.lastUpdate = now;

      console.log(`[CurrencyService] Updated exchange rates for ${response.data.base}`);
      return {
        success: true,
        data: this.cachedRates
      };
    } catch (error: any) {
      console.error('[CurrencyService] Failed to fetch exchange rates:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch exchange rates'
      };
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ success: boolean; result?: number; message?: string }> {
    if (fromCurrency === toCurrency) {
      return {
        success: true,
        result: amount
      };
    }

    const ratesResult = await this.getExchangeRates([fromCurrency, toCurrency]);

    if (!ratesResult.success || !ratesResult.data) {
      return {
        success: false,
        message: ratesResult.message || 'Failed to get exchange rates'
      };
    }

    const rates = ratesResult.data.rates;

    // Convert from base currency to fromCurrency rate, then to toCurrency
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    const result = (amount / fromRate) * toRate;

    return {
      success: true,
      result: parseFloat(result.toFixed(4))
    };
  }

  /**
   * Format amount with currency symbol
   */
  formatCurrency(amount: number, currency: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      PKR: '₨',
      INR: '₹',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'Fr'
    };

    const symbol = symbols[currency] || currency;
    return `${symbol} ${amount.toFixed(2)}`;
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
      'INR', 'PKR', 'SAR', 'AED', 'SGD', 'HKD', 'NZD',
      'ZAR', 'BRL', 'MXN', 'KRW', 'TRY', 'RUB', 'SEK',
      'NOK', 'DKK', 'PLN', 'THB', 'IDR', 'MYR', 'PHP',
      'VND', 'COP', 'PEN', 'CLP', 'ARS'
    ];
  }

  /**
   * Get cached rates info
   */
  getCachedRatesInfo(): { lastUpdate: Date; age: number } | null {
    if (!this.cachedRates) {
      return null;
    }

    return {
      lastUpdate: new Date(this.lastUpdate),
      age: Date.now() - this.lastUpdate
    };
  }

  /**
   * Clear cached rates
   */
  clearCache(): void {
    this.cachedRates = null;
    this.lastUpdate = 0;
    console.log('[CurrencyService] Cache cleared');
  }
}

// Export singleton instance
const currencyService = new CurrencyService();

export default currencyService;
export const getExchangeRates = (...args: Parameters<typeof currencyService.getExchangeRates>) => currencyService.getExchangeRates(...args);
export const convertCurrency = (...args: Parameters<typeof currencyService.convertCurrency>) => currencyService.convertCurrency(...args);
export const formatCurrency = (...args: Parameters<typeof currencyService.formatCurrency>) => currencyService.formatCurrency(...args);
export const getSupportedCurrencies = (...args: Parameters<typeof currencyService.getSupportedCurrencies>) => currencyService.getSupportedCurrencies(...args);
export const getCachedRatesInfo = (...args: Parameters<typeof currencyService.getCachedRatesInfo>) => currencyService.getCachedRatesInfo(...args);
export const clearCache = (...args: Parameters<typeof currencyService.clearCache>) => currencyService.clearCache(...args);
