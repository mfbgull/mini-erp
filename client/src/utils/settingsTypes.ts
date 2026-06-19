export interface SettingValue {
  value: string;
  description: string;
}

export interface SettingsApiResponse {
  currency_symbol?: SettingValue;
  currency_code?: SettingValue;
  company_name?: SettingValue;
  date_format?: SettingValue;
  decimal_places?: SettingValue;
  tooltip_timeout?: SettingValue;
  [key: string]: SettingValue | undefined;
}

export interface SettingsFormData {
  currency_symbol: string;
  currency_code: string;
  company_name: string;
  date_format: string;
  decimal_places: string;
  tooltip_timeout: string;
}
