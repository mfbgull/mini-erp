import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import FormInput from '../components/common/FormInput';
import Button from '../components/common/Button';
import './SettingsPage.css';

export default function IntegrationsPage() {
  const queryClient = useQueryClient();

  // Fetch integration settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await api.get('/integrations/settings');
      return response.data;
    }
  });

  // Local state for each integration
  const [emailConfig, setEmailConfig] = useState({
    enabled: false,
    apiKey: '',
    fromEmail: '',
    fromName: ''
  });
  const [notificationConfig, setNotificationConfig] = useState({
    enabled: false,
    apiKey: '',
    accountSid: '',
    phoneNumber: ''
  });
  const [weatherConfig, setWeatherConfig] = useState({
    enabled: false,
    apiKey: '',
    defaultLocation: ''
  });
  const [validationConfig, setValidationConfig] = useState({
    enabled: false,
    apiKey: ''
  });
  const [currencyConfig, setCurrencyConfig] = useState({
    enabled: false,
    apiKey: '',
    base: 'USD',
    updateInterval: '3600'
  });
  const [taxConfig, setTaxConfig] = useState({
    enabled: false,
    apiKey: '',
    defaultCountry: 'US',
    zipCode: ''
  });

  // Test form states
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');

  // Expanded states for each integration
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [notificationExpanded, setNotificationExpanded] = useState(false);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [validationExpanded, setValidationExpanded] = useState(false);
  const [currencyExpanded, setCurrencyExpanded] = useState(false);
  const [taxExpanded, setTaxExpanded] = useState(false);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ service, config }) => {
      return api.put(`/integrations/settings/${service}`, config);
    },
    onSuccess: () => {
      toast.success('Settings updated successfully!');
      queryClient.invalidateQueries(['integrations']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    }
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async (to) => {
      return api.post('/integrations/test/email', { to });
    },
    onSuccess: () => {
      toast.success('Test email sent successfully!');
      setTestEmail('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to send test email');
    }
  });

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: async (to) => {
      return api.post('/integrations/test/notification', { to });
    },
    onSuccess: () => {
      toast.success('Test SMS sent successfully!');
      setTestPhone('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to send test SMS');
    }
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      setEmailConfig({
        enabled: settings.email?.enabled || false,
        apiKey: '',
        fromEmail: '',
        fromName: ''
      });
      setNotificationConfig({
        enabled: settings.notifications?.enabled || false,
        apiKey: '',
        accountSid: '',
        phoneNumber: ''
      });
      setWeatherConfig({
        enabled: settings.weather?.enabled || false,
        apiKey: '',
        defaultLocation: ''
      });
      setValidationConfig({
        enabled: settings.validation?.enabled || false,
        apiKey: ''
      });
      setCurrencyConfig({
        enabled: settings.currency?.enabled || false,
        apiKey: '',
        base: 'USD',
        updateInterval: '3600'
      });
      setTaxConfig({
        enabled: settings.tax?.enabled || false,
        apiKey: '',
        defaultCountry: 'US',
        zipCode: ''
      });

      // Expand enabled integrations
      setEmailExpanded(settings.email?.enabled || false);
      setNotificationExpanded(settings.notifications?.enabled || false);
      setWeatherExpanded(settings.weather?.enabled || false);
      setValidationExpanded(settings.validation?.enabled || false);
      setCurrencyExpanded(settings.currency?.enabled || false);
      setTaxExpanded(settings.tax?.enabled || false);
    }
  }, [settings]);

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const getStatusBadge = (configured) => {
    return configured ? 'Configured' : 'Not Configured';
  };

  const getBadgeClass = (configured) => {
    return configured ? 'badge-success' : 'badge-warning';
  };

  const toggleSection = (section, enabled) => {
    switch (section) {
      case 'email':
        setEmailExpanded(enabled);
        break;
      case 'notification':
        setNotificationExpanded(enabled);
        break;
      case 'weather':
        setWeatherExpanded(enabled);
        break;
      case 'validation':
        setValidationExpanded(enabled);
        break;
      case 'currency':
        setCurrencyExpanded(enabled);
        break;
      case 'tax':
        setTaxExpanded(enabled);
        break;
    }
  };

  const handleEnableChange = (section, enabled) => {
    switch (section) {
      case 'email':
        setEmailConfig({ ...emailConfig, enabled });
        toggleSection('email', enabled);
        break;
      case 'notification':
        setNotificationConfig({ ...notificationConfig, enabled });
        toggleSection('notification', enabled);
        break;
      case 'weather':
        setWeatherConfig({ ...weatherConfig, enabled });
        toggleSection('weather', enabled);
        break;
      case 'validation':
        setValidationConfig({ ...validationConfig, enabled });
        toggleSection('validation', enabled);
        break;
      case 'currency':
        setCurrencyConfig({ ...currencyConfig, enabled });
        toggleSection('currency', enabled);
        break;
      case 'tax':
        setTaxConfig({ ...taxConfig, enabled });
        toggleSection('tax', enabled);
        break;
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Integrations</h1>
          <p className="page-subtitle">Configure third-party services and APIs</p>
        </div>
      </div>

      <div className="settings-form">
        {/* Email Integration */}
        <div className="settings-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2>📧 Email Service (SendGrid)</h2>
                <p className="section-description">Send invoices, POs, and notifications via email</p>
              </div>
              {settings?.email && <span className={`badge ${getBadgeClass(settings.email.configured)}`}>{getStatusBadge(settings.email.configured)}</span>}
            </div>
          </div>
          <div className="settings-grid">
            <div className="form-input-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={emailConfig.enabled}
                  onChange={(e) => handleEnableChange('email', e.target.checked)}
                />
                Enable Email Service
              </label>
              <small className="form-help-text">Send emails automatically on invoice/PO creation</small>
            </div>
            {emailExpanded && (
              <>
                <FormInput
                  label="API Key"
                  name="sendgrid_api_key"
                  type="password"
                  value={emailConfig.apiKey}
                  onChange={(e) => setEmailConfig({ ...emailConfig, apiKey: e.target.value })}
                  placeholder="Enter SendGrid API key"
                  helpText="Get your API key from sendgrid.com"
                />
                <FormInput
                  label="From Email"
                  name="from_email"
                  type="email"
                  value={emailConfig.fromEmail}
                  onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                  placeholder="noreply@yourcompany.com"
                  helpText="Default sender email address"
                />
                <FormInput
                  label="From Name"
                  name="from_name"
                  value={emailConfig.fromName}
                  onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                  placeholder="Your Company Name"
                  helpText="Default sender name"
                />
              </>
            )}
          </div>
          {emailExpanded && (
            <>
              <div className="section-actions" style={{ marginTop: '16px' }}>
                <Button
                  onClick={() => updateSettingsMutation.mutate({ service: 'email', config: emailConfig })}
                  loading={updateSettingsMutation.isPending}
                >
                  Save Email Settings
                </Button>
              </div>
              {settings?.email?.enabled && (
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
                  <h4>Test Email</h4>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Test Recipient</label>
                      <input
                        type="email"
                        className="form-input"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="test@example.com"
                      />
                    </div>
                    <Button
                      onClick={() => testEmailMutation.mutate(testEmail)}
                      loading={testEmailMutation.isPending}
                      disabled={!testEmail}
                      style={{ marginTop: '24px' }}
                    >
                      Send Test
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Notifications Integration */}
        <div className="settings-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2>📱 SMS Notifications (Twilio)</h2>
                <p className="section-description">Send SMS alerts for low stock, payments, and orders</p>
              </div>
              {settings?.notifications && <span className={`badge ${getBadgeClass(settings.notifications.configured)}`}>{getStatusBadge(settings.notifications.configured)}</span>}
            </div>
          </div>
          <div className="settings-grid">
            <div className="form-input-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={notificationConfig.enabled}
                  onChange={(e) => handleEnableChange('notification', e.target.checked)}
                />
                Enable SMS Notifications
              </label>
              <small className="form-help-text">Send SMS alerts automatically</small>
            </div>
            {notificationExpanded && (
              <>
                <FormInput
                  label="Account SID"
                  name="account_sid"
                  value={notificationConfig.accountSid}
                  onChange={(e) => setNotificationConfig({ ...notificationConfig, accountSid: e.target.value })}
                  placeholder="Enter Twilio Account SID"
                  helpText="Get from Twilio console"
                />
                <FormInput
                  label="Auth Token"
                  name="auth_token"
                  type="password"
                  value={notificationConfig.apiKey}
                  onChange={(e) => setNotificationConfig({ ...notificationConfig, apiKey: e.target.value })}
                  placeholder="Enter Twilio Auth Token"
                  helpText="Get from Twilio console"
                />
                <FormInput
                  label="Phone Number"
                  name="phone_number"
                  value={notificationConfig.phoneNumber}
                  onChange={(e) => setNotificationConfig({ ...notificationConfig, phoneNumber: e.target.value })}
                  placeholder="+1234567890"
                  helpText="Your Twilio phone number"
                />
              </>
            )}
          </div>
          {notificationExpanded && (
            <>
              <div className="section-actions" style={{ marginTop: '16px' }}>
                <Button
                  onClick={() => updateSettingsMutation.mutate({ service: 'notifications', config: notificationConfig })}
                  loading={updateSettingsMutation.isPending}
                >
                  Save Notification Settings
                </Button>
              </div>
              {settings?.notifications?.enabled && (
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
                  <h4>Test SMS</h4>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Test Phone Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="+1234567890"
                      />
                    </div>
                    <Button
                      onClick={() => testNotificationMutation.mutate(testPhone)}
                      loading={testNotificationMutation.isPending}
                      disabled={!testPhone}
                      style={{ marginTop: '24px' }}
                    >
                      Send Test
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Weather Integration */}
        <div className="settings-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2>🌤️ Weather (Weatherstack)</h2>
                <p className="section-description">Get weather data for delivery planning</p>
              </div>
              {settings?.weather && <span className={`badge ${getBadgeClass(settings.weather.configured)}`}>{getStatusBadge(settings.weather.configured)}</span>}
            </div>
          </div>
          <div className="settings-grid">
            <div className="form-input-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={weatherConfig.enabled}
                  onChange={(e) => handleEnableChange('weather', e.target.checked)}
                />
                Enable Weather Service
              </label>
              <small className="form-help-text">Enable weather data for deliveries</small>
            </div>
            {weatherExpanded && (
              <>
                <FormInput
                  label="API Key"
                  name="weather_api_key"
                  type="password"
                  value={weatherConfig.apiKey}
                  onChange={(e) => setWeatherConfig({ ...weatherConfig, apiKey: e.target.value })}
                  placeholder="Enter Weatherstack API key"
                  helpText="Get from weatherstack.com"
                />
                <FormInput
                  label="Default Location"
                  name="default_location"
                  value={weatherConfig.defaultLocation}
                  onChange={(e) => setWeatherConfig({ ...weatherConfig, defaultLocation: e.target.value })}
                  placeholder="e.g., New York, NY"
                  helpText="Default location for weather checks"
                />
              </>
            )}
          </div>
          {weatherExpanded && (
            <div className="section-actions" style={{ marginTop: '16px' }}>
              <Button
                onClick={() => updateSettingsMutation.mutate({ service: 'weather', config: weatherConfig })}
                loading={updateSettingsMutation.isPending}
              >
                Save Weather Settings
              </Button>
            </div>
          )}
        </div>

        {/* Validation Integration */}
        <div className="settings-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2>✅ Data Validation (Numverify)</h2>
                <p className="section-description">Validate phone numbers for customers and suppliers</p>
              </div>
              {settings?.validation && <span className={`badge ${getBadgeClass(settings.validation.configured)}`}>{getStatusBadge(settings.validation.configured)}</span>}
            </div>
          </div>
          <div className="settings-grid">
            <div className="form-input-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={validationConfig.enabled}
                  onChange={(e) => handleEnableChange('validation', e.target.checked)}
                />
                Enable Validation Service
              </label>
              <small className="form-help-text">Validate phone numbers before saving</small>
            </div>
            {validationExpanded && (
              <FormInput
                label="API Key"
                name="validation_api_key"
                type="password"
                value={validationConfig.apiKey}
                onChange={(e) => setValidationConfig({ ...validationConfig, apiKey: e.target.value })}
                placeholder="Enter Numverify API key"
                helpText="Get from numverify.com"
              />
            )}
          </div>
          {validationExpanded && (
            <div className="section-actions" style={{ marginTop: '16px' }}>
              <Button
                onClick={() => updateSettingsMutation.mutate({ service: 'validation', config: validationConfig })}
                loading={updateSettingsMutation.isPending}
              >
                Save Validation Settings
              </Button>
            </div>
          )}
        </div>

        {/* Currency Integration */}
        <div className="settings-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2>💱 Currency Exchange (Fixer)</h2>
                <p className="section-description">Real-time currency exchange rates and conversion</p>
              </div>
              {settings?.currency && <span className={`badge ${getBadgeClass(settings.currency.configured)}`}>{getStatusBadge(settings.currency.configured)}</span>}
            </div>
          </div>
          <div className="settings-grid">
            <div className="form-input-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={currencyConfig.enabled}
                  onChange={(e) => handleEnableChange('currency', e.target.checked)}
                />
                Enable Currency Service
              </label>
              <small className="form-help-text">Enable multi-currency support</small>
            </div>
            {currencyExpanded && (
              <>
                <FormInput
                  label="API Key"
                  name="currency_api_key"
                  type="password"
                  value={currencyConfig.apiKey}
                  onChange={(e) => setCurrencyConfig({ ...currencyConfig, apiKey: e.target.value })}
                  placeholder="Enter Fixer API key"
                  helpText="Get from fixer.io"
                />
                <FormInput
                  label="Base Currency"
                  name="currency_base"
                  value={currencyConfig.base}
                  onChange={(e) => setCurrencyConfig({ ...currencyConfig, base: e.target.value })}
                  placeholder="e.g., USD, EUR"
                  helpText="Base currency for exchange rates"
                />
                <FormInput
                  label="Update Interval (seconds)"
                  name="update_interval"
                  type="number"
                  value={currencyConfig.updateInterval}
                  onChange={(e) => setCurrencyConfig({ ...currencyConfig, updateInterval: e.target.value })}
                  placeholder="3600"
                  helpText="How often to refresh exchange rates"
                />
              </>
            )}
          </div>
          {currencyExpanded && (
            <div className="section-actions" style={{ marginTop: '16px' }}>
              <Button
                onClick={() => updateSettingsMutation.mutate({ service: 'currency', config: currencyConfig })}
                loading={updateSettingsMutation.isPending}
              >
                Save Currency Settings
              </Button>
            </div>
          )}
        </div>

        {/* Tax Integration */}
        <div className="settings-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2>🧾 Tax Calculation (TaxJar)</h2>
                <p className="section-description">Automatic tax calculation by location</p>
              </div>
              {settings?.tax && <span className={`badge ${getBadgeClass(settings.tax.configured)}`}>{getStatusBadge(settings.tax.configured)}</span>}
            </div>
          </div>
          <div className="settings-grid">
            <div className="form-input-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={taxConfig.enabled}
                  onChange={(e) => handleEnableChange('tax', e.target.checked)}
                />
                Enable Tax Service
              </label>
              <small className="form-help-text">Calculate tax automatically on invoices</small>
            </div>
            {taxExpanded && (
              <>
                <FormInput
                  label="API Key"
                  name="tax_api_key"
                  type="password"
                  value={taxConfig.apiKey}
                  onChange={(e) => setTaxConfig({ ...taxConfig, apiKey: e.target.value })}
                  placeholder="Enter TaxJar API key"
                  helpText="Get from taxjar.com"
                />
                <FormInput
                  label="Default Country"
                  name="tax_default_country"
                  value={taxConfig.defaultCountry}
                  onChange={(e) => setTaxConfig({ ...taxConfig, defaultCountry: e.target.value })}
                  placeholder="e.g., US, CA, GB"
                  helpText="Default country for tax calculation"
                />
                <FormInput
                  label="Default ZIP Code"
                  name="tax_zip_code"
                  value={taxConfig.zipCode}
                  onChange={(e) => setTaxConfig({ ...taxConfig, zipCode: e.target.value })}
                  placeholder="e.g., 10001"
                  helpText="Default ZIP code for tax calculation"
                />
              </>
            )}
          </div>
          {taxExpanded && (
            <div className="section-actions" style={{ marginTop: '16px' }}>
              <Button
                onClick={() => updateSettingsMutation.mutate({ service: 'tax', config: taxConfig })}
                loading={updateSettingsMutation.isPending}
              >
                Save Tax Settings
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
