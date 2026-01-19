/**
 * Tax Service (TaxJar Integration)
 * Handles automatic tax calculation for sales
 */

import axios from 'axios';
import db from '../../config/database';

interface TaxRate {
  rate: number;
  state: string;
  zip: string;
  country: string;
  name: string;
}

class TaxService {
  private apiKey: string | null = null;
  private enabled: boolean = false;
  private baseUrl: string = 'https://api.taxjar.com/v2';
  private defaultCountry: string = 'US';
  private defaultZip: string = '';

  constructor() {
    this.loadSettings();
  }

  /**
   * Load TaxJar settings from database
   */
  private loadSettings(): void {
    try {
      const settings = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'tax_%'").all() as any[];

      settings.forEach((setting: any) => {
        switch (setting.key) {
          case 'tax_enabled':
            this.enabled = setting.value === 'true';
            break;
          case 'tax_api_key':
            this.apiKey = setting.value;
            break;
          case 'tax_default_country':
            this.defaultCountry = setting.value || 'US';
            break;
          case 'tax_zip_code':
            this.defaultZip = setting.value || '';
            break;
        }
      });
    } catch (error) {
      console.error('[TaxService] Failed to load settings:', error);
    }
  }

  /**
   * Reload settings (call after updating settings)
   */
  reloadSettings(): void {
    this.loadSettings();
  }

  /**
   * Check if service is enabled and configured
   */
  isConfigured(): boolean {
    return this.enabled && !!this.apiKey;
  }

  /**
   * Calculate tax for an order
   */
  async calculateTax(
    toZip: string = '',
    toCountry?: string,
    toState?: string,
    toCity?: string,
    toStreet?: string,
    amount?: number,
    shipping?: number
  ): Promise<{ success: boolean; taxAmount?: number; rate?: number; message?: string }> {
    if (!this.isConfigured()) {
      // Fall back to manual tax rates from database
      return this.calculateManualTax(amount);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/taxes`,
        {
          from_country: this.defaultCountry,
          from_zip: this.defaultZip,
          to_country: toCountry || this.defaultCountry,
          to_zip: toZip || this.defaultZip,
          to_state: toState,
          to_city: toCity,
          to_street: toStreet,
          amount: amount || 0,
          shipping: shipping || 0
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if ((response.data as any).error) {
        return {
          success: false,
          message: (response.data as any).error || 'Failed to calculate tax'
        };
      }

      const tax = (response.data as any).tax;
      return {
        success: true,
        taxAmount: parseFloat(tax.amount_to_collect),
        rate: parseFloat(tax.rate)
      };
    } catch (error: any) {
      console.error('[TaxService] Failed to calculate tax:', error);
      // Fall back to manual calculation
      return this.calculateManualTax(amount);
    }
  }

  /**
   * Calculate tax using manual tax rates from database
   */
  private calculateManualTax(amount: number): { success: boolean; taxAmount: number; rate?: number; message?: string } {
    try {
      // Get default tax rate from database
      const taxRate = db.prepare('SELECT rate FROM tax_rates WHERE is_default = 1 LIMIT 1').get() as any;

      if (!taxRate) {
        return {
          success: false,
          taxAmount: 0,
          message: 'No tax rate configured'
        };
      }

      const taxAmount = (amount * taxRate.rate) / 100;

      return {
        success: true,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        rate: taxRate.rate,
        message: 'Using manual tax rate (TaxJar not configured)'
      };
    } catch (error) {
      console.error('[TaxService] Failed to calculate manual tax:', error);
      return {
        success: false,
        taxAmount: 0,
        message: 'Failed to calculate tax'
      };
    }
  }

  /**
   * Validate tax ID (e.g., VAT for EU)
   */
  async validateTaxId(taxId: string, country: string): Promise<{ success: boolean; valid?: boolean; message?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Tax service not configured'
      };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/validation`,
        {
          params: { vat: taxId },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const validation = (response.data as any).validation;

      return {
        success: true,
        valid: validation?.valid || false,
        message: validation?.valid ? 'Tax ID is valid' : 'Tax ID is invalid'
      };
    } catch (error: any) {
      console.error('[TaxService] Failed to validate tax ID:', error);
      return {
        success: false,
        valid: false,
        message: 'Failed to validate tax ID'
      };
    }
  }

  /**
   * Get tax categories for items
   */
  async getTaxCategories(): Promise<{ success: boolean; categories?: string[]; message?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Tax service not configured'
      };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/categories`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const categories = (response.data as any).categories?.map((c: any) => c.name) || [];

      return {
        success: true,
        categories
      };
    } catch (error: any) {
      console.error('[TaxService] Failed to get tax categories:', error);
      return {
        success: false,
        message: 'Failed to get tax categories'
      };
    }
  }
}

// Export singleton instance
const taxService = new TaxService();

export default taxService;
export const calculateTax = (...args: Parameters<typeof taxService.calculateTax>) => taxService.calculateTax(...args);
export const validateTaxId = (...args: Parameters<typeof taxService.validateTaxId>) => taxService.validateTaxId(...args);
export const getTaxCategories = (...args: Parameters<typeof taxService.getTaxCategories>) => taxService.getTaxCategories(...args);
