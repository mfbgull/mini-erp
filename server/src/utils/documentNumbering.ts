import Database from 'better-sqlite3';
import db from '../config/database';
import { getNextSequenceNumber } from './sequence';

function generateDocumentNo(prefix: string): string {
  const year = new Date().getFullYear();
  const settingKey = `${prefix}_last_no_${year}`;
  const nextNo = getNextSequenceNumber(db, settingKey);
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
