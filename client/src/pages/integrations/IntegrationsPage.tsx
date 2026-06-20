import {
  Mail,
  MessageSquare,
  Cloud,
  CheckCircle,
  ArrowRightLeft,
  FileText,
} from 'lucide-react';

import { useIntegrationSettings, useUpdateIntegration, useTestIntegration } from '../../hooks/useIntegrationData';
import IntegrationSection from '../../components/integration/IntegrationSection';
import type {
  IntegrationSectionDef,
  EmailConfig,
  NotificationConfig,
  WeatherConfig,
  ValidationConfig,
  CurrencyConfig,
  TaxConfig,
} from '../../types';

import '../SettingsPage.css';

const integrationDefs: IntegrationSectionDef[] = [
  {
    service: 'email',
    title: 'Email Service (SendGrid)',
    description: 'Send invoices, POs, and notifications via email',
    icon: Mail,
    config: { enabled: false, apiKey: '', fromEmail: '', fromName: '' } as EmailConfig,
    testEnabled: true,
    testLabel: 'Test Email',
    testPlaceholder: 'test@example.com',
    fields: [
      { label: 'API Key', name: 'apiKey', type: 'password', placeholder: 'Enter SendGrid API key', helpText: 'Get your API key from sendgrid.com' },
      { label: 'From Email', name: 'fromEmail', type: 'email', placeholder: 'noreply@yourcompany.com', helpText: 'Default sender email address' },
      { label: 'From Name', name: 'fromName', placeholder: 'Your Company Name', helpText: 'Default sender name' },
    ],
  },
  {
    service: 'notifications',
    title: 'SMS Notifications (Twilio)',
    description: 'Send SMS alerts for low stock, payments, and orders',
    icon: MessageSquare,
    config: { enabled: false, apiKey: '', accountSid: '', phoneNumber: '' } as NotificationConfig,
    testEnabled: true,
    testLabel: 'Test SMS',
    testPlaceholder: '+1234567890',
    fields: [
      { label: 'Account SID', name: 'accountSid', placeholder: 'Enter Twilio Account SID', helpText: 'Get from Twilio console' },
      { label: 'Auth Token', name: 'apiKey', type: 'password', placeholder: 'Enter Twilio Auth Token', helpText: 'Get from Twilio console' },
      { label: 'Phone Number', name: 'phoneNumber', placeholder: '+1234567890', helpText: 'Your Twilio phone number' },
    ],
  },
  {
    service: 'weather',
    title: 'Weather (Weatherstack)',
    description: 'Get weather data for delivery planning',
    icon: Cloud,
    config: { enabled: false, apiKey: '', defaultLocation: '' } as WeatherConfig,
    fields: [
      { label: 'API Key', name: 'apiKey', type: 'password', placeholder: 'Enter Weatherstack API key', helpText: 'Get from weatherstack.com' },
      { label: 'Default Location', name: 'defaultLocation', placeholder: 'e.g., New York, NY', helpText: 'Default location for weather checks' },
    ],
  },
  {
    service: 'validation',
    title: 'Data Validation (Numverify)',
    description: 'Validate phone numbers for customers and suppliers',
    icon: CheckCircle,
    config: { enabled: false, apiKey: '' } as ValidationConfig,
    fields: [
      { label: 'API Key', name: 'apiKey', type: 'password', placeholder: 'Enter Numverify API key', helpText: 'Get from numverify.com' },
    ],
  },
  {
    service: 'currency',
    title: 'Currency Exchange (Fixer)',
    description: 'Real-time currency exchange rates and conversion',
    icon: ArrowRightLeft,
    config: { enabled: false, apiKey: '', base: 'USD', updateInterval: '3600' } as CurrencyConfig,
    fields: [
      { label: 'API Key', name: 'apiKey', type: 'password', placeholder: 'Enter Fixer API key', helpText: 'Get from fixer.io' },
      { label: 'Base Currency', name: 'base', placeholder: 'e.g., USD, EUR', helpText: 'Base currency for exchange rates' },
      { label: 'Update Interval (seconds)', name: 'updateInterval', type: 'number', placeholder: '3600', helpText: 'How often to refresh exchange rates' },
    ],
  },
  {
    service: 'tax',
    title: 'Tax Calculation (TaxJar)',
    description: 'Automatic tax calculation by location',
    icon: FileText,
    config: { enabled: false, apiKey: '', defaultCountry: 'US', zipCode: '' } as TaxConfig,
    fields: [
      { label: 'API Key', name: 'apiKey', type: 'password', placeholder: 'Enter TaxJar API key', helpText: 'Get from taxjar.com' },
      { label: 'Default Country', name: 'defaultCountry', placeholder: 'e.g., US, CA, GB', helpText: 'Default country for tax calculation' },
      { label: 'Default ZIP Code', name: 'zipCode', placeholder: 'e.g., 10001', helpText: 'Default ZIP code for tax calculation' },
    ],
  },
];

export default function IntegrationsPage() {
  const { data: settings, isLoading } = useIntegrationSettings();
  const updateMutation = useUpdateIntegration();
  const testEmailMutation = useTestIntegration('email');
  const testSmsMutation = useTestIntegration('notification');

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
          <h1>Integrations</h1>
          <p className="page-subtitle">
            Configure third-party services and APIs
          </p>
        </div>
      </div>

      <div className="settings-form">
        {integrationDefs.map((def) => (
          <IntegrationSection
            key={def.service}
            def={def}
            settings={settings}
            isPending={updateMutation.isPending}
            onSave={(service, config) =>
              updateMutation.mutate({ service: service as 'email' | 'notifications' | 'weather' | 'validation' | 'currency' | 'tax', config })
            }
            onTest={
              def.testEnabled
                ? (to) => {
                    if (def.service === 'email') {
                      testEmailMutation.mutate(to);
                    } else if (def.service === 'notifications') {
                      testSmsMutation.mutate(to);
                    }
                  }
                : undefined
            }
            testPending={
              def.service === 'email' ? testEmailMutation.isPending : testSmsMutation.isPending
            }
          />
        ))}
      </div>
    </div>
  );
}
