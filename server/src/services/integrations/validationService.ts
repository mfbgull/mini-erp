/**
 * Data Validation Service (Numverify Integration)
 * Handles phone number and email validation
 */

import axios from 'axios';
import db from '../../config/database';
import logger from '../../utils/logger';
import { decryptIfNeeded } from '../../utils/encryption';
import { Setting, NumverifyResponse } from '../../types';

interface PhoneValidationResult {
  valid: boolean;
  number: {
    country_code: string;
    country_name: string;
    location: string;
    carrier: string;
    line_type: string;
  };
}

class ValidationService {
  private apiKey: string | null = null;
  private enabled: boolean = false;
  private baseUrl: string = 'http://apilayer.net/api/validate';

  constructor() {
    this.loadSettings();
  }

  /**
   * Load Numverify settings from database
   */
  private loadSettings(): void {
    try {
      const settings = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'validation_%'").all() as Setting[];

      settings.forEach((setting) => {
        switch (setting.key) {
          case 'validation_enabled':
            this.enabled = setting.value === 'true';
            break;
          case 'validation_api_key':
            this.apiKey = decryptIfNeeded(setting.value);
            break;
        }
      });
    } catch (error) {
      logger.error('[ValidationService] Failed to load settings:', error);
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
   * Validate phone number
   */
  async validatePhoneNumber(phoneNumber: string): Promise<{
    success: boolean;
    valid?: boolean;
    data?: PhoneValidationResult;
    message?: string
  }> {
    if (!this.isConfigured()) {
      // If not configured, do basic validation
      return {
        success: true,
        valid: this.basicPhoneValidation(phoneNumber),
        message: 'Validation service not configured. Using basic validation only.'
      };
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          access_key: this.apiKey,
          number: phoneNumber,
          country_code: '',
          format: 1
        }
      });

      if ((response.data as NumverifyResponse).success === false) {
        return {
          success: false,
          valid: false,
          message: (response.data as NumverifyResponse).error?.info || 'Phone validation failed'
        };
      }

      return {
        success: true,
        valid: (response.data as NumverifyResponse).valid,
        data: response.data as PhoneValidationResult
      };
    } catch (error: any) {
      logger.error('[ValidationService] Failed to validate phone:', error);
      return {
        success: false,
        valid: this.basicPhoneValidation(phoneNumber),
        message: 'API validation failed. Using basic validation only.'
      };
    }
  }

  /**
   * Basic phone validation (fallback when API not configured)
   */
  private basicPhoneValidation(phone: string): boolean {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Basic email validation
   */
  validateEmail(email: string): { valid: boolean; message?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return { valid: false, message: 'Email is required' };
    }

    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Invalid email format' };
    }

    return { valid: true };
  }

  /**
   * Validate customer data
   */
  async validateCustomerData(data: {
    phone?: string;
    email?: string;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (data.phone) {
      const phoneResult = await this.validatePhoneNumber(data.phone);
      if (!phoneResult.valid) {
        errors.push(phoneResult.message || 'Invalid phone number');
      }
    }

    if (data.email) {
      const emailResult = this.validateEmail(data.email);
      if (!emailResult.valid) {
        errors.push(emailResult.message || 'Invalid email address');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate supplier data
   */
  async validateSupplierData(data: {
    phone?: string;
    email?: string;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (data.phone) {
      const phoneResult = await this.validatePhoneNumber(data.phone);
      if (!phoneResult.valid) {
        errors.push(phoneResult.message || 'Invalid phone number');
      }
    }

    if (data.email) {
      const emailResult = this.validateEmail(data.email);
      if (!emailResult.valid) {
        errors.push(emailResult.message || 'Invalid email address');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
const validationService = new ValidationService();

export default validationService;
export const validatePhoneNumber = (...args: Parameters<typeof validationService.validatePhoneNumber>) => validationService.validatePhoneNumber(...args);
export const validateEmail = (...args: Parameters<typeof validationService.validateEmail>) => validationService.validateEmail(...args);
export const validateCustomerData = (...args: Parameters<typeof validationService.validateCustomerData>) => validationService.validateCustomerData(...args);
export const validateSupplierData = (...args: Parameters<typeof validationService.validateSupplierData>) => validationService.validateSupplierData(...args);
