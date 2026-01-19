import { Router, Request, Response } from 'express';
import db from '../config/database';
import emailService from '../services/integrations/emailService';
import notificationService from '../services/integrations/notificationService';
import weatherService from '../services/integrations/weatherService';
import validationService from '../services/integrations/validationService';
import currencyService from '../services/integrations/currencyService';
import taxService from '../services/integrations/taxService';

const router = Router();

/**
 * Get all integration settings
 */
router.get('/settings', (req: Request, res: Response): void => {
  try {
    const integrationSettings = {
      email: {
        enabled: false,
        configured: false
      },
      notifications: {
        enabled: false,
        configured: false
      },
      weather: {
        enabled: false,
        configured: false
      },
      validation: {
        enabled: false,
        configured: false
      },
      currency: {
        enabled: false,
        configured: false
      },
      tax: {
        enabled: false,
        configured: false
      }
    };

    const settings = db.prepare(`
      SELECT key, value
      FROM settings
      WHERE key LIKE '%_enabled' OR key LIKE '%_api_key'
    `).all() as any[];

    settings.forEach((setting: any) => {
      if (setting.key === 'sendgrid_enabled') {
        integrationSettings.email.enabled = setting.value === 'true';
      } else if (setting.key === 'sendgrid_api_key') {
        integrationSettings.email.configured = !!setting.value;
      } else if (setting.key === 'twilio_enabled') {
        integrationSettings.notifications.enabled = setting.value === 'true';
      } else if (setting.key === 'twilio_auth_token') {
        integrationSettings.notifications.configured = !!setting.value;
      } else if (setting.key === 'weather_enabled') {
        integrationSettings.weather.enabled = setting.value === 'true';
      } else if (setting.key === 'weather_api_key') {
        integrationSettings.weather.configured = !!setting.value;
      } else if (setting.key === 'validation_enabled') {
        integrationSettings.validation.enabled = setting.value === 'true';
      } else if (setting.key === 'validation_api_key') {
        integrationSettings.validation.configured = !!setting.value;
      } else if (setting.key === 'currency_enabled') {
        integrationSettings.currency.enabled = setting.value === 'true';
      } else if (setting.key === 'currency_api_key') {
        integrationSettings.currency.configured = !!setting.value;
      } else if (setting.key === 'tax_enabled') {
        integrationSettings.tax.enabled = setting.value === 'true';
      } else if (setting.key === 'tax_api_key') {
        integrationSettings.tax.configured = !!setting.value;
      }
    });

    res.json(integrationSettings);
  } catch (error) {
    console.error('Get integration settings error:', error);
    res.status(500).json({ error: 'Failed to fetch integration settings' });
  }
});

/**
 * Update integration setting
 */
router.put('/settings/:service', (req: Request, res: Response): void => {
  try {
    const { service } = req.params;
    const { enabled, apiKey, ...otherSettings } = req.body;

    const serviceKeys: Record<string, { enabled: string; api_key: string; others: Record<string, string> }> = {
      email: { enabled: 'sendgrid_enabled', api_key: 'sendgrid_api_key', others: { from_email: 'sendgrid_from_email', from_name: 'sendgrid_from_name' } },
      notifications: { enabled: 'twilio_enabled', api_key: 'twilio_auth_token', others: { account_sid: 'twilio_account_sid', phone_number: 'twilio_phone_number' } },
      weather: { enabled: 'weather_enabled', api_key: 'weather_api_key', others: { default_location: 'weather_default_location' } },
      validation: { enabled: 'validation_enabled', api_key: 'validation_api_key', others: {} },
      currency: { enabled: 'currency_enabled', api_key: 'currency_api_key', others: { base: 'currency_base', update_interval: 'currency_rates_update_interval' } },
      tax: { enabled: 'tax_enabled', api_key: 'tax_api_key', others: { default_country: 'tax_default_country', zip_code: 'tax_zip_code' } }
    };

    const serviceKey = Array.isArray(service) ? service[0] : service;
    const keys = serviceKeys[serviceKey];
    if (!keys) {
      res.status(400).json({ error: 'Invalid service name' });
      return;
    }

    const transaction = db.transaction(() => {
      // Update enabled status
      db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(
        enabled ? 'true' : 'false',
        keys.enabled
      );

      // Update API key
      db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(
        apiKey || '',
        keys.api_key
      );

      // Update other settings
      Object.entries(keys.others).forEach(([dbKey, settingKey]) => {
        const value = otherSettings[dbKey];
        if (value !== undefined) {
          db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(
            value,
            settingKey
          );
        }
      });
    });

    transaction();

    // Reload service settings
    if (service === 'email') emailService.reloadSettings();
    if (service === 'notifications') notificationService.reloadSettings();
    if (service === 'weather') weatherService.reloadSettings();
    if (service === 'validation') validationService.reloadSettings();
    if (service === 'currency') currencyService.reloadSettings();
    if (service === 'tax') taxService.reloadSettings();

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update integration settings error:', error);
    res.status(500).json({ error: 'Failed to update integration settings' });
  }
});

/**
 * Test email service
 */
router.post('/test/email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { to } = req.body;

    if (!to) {
      res.status(400).json({ error: 'Recipient email is required' });
      return;
    }

    const result = await emailService.sendEmail({
      to,
      subject: 'Mini ERP - Email Test',
      html: '<p>This is a test email from Mini ERP. Your email integration is working correctly!</p>'
    });

    res.json(result);
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

/**
 * Test notification service
 */
router.post('/test/notification', async (req: Request, res: Response): Promise<void> => {
  try {
    const { to } = req.body;

    if (!to) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const result = await notificationService.sendSMS({
      to,
      message: 'This is a test SMS from Mini ERP. Your notification integration is working correctly!'
    });

    res.json(result);
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

/**
 * Get weather data
 */
router.get('/weather', async (req: Request, res: Response): Promise<void> => {
  try {
    const { location } = req.query;

    if (!location || typeof location !== 'string') {
      res.status(400).json({ error: 'Location is required' });
      return;
    }

    const result = await weatherService.getWeather(location);
    res.json(result);
  } catch (error) {
    console.error('Get weather error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

/**
 * Validate phone number
 */
router.get('/validate/phone', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.query;

    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const result = await validationService.validatePhoneNumber(phone);
    res.json(result);
  } catch (error) {
    console.error('Validate phone error:', error);
    res.status(500).json({ error: 'Failed to validate phone number' });
  }
});

/**
 * Get exchange rates
 */
router.get('/currency/rates', async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbols } = req.query;
    const symbolsArray = typeof symbols === 'string' ? symbols.split(',') : undefined;

    const result = await currencyService.getExchangeRates(symbolsArray);
    res.json(result);
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

/**
 * Convert currency
 */
router.post('/currency/convert', async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      res.status(400).json({ error: 'Amount, from currency, and to currency are required' });
      return;
    }

    const result = await currencyService.convertCurrency(amount, from, to);
    res.json(result);
  } catch (error) {
    console.error('Convert currency error:', error);
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

/**
 * Calculate tax
 */
router.post('/tax/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { toCountry, toZip, toState, toCity, toStreet, amount, shipping } = req.body;

    if (!amount) {
      res.status(400).json({ error: 'Amount is required' });
      return;
    }

    const result = await taxService.calculateTax(
      toZip,
      toCountry,
      toState,
      toCity,
      toStreet,
      amount,
      shipping
    );
    res.json(result);
  } catch (error) {
    console.error('Calculate tax error:', error);
    res.status(500).json({ error: 'Failed to calculate tax' });
  }
});

export default router;
