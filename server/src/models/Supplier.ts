import Database from 'better-sqlite3';

interface Supplier {
  id: number;
  supplier_code: string;
  supplier_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

interface CreateSupplierDTO {
  supplier_code: string;
  supplier_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
}

interface UpdateSupplierDTO {
  supplier_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  is_active?: boolean;
}

class SupplierModel {
  static getAll(db: Database.Database): Supplier[] {
    return db.prepare(`
      SELECT
        id, supplier_code, supplier_name, contact_person,
        email, phone, address, payment_terms, is_active,
        created_at, updated_at
      FROM suppliers
      WHERE is_active = 1
      ORDER BY supplier_name
    `).all() as Supplier[];
  }

  static getById(id: number, db: Database.Database): Supplier | undefined {
    return db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as Supplier | undefined;
  }

  static create(data: CreateSupplierDTO, db: Database.Database): number {
    const result = db.prepare(`
      INSERT INTO suppliers (
        supplier_code, supplier_name, contact_person,
        email, phone, address, payment_terms
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.supplier_code,
      data.supplier_name,
      data.contact_person || null,
      data.email || null,
      data.phone || null,
      data.address || null,
      data.payment_terms || null
    );
    return result.lastInsertRowid as number;
  }

  static update(id: number, data: UpdateSupplierDTO, db: Database.Database): Database.RunResult {
    return db.prepare(`
      UPDATE suppliers SET
        supplier_name = ?,
        contact_person = ?,
        email = ?,
        phone = ?,
        address = ?,
        payment_terms = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.supplier_name || null,
      data.contact_person || null,
      data.email || null,
      data.phone || null,
      data.address || null,
      data.payment_terms || null,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      id
    );
  }

  static delete(id: number, db: Database.Database): Database.RunResult {
    return db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
  }

  static countPurchaseOrders(supplierId: number, db: Database.Database): { count: number } {
    return db.prepare('SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ?').get(supplierId) as { count: number };
  }
}

export default SupplierModel;
