import { useState, useEffect } from 'react';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import type {
  IntegrationSectionDef,
  IntegrationConfig,
  IntegrationSettings,
} from '../../utils/integrationTypes';

interface Props {
  def: IntegrationSectionDef;
  settings: IntegrationSettings | undefined;
  isPending: boolean;
  onSave: (service: string, config: Record<string, unknown>) => void;
  onTest?: (to: string) => void;
  testPending?: boolean;
}

export default function IntegrationSection({
  def,
  settings,
  isPending,
  onSave,
  onTest,
  testPending,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState(def.config);
  const [testValue, setTestValue] = useState('');

  // Sync expanded state and enabled flag when settings load
  useEffect(() => {
    const serviceSettings = settings?.[def.service as keyof IntegrationSettings] as { enabled?: boolean } | undefined;
    if (serviceSettings) {
      setExpanded(!!serviceSettings.enabled);
      setConfig(prev => ({ ...prev, enabled: !!serviceSettings.enabled }));
    }
  }, [settings, def.service]);

  const handleEnableChange = (enabled: boolean) => {
    setConfig((prev: IntegrationConfig) => ({ ...prev, enabled }));
    setExpanded(enabled);
  };

  const updateField = (field: string, value: string) => {
    setConfig((prev: IntegrationConfig) => ({ ...prev, [field]: value }));
  };

  const getBadgeClass = (configured: boolean) =>
    configured ? 'badge-success' : 'badge-warning';

  const serviceSettings = settings?.[def.service as keyof IntegrationSettings] as
    | { enabled: boolean; configured: boolean }
    | undefined;

  const handleTest = () => {
    if (testValue && onTest) {
      onTest(testValue);
      setTestValue('');
    }
  };

  return (
    <div className="settings-section">
      <div className="section-header">
        <div className="flex items-center justify-between">
          <div>
            <h2>
              <def.icon size={24} className="icon-valign-middle icon-mr-sm" />
              {def.title}
            </h2>
            <p className="section-description">{def.description}</p>
          </div>
          {serviceSettings && (
            <span className={`badge ${getBadgeClass(serviceSettings.configured)}`}>
              {serviceSettings.configured ? 'Configured' : 'Not Configured'}
            </span>
          )}
        </div>
      </div>

      <div className="settings-grid">
        <div className="form-input-group">
          <label className="form-label">
            <input
              type="checkbox"
              checked={(config as IntegrationConfig).enabled}
              onChange={(e) => handleEnableChange(e.target.checked)}
            />
            Enable {def.title.split('(')[0].trim()}
          </label>
          <small className="form-help-text">
            {def.service === 'email' && 'Send emails automatically on invoice/PO creation'}
            {def.service === 'notifications' && 'Send SMS alerts automatically'}
            {def.service === 'weather' && 'Enable weather data for deliveries'}
            {def.service === 'validation' && 'Validate phone numbers before saving'}
            {def.service === 'currency' && 'Enable multi-currency support'}
            {def.service === 'tax' && 'Calculate tax automatically on invoices'}
          </small>
        </div>

        {expanded && def.fields.map((field) => (
          <FormInput
            key={field.name}
            label={field.label}
            name={field.name}
            type={(field.type || 'text') as 'text' | 'number' | 'email' | 'password' | 'date' | 'tel' | 'textarea' | 'select' | 'searchable-select' | 'checkbox'}
            value={(config as unknown as Record<string, string | number | boolean>)[field.name] as string | number | boolean}
            onChange={(e) => updateField(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        ))}
      </div>

      {expanded && (
        <>
          <div className="section-actions mt-md">
            <Button
              onClick={() => onSave(def.service, config as unknown as Record<string, unknown>)}
              loading={isPending}
            >
              Save Settings
            </Button>
          </div>

          {def.testEnabled && serviceSettings?.enabled && onTest && (
            <div
              className="mt-md p-md"
              style={{
                backgroundColor: 'var(--neutral-50)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h4>Test {def.service === 'email' ? 'Email' : 'SMS'}</h4>
              <div className="flex gap-sm mt-xs">
                <div className="flex-1">
                  <label className="form-label">
                    {def.service === 'email' ? 'Test Recipient' : 'Test Phone Number'}
                  </label>
                  <input
                    type={def.service === 'email' ? 'email' : 'text'}
                    className="form-input"
                    value={testValue}
                    onChange={(e) => setTestValue(e.target.value)}
                    placeholder={def.testPlaceholder || ''}
                  />
                </div>
                <Button
                  onClick={handleTest}
                  loading={testPending}
                  disabled={!testValue}
                  className="mt-xl"
                >
                  Send Test
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
