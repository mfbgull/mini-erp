import Database from 'better-sqlite3';

interface SupplierLedgerEntry {
  id: number;
  supplier_id: number;
  transaction_date: string;
  transaction_type: string;
  reference_no?: string;
  debit: number;
  credit: number;
  balance: number;
  description?: string;
  created_at?: string;
}

interface CreateLedgerEntryDTO {
  supplier_id: number;
  transaction_date: string;
  transaction_type: string;
  reference_no?: string;
  debit?: number;
  credit?: number;
  description?: string;
}

class SupplierLedgerModel {
  static createEntry(data: CreateLedgerEntryDTO, db: Database.Database): SupplierLedgerEntry {
    const { supplier_id, transaction_date, transaction_type, reference_no, debit = 0, credit = 0, description } = data;

    // Get current balance
    const currentBalance = this.getBalance(supplier_id, db);

    // Calculate new balance (debit increases liability, credit decreases)
    const newBalance = currentBalance + debit - credit;

    const stmt = db.prepare(`
      INSERT INTO supplier_ledger (
        supplier_id, transaction_date, transaction_type, reference_no,
        debit, credit, balance, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      supplier_id,
      transaction_date,
      transaction_type,
      reference_no || null,
      debit,
      credit,
      newBalance,
      description || null
    );

    return this.getById(result.lastInsertRowid as number, db) as SupplierLedgerEntry;
  }

  static getById(id: number, db: Database.Database): SupplierLedgerEntry | undefined {
    return db.prepare(`
      SELECT * FROM supplier_ledger WHERE id = ?
    `).get(id) as SupplierLedgerEntry | undefined;
  }

  static getBalance(supplier_id: number, db: Database.Database): number {
    const result = db.prepare(`
      SELECT balance FROM supplier_ledger
      WHERE supplier_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(supplier_id) as { balance: number } | undefined;

    return result?.balance || 0;
  }

  static getTransactions(supplier_id: number, db: Database.Database): SupplierLedgerEntry[] {
    return db.prepare(`
      SELECT * FROM supplier_ledger
      WHERE supplier_id = ?
      ORDER BY transaction_date DESC, created_at DESC
    `).all(supplier_id) as SupplierLedgerEntry[];
  }

  static getAllTransactions(db: Database.Database): SupplierLedgerEntry[] {
    return db.prepare(`
      SELECT
        sl.*,
        s.supplier_name
      FROM supplier_ledger sl
      JOIN suppliers s ON sl.supplier_id = s.id
      ORDER BY sl.transaction_date DESC, sl.created_at DESC
    `).all() as SupplierLedgerEntry[];
  }

  static getSupplierBalances(db: Database.Database): Array<{ supplier_id: number; supplier_name: string; balance: number }> {
    return db.prepare(`
      SELECT
        s.id as supplier_id,
        s.supplier_name,
        COALESCE(sl.balance, 0) as balance
      FROM suppliers s
      LEFT JOIN supplier_ledger sl
        ON s.id = sl.supplier_id
        AND sl.id = (
          SELECT MAX(id) FROM supplier_ledger WHERE supplier_id = s.id
        )
      WHERE s.is_active = 1
      ORDER BY balance DESC
    `).all() as Array<{ supplier_id: number; supplier_name: string; balance: number }>;
  }
}

export default SupplierLedgerModel;
