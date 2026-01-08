import { Request, Response } from 'express';
import db from '../config/database';

function getSettings(req: Request, res: Response): void {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();

    const settingsObj: Record<string, any> = settings.reduce((acc, setting: any) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        updated_at: setting.updated_at
      };
      return acc;
    }, {});

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

function getSetting(req: Request, res: Response): void {
  try {
    const { key } = req.params;
    const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);

    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }

    res.json(setting);
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
}

function updateSetting(req: Request, res: Response): void {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (!value) {
      res.status(400).json({ error: 'Value is required' });
      return;
    }

    const existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key) as any;

    if (existing) {
      db.prepare(`
        UPDATE settings
        SET value = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE key = ?
      `).run(value, description || existing.description, key);
    } else {
      db.prepare(`
        INSERT INTO settings (key, value, description)
        VALUES (?, ?, ?)
      `).run(key, value, description || null);
    }

    const updated = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
    res.json(updated);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
}

function updateSettings(req: Request, res: Response): void {
  try {
    const settings = req.body as Record<string, any>;

    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: 'Invalid settings data' });
      return;
    }

    const transaction = db.transaction(() => {
      Object.entries(settings).forEach(([key, data]) => {
        const value = typeof data === 'object' ? data.value : data;
        const description = typeof data === 'object' ? data.description : null;

        const existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key) as any;

        if (existing) {
          db.prepare(`
            UPDATE settings
            SET value = ?, description = ?, updated_at = CURRENT_TIMESTAMP
            WHERE key = ?
          `).run(value, description || existing.description, key);
        } else {
          db.prepare(`
            INSERT INTO settings (key, value, description)
            VALUES (?, ?, ?)
          `).run(key, value, description);
        }
      });
    });

    transaction();

    const allSettings = db.prepare('SELECT * FROM settings').all();
    const settingsObj: Record<string, any> = allSettings.reduce((acc, setting: any) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        updated_at: setting.updated_at
      };
      return acc;
    }, {});

    res.json(settingsObj);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

function initializeDefaults(): void {
  const defaults = [
    { key: 'currency_symbol', value: '$', description: 'Currency symbol displayed throughout the application' },
    { key: 'currency_code', value: 'USD', description: 'Currency code (e.g., USD, EUR, PKR)' },
    { key: 'company_name', value: 'Mini ERP', description: 'Company name' },
    { key: 'date_format', value: 'MM/DD/YYYY', description: 'Date format preference' },
    { key: 'decimal_places', value: '2', description: 'Number of decimal places for currency' },
    { key: 'tooltip_timeout', value: '1', description: 'Tooltip auto-hide timeout in seconds' }
  ];

  defaults.forEach(({ key, value, description }) => {
    const existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
    if (!existing) {
      db.prepare(`
        INSERT INTO settings (key, value, description)
        VALUES (?, ?, ?)
      `).run(key, value, description);
    }
  });
}

export default {
  getSettings,
  getSetting,
  updateSetting,
  updateSettings,
  initializeDefaults
};
