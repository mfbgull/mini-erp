import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Building2, Palette, Lightbulb, Eye, Keyboard } from 'lucide-react';

import Button from '../components/common/Button';
import FormInput from '../components/common/FormInput';
import { useFormValidation } from '../hooks/useFormValidation';
import { settingsSchema } from '../schemas';
import api from '../utils/api';
import type { SettingsApiResponse, SettingsFormData } from '../utils/settingsTypes';

import './SettingsPage.css';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SettingsFormData>({
    currency_symbol: '$',
    currency_code: 'USD',
    company_name: 'Mini ERP',
    date_format: 'MM/DD/YYYY',
    decimal_places: '2',
    tooltip_timeout: '1'
  });

  const [showShortcutBar, setShowShortcutBar] = useState(() => {
    return localStorage.getItem('shortcutBarDismissed') !== 'true';
  });

  const { data: settings, isLoading } = useQuery<SettingsApiResponse>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data as SettingsApiResponse;
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        currency_symbol: settings.currency_symbol?.value || '$',
        currency_code: settings.currency_code?.value || 'USD',
        company_name: settings.company_name?.value || 'Mini ERP',
        date_format: settings.date_format?.value || 'MM/DD/YYYY',
        decimal_places: settings.decimal_places?.value || '2',
        tooltip_timeout: settings.tooltip_timeout?.value || '1'
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const settingsPayload: Record<string, { value: string; description: string }> = {};
      (Object.entries(data) as Array<[string, string]>).forEach(([key, value]) => {
        const settingKey = key as keyof SettingsApiResponse;
        settingsPayload[key] = {
          value: value,
          description: settings?.[settingKey]?.description || ''
        };
      });
      return api.post('/settings/bulk', settingsPayload);
    },
    onSuccess: () => {
      toast.success('Settings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: (error: { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    }
  });

  const { errors, validate, clearErrors } = useFormValidation(settingsSchema);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof typeof errors]) clearErrors();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(formData)) return;
    updateMutation.mutate(formData);
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        currency_symbol: settings.currency_symbol?.value || '$',
        currency_code: settings.currency_code?.value || 'USD',
        company_name: settings.company_name?.value || 'Mini ERP',
        date_format: settings.date_format?.value || 'MM/DD/YYYY',
        decimal_places: settings.decimal_places?.value || '2',
        tooltip_timeout: settings.tooltip_timeout?.value || '1'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="page-subtitle">Configure your ERP system preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        {/* Currency Settings */}
        <div className="settings-section">
          <div className="section-header">
            <h2><DollarSign size={24} className="icon-valign-middle icon-mr-sm" />Currency Settings</h2>
            <p className="section-description">Configure currency display preferences</p>
          </div>
          <div className="settings-grid">
            <FormInput
              label="Currency Symbol"
              name="currency_symbol"
              value={formData.currency_symbol}
              onChange={handleChange}
              placeholder="e.g., $, €, £, Rs"
              required
              error={errors.currency_symbol}
              helpText="This symbol will appear before all monetary values"
            />
            <FormInput
              label="Currency Code"
              name="currency_code"
              value={formData.currency_code}
              onChange={handleChange}
              placeholder="e.g., USD, EUR, GBP, PKR"
              required
              error={errors.currency_code}
              helpText="Standard 3-letter currency code"
            />
            <FormInput
              label="Decimal Places"
              name="decimal_places"
              type="number"
              min="0"
              max="4"
              value={formData.decimal_places}
              onChange={handleChange}
              required
              error={errors.decimal_places}
              helpText="Number of decimal places for currency amounts"
            />
          </div>
        </div>

        {/* Company Settings */}
        <div className="settings-section">
          <div className="section-header">
            <h2><Building2 size={24} className="icon-valign-middle icon-mr-sm" />Company Settings</h2>
            <p className="section-description">Basic company information</p>
          </div>
          <div className="settings-grid">
            <FormInput
              label="Company Name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="e.g., ABC Manufacturing Ltd."
              required
              error={errors.company_name}
              helpText="Your company or business name"
            />
          </div>
        </div>

        {/* Display Settings */}
        <div className="settings-section">
          <div className="section-header">
            <h2><Palette size={24} className="icon-valign-middle icon-mr-sm" />Display Settings</h2>
            <p className="section-description">Customize how information is displayed</p>
          </div>
          <div className="settings-grid">
            <FormInput
              label="Date Format"
              name="date_format"
              type="select"
              value={formData.date_format}
              onChange={handleChange}
              options={[
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
                { value: 'DD MMM YYYY', label: 'DD MMM YYYY (31 Dec 2025)' }
              ]}
              required
              helpText="Preferred date format for reports"
            />
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="settings-section">
          <div className="section-header">
            <h2><Keyboard size={24} className="icon-valign-middle icon-mr-sm" />Keyboard Shortcuts</h2>
            <p className="section-description">Configure the shortcut bar at the bottom of the screen</p>
          </div>
          <div className="settings-grid">
            <div className="toggle-field">
              <div className="toggle-field-info">
                <label className="toggle-field-label">Show shortcut bar</label>
                <span className="toggle-field-description">Display available keyboard shortcuts at the bottom of every page on desktop</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={showShortcutBar}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const isChecked = e.target.checked;
                    setShowShortcutBar(isChecked);
                    const newValue = isChecked ? 'false' : 'true';
                    const oldValue = isChecked ? 'true' : 'false';
                    localStorage.setItem('shortcutBarDismissed', newValue);
                    window.dispatchEvent(new StorageEvent('storage', {
                      key: 'shortcutBarDismissed',
                      newValue,
                      oldValue,
                      storageArea: localStorage,
                    }));
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Tooltip Settings */}
        <div className="settings-section">
          <div className="section-header">
            <h2><Lightbulb size={24} className="icon-valign-middle icon-mr-sm" />Tooltip Settings</h2>
            <p className="section-description">Configure tooltip behavior</p>
          </div>
          <div className="settings-grid">
            <FormInput
              label="Tooltip Timeout (seconds)"
              name="tooltip_timeout"
              type="number"
              min="1"
              max="10"
              step="0.5"
              value={formData.tooltip_timeout}
              onChange={handleChange}
              required
              helpText="Auto-hide timeout for tooltips (1-10 seconds)"
            />
          </div>
        </div>

        {/* Preview Section */}
        <div className="settings-section preview-section">
          <div className="section-header">
            <h2><Eye size={24} className="icon-valign-middle icon-mr-sm" />Preview</h2>
            <p className="section-description">See how your settings will look</p>
          </div>
          <div className="preview-content">
            <div className="preview-item">
              <span className="preview-label">Currency Display:</span>
              <span className="preview-value">
                {formData.currency_symbol}{(1234.56).toFixed(Number(formData.decimal_places))}
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Company Name:</span>
              <span className="preview-value">{formData.company_name}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Date Format:</span>
              <span className="preview-value">{formData.date_format}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={updateMutation.isPending}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={updateMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
