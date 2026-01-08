import Database from 'better-sqlite3';

interface Purchase {
  id: number;
  purchase_no: string;
  item_id: number;
  warehouse_id: number;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier_name?: string;
  purchase_date: string;
  invoice_no?: string;
  remarks?: string;
  created_by: number;
  created_at?: string;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
  warehouse_code?: string;
  warehouse_name?: string;
  created_by_username?: string;
}

interface PurchaseFilters {
  start_date?: string;
  end_date?: string;
  item_id?: number;
  warehouse_id?: number;
  supplier_name?: string;
  limit?: number;
}

interface CreatePurchaseDTO {
  item_id: number;
  warehouse_id: number;
  quantity: number;
  unit_cost: number;
  supplier_name?: string;
  purchase_date: string;
  invoice_no?: string;
  remarks?: string;
}

class PurchaseModel {
  static recordPurchase(data: CreatePurchaseDTO, userId: number, db: Database.Database): Purchase {
    const { item_id, warehouse_id, quantity, unit_cost, supplier_name, purchase_date, invoice_no, remarks } = data;

    const transaction = db.transaction(() => {
      const purchaseNo = this.generatePurchaseNo(db);

      const purchaseStmt = db.prepare(`
        INSERT INTO purchases (
          purchase_no, item_id, warehouse_id, quantity, unit_cost, total_cost,
          supplier_name, purchase_date, invoice_no, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const totalCost = quantity * unit_cost;

      const result = purchaseStmt.run(
        purchaseNo,
        item_id,
        warehouse_id,
        quantity,
        unit_cost,
        totalCost,
        supplier_name || null,
        purchase_date,
        invoice_no || null,
        remarks || null,
        userId
      );

      const purchaseId = result.lastInsertRowid as number;

      const movementNo = 'STK-' + new Date().getFullYear() + '-0001';
      db.prepare(`
        INSERT INTO stock_movements (
          movement_no, item_id, warehouse_id, movement_type,
          quantity, unit_cost, reference_doctype, reference_docno,
          remarks, movement_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movementNo,
        item_id,
        warehouse_id,
        'PURCHASE',
        quantity,
        unit_cost,
        'Purchase',
        purchaseNo,
        `Purchase: ${purchaseNo}${supplier_name ? ' from ' + supplier_name : ''}`,
        purchase_date,
        userId
      );

      const existingBalance = db.prepare(`
        SELECT * FROM stock_balances
        WHERE item_id = ? AND warehouse_id = ?
      `).get(item_id, warehouse_id) as any;

      if (existingBalance) {
        db.prepare(`
          UPDATE stock_balances
          SET quantity = quantity + ?,
              last_updated = CURRENT_TIMESTAMP
          WHERE item_id = ? AND warehouse_id = ?
        `).run(quantity, item_id, warehouse_id);
      } else {
        db.prepare(`
          INSERT INTO stock_balances (item_id, warehouse_id, quantity)
          VALUES (?, ?, ?)
        `).run(item_id, warehouse_id, quantity);
      }

      db.prepare(`
        UPDATE items
        SET current_stock = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM stock_balances
          WHERE item_id = ?
        )
        WHERE id = ?
      `).run(item_id, item_id);

      db.prepare(`
        INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        'CREATE',
        'Purchase',
        purchaseId,
        `Recorded purchase ${purchaseNo}: ${quantity} units`
      );

      return this.getById(purchaseId, db) as Purchase;
    });

    return transaction();
  }

  static generatePurchaseNo(db: Database.Database): string {
    const year = new Date().getFullYear();
    const settingKey = `PURCH_last_no_${year}`;

    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as { value: string } | undefined;

    let nextNo = 1;
    if (setting) {
      nextNo = parseInt(setting.value) + 1;
    }

    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(settingKey, nextNo.toString());

    return `PURCH-${year}-${nextNo.toString().padStart(4, '0')}`;
  }

  static getAll(filters: PurchaseFilters = {}, db: Database.Database): Purchase[] {
    let query = `
      SELECT
        p.*,
        i.item_code,
        i.item_name,
        i.unit_of_measure,
        w.warehouse_code,
        w.warehouse_name,
        u.username as created_by_username
      FROM purchases p
      JOIN items i ON p.item_id = i.id
      JOIN warehouses w ON p.warehouse_id = w.id
      JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.start_date) {
      query += ` AND p.purchase_date >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND p.purchase_date <= ?`;
      params.push(filters.end_date);
    }

    if (filters.item_id) {
      query += ` AND p.item_id = ?`;
      params.push(filters.item_id);
    }

    if (filters.warehouse_id) {
      query += ` AND p.warehouse_id = ?`;
      params.push(filters.warehouse_id);
    }

    if (filters.supplier_name) {
      query += ` AND p.supplier_name LIKE ?`;
      params.push(`%${filters.supplier_name}%`);
    }

    query += ` ORDER BY p.purchase_date DESC, p.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }

    return db.prepare(query).all(...params) as Purchase[];
  }

  static getById(id: number, db: Database.Database): Purchase | undefined {
    return db.prepare(`
      SELECT
        p.*,
        i.item_code,
        i.item_name,
        i.unit_of_measure,
        w.warehouse_code,
        w.warehouse_name,
        u.username as created_by_username
      FROM purchases p
      JOIN items i ON p.item_id = i.id
      JOIN warehouses w ON p.warehouse_id = w.id
      JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(id) as Purchase | undefined;
  }

  static getSummaryByItem(item_id: number, db: Database.Database) {
    return db.prepare(`
      SELECT
        COUNT(*) as purchase_count,
        SUM(quantity) as total_quantity,
        SUM(total_cost) as total_cost,
        AVG(unit_cost) as avg_unit_cost,
        MIN(purchase_date) as first_purchase_date,
        MAX(purchase_date) as last_purchase_date
      FROM purchases
      WHERE item_id = ?
    `).get(item_id);
  }

  static getSummaryByDateRange(start_date: string, end_date: string, db: Database.Database) {
    return db.prepare(`
      SELECT
        COUNT(*) as purchase_count,
        SUM(quantity) as total_quantity,
        SUM(total_cost) as total_cost,
        COUNT(DISTINCT item_id) as unique_items,
        COUNT(DISTINCT supplier_name) as unique_suppliers
      FROM purchases
      WHERE purchase_date BETWEEN ? AND ?
    `).get(start_date, end_date);
  }

  static getTopSuppliers(limit: number = 10, db: Database.Database) {
    return db.prepare(`
      SELECT
        supplier_name,
        COUNT(*) as purchase_count,
        SUM(quantity) as total_quantity,
        SUM(total_cost) as total_cost
      FROM purchases
      WHERE supplier_name IS NOT NULL
      GROUP BY supplier_name
      ORDER BY total_cost DESC
      LIMIT ?
    `).all(limit);
  }

  static delete(id: number, userId: number, db: Database.Database): boolean {
    const purchase = this.getById(id, db);

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    db.prepare('DELETE FROM purchases WHERE id = ?').run(id);

    db.prepare(`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userId,
      'DELETE',
      'Purchase',
      id,
      `Deleted purchase ${purchase.purchase_no}`
    );

    return true;
  }
}

export default PurchaseModel;
