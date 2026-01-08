import Database from 'better-sqlite3';
import db from '../config/database';

function generateDocumentNo(prefix: string): string {
  const year = new Date().getFullYear();
  const settingKey = `${prefix}_last_no_${year}`;

  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as { value: string } | undefined;

  let nextNo = 1;
  if (setting) {
    nextNo = parseInt(setting.value) + 1;
  }

  db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `).run(settingKey, nextNo.toString());

  return `${prefix}-${year}-${nextNo.toString().padStart(4, '0')}`;
}

export default {
  generatePONo: () => generateDocumentNo('PO'),
  generateSONo: () => generateDocumentNo('SO'),
  generateInvoiceNo: () => generateDocumentNo('INV'),
  generateWONo: () => generateDocumentNo('WO'),
  generateBOMNo: () => generateDocumentNo('BOM'),
  generateReceiptNo: () => generateDocumentNo('GR'),
  generatePaymentNo: () => generateDocumentNo('PAY')
};
