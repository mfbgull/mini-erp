import Database from 'better-sqlite3';

/**
 * Atomically get the next number in a sequence, using INSERT ... ON CONFLICT
 * to prevent race conditions under concurrent access.
 *
 * The settings table key is used as the sequence name.
 * First call initializes to 1, subsequent calls increment atomically.
 */
export function getNextSequenceNumber(db: Database.Database, settingKey: string): number {
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, '1', CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = CAST(CAST(settings.value AS INTEGER) + 1 AS TEXT),
      updated_at = CURRENT_TIMESTAMP
  `).run(settingKey);

  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as { value: string };
  return parseInt(setting.value, 10);
}

/**
 * Generate a year-based document number: PREFIX-YEAR-NNNN
 * e.g., generateDocNo(db, 'INV') → 'INV-2026-0001'
 */
export function generateDocNo(db: Database.Database, prefix: string, padLength = 4): string {
  const year = new Date().getFullYear();
  const settingKey = `${prefix}_last_no_${year}`;
  const nextNo = getNextSequenceNumber(db, settingKey);
  return `${prefix}-${year}-${nextNo.toString().padStart(padLength, '0')}`;
}

/**
 * Initialize a sequence from the MAX value already in a table column.
 * Only sets the value if the setting doesn't already exist.
 * The prefixPattern is used to filter existing codes (e.g. 'CUST', 'SUP-%').
 */
export function initializeSequenceFromMax(
  db: Database.Database,
  settingKey: string,
  tableName: string,
  columnName: string,
  prefixPattern: string
): void {
  const allowedTables = new Set(['customers', 'suppliers', 'items', 'purchases', 'invoices', 'payments', 'productions']);
  const allowedColumns = new Set(['customer_code', 'supplier_code', 'item_code', 'purchase_no', 'invoice_no', 'payment_no', 'production_no']);
  if (!allowedTables.has(tableName) || !allowedColumns.has(columnName)) {
    throw new Error(`Invalid table or column name: ${tableName}.${columnName}`);
  }

  const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as { value: string } | undefined;
  if (!existing) {
    const maxResult = db.prepare(
      `SELECT MAX(${columnName}) as max_val FROM ${tableName} WHERE ${columnName} LIKE ?`
    ).get(`${prefixPattern}%`) as { max_val: string | null } | undefined;
    const maxVal = maxResult?.max_val ?? null;
    let maxNo = 0;
    if (maxVal) {
      const numStr = maxVal.replace(/[^0-9]/g, '');
      maxNo = parseInt(numStr, 10) || 0;
    }
    db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(settingKey, maxNo.toString());
  }
}
