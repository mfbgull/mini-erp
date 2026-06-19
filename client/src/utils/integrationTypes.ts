// ============================================
// Integration Types
// ============================================

export interface IntegrationConfig {
  enabled: boolean;
}

export interface EmailConfig extends IntegrationConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface NotificationConfig extends IntegrationConfig {
  apiKey: string;
  accountSid: string;
  phoneNumber: string;
}

export interface WeatherConfig extends IntegrationConfig {
  apiKey: string;
  defaultLocation: string;
}

export interface ValidationConfig extends IntegrationConfig {
  apiKey: string;
}

export interface CurrencyConfig extends IntegrationConfig {
  apiKey: string;
  base: string;
  updateInterval: string;
}

export interface TaxConfig extends IntegrationConfig {
  apiKey: string;
  defaultCountry: string;
  zipCode: string;
}

export interface IntegrationSettings {
  email?: { enabled: boolean; configured: boolean } & Record<string, unknown>;
  notifications?: { enabled: boolean; configured: boolean } & Record<string, unknown>;
  weather?: { enabled: boolean; configured: boolean } & Record<string, unknown>;
  validation?: { enabled: boolean; configured: boolean } & Record<string, unknown>;
  currency?: { enabled: boolean; configured: boolean } & Record<string, unknown>;
  tax?: { enabled: boolean; configured: boolean } & Record<string, unknown>;
}

export type IntegrationService = 'email' | 'notifications' | 'weather' | 'validation' | 'currency' | 'tax';

export interface IntegrationSectionDef {
  service: IntegrationService;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  config: IntegrationConfig;
  testEnabled?: boolean;
  testLabel?: string;
  testPlaceholder?: string;
  fields: IntegrationFieldDef[];
}

export interface IntegrationFieldDef {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  helpText?: string;
}
