import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import settingsController from '../controllers/settingsController';
import emailService from '../services/integrations/emailService';
import notificationService from '../services/integrations/notificationService';
import weatherService from '../services/integrations/weatherService';
import validationService from '../services/integrations/validationService';
import currencyService from '../services/integrations/currencyService';
import taxService from '../services/integrations/taxService';
import logger from '../utils/logger';

const router = Router();

// All integration routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * Get all integration settings
 */
router.get('/settings', (_req: Request, res: Response): void => {
  try {
    const integrationSettings = settingsController.getIntegrationSettings();
    res.json(integrationSettings);
  } catch (error) {
    logger.error('Get integration settings error:', error);
    res.status(500).json({ error: 'Failed to fetch integration settings' });
  }
});

/**
 * Update integration setting
 */
router.put('/settings/:service', (req: Request, res: Response): void => {
  try {
    const { service } = req.params;

    const serviceKey = typeof service === 'string' ? service : service[0];
    settingsController.updateIntegrationSettings(serviceKey, req.body);

    // Reload service settings
    if (serviceKey === 'email') emailService.reloadSettings();
    if (serviceKey === 'notifications') notificationService.reloadSettings();
    if (serviceKey === 'weather') weatherService.reloadSettings();
    if (serviceKey === 'validation') validationService.reloadSettings();
    if (serviceKey === 'currency') currencyService.reloadSettings();
    if (serviceKey === 'tax') taxService.reloadSettings();

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    logger.error('Update integration settings error:', error);
    if (error instanceof Error && error.message === 'Invalid service name') {
      res.status(400).json({ error: 'Invalid service name' });
    } else {
      res.status(500).json({ error: 'Failed to update integration settings' });
    }
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
    logger.error('Test email error:', error);
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
    logger.error('Test notification error:', error);
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
    logger.error('Get weather error:', error);
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
    logger.error('Validate phone error:', error);
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
    logger.error('Get exchange rates error:', error);
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
    logger.error('Convert currency error:', error);
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
    logger.error('Calculate tax error:', error);
    res.status(500).json({ error: 'Failed to calculate tax' });
  }
});

export default router;
