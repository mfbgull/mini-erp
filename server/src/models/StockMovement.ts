import Database from 'better-sqlite3';

interface StockMovement {
  id: number;
  movement_no: string;
  item_id: number;
  warehouse_id: number;
  movement_type: string;
  quantity: number;
  unit_cost?: number;
  reference_doctype?: string;
  reference_docno?: string;
  remarks?: string;
  movement_date: string;
  created_by: number;
  created_at?: string;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
  warehouse_code?: string;
  warehouse_name?: string;
  created_by_name?: string;
}

interface MovementFilters {
  item_id?: number;
  warehouse_id?: number;
  movement_type?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

interface RecordMovementDTO {
  item_id: number;
  warehouse_id: number;
  quantity: number;
  unit_cost?: number;
  reference_doctype?: string;
  reference_docno?: string;
  remarks?: string;
  movement_type: string;
  movement_date?: string;
}

class StockMovementModel {
  static recordMovement(data: RecordMovementDTO, userId: number, db: Database.Database): { id: number; movement_no: string } {
    const transaction = db.transaction(() => {
      const movementNo = this.generateMovementNo(db);

      const movementStmt = db.prepare(`
        INSERT INTO stock_movements (
          movement_no, item_id, warehouse_id, movement_type,
          quantity, unit_cost, reference_doctype, reference_docno,
          remarks, movement_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = movementStmt.run(
        movementNo,
        data.item_id,
        data.warehouse_id,
        data.movement_type,
        data.quantity,
        data.unit_cost || null,
        data.reference_doctype || null,
        data.reference_docno || null,
        data.remarks || null,
        data.movement_date || new Date().toISOString().split('T')[0],
        userId
      );

      const existingBalance = db.prepare(`
        SELECT * FROM stock_balances
        WHERE item_id = ? AND warehouse_id = ?
      `).get(data.item_id, data.warehouse_id) as any;

      if (existingBalance) {
        db.prepare(`
          UPDATE stock_balances
          SET quantity = quantity + ?,
              last_updated = CURRENT_TIMESTAMP
          WHERE item_id = ? AND warehouse_id = ?
        `).run(data.quantity, data.item_id, data.warehouse_id);
      } else {
        db.prepare(`
          INSERT INTO stock_balances (item_id, warehouse_id, quantity)
          VALUES (?, ?, ?)
        `).run(data.item_id, data.warehouse_id, data.quantity);
      }

      db.prepare(`
        UPDATE items
        SET current_stock = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM stock_balances
          WHERE item_id = ?
        )
        WHERE id = ?
      `).run(data.item_id, data.item_id);

      return {
        id: result.lastInsertRowid as number,
        movement_no: movementNo
      };
    });

    return transaction();
  }

  static generateMovementNo(db: Database.Database): string {
    const year = new Date().getFullYear();
    const settingKey = `STK_last_no_${year}`;

    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as { value: string } | undefined;

    let nextNo = 1;
    if (setting) {
      nextNo = parseInt(setting.value) + 1;
    }

    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value)
      VALUES (?, ?)
    `).run(settingKey, nextNo.toString());

    return `STK-${year}-${nextNo.toString().padStart(4, '0')}`;
  }

  static getAll(filters: MovementFilters = {}, db: Database.Database): StockMovement[] {
    let query = `
      SELECT
        sm.*,
        i.item_code,
        i.item_name,
        i.unit_of_measure,
        w.warehouse_code,
        w.warehouse_name,
        u.full_name as created_by_name
      FROM stock_movements sm
      JOIN items i ON sm.item_id = i.id
      JOIN warehouses w ON sm.warehouse_id = w.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.item_id) {
      query += ' AND sm.item_id = ?';
      params.push(filters.item_id);
    }

    if (filters.warehouse_id) {
      query += ' AND sm.warehouse_id = ?';
      params.push(filters.warehouse_id);
    }

    if (filters.movement_type) {
      query += ' AND sm.movement_type = ?';
      params.push(filters.movement_type);
    }

    if (filters.date_from) {
      query += ' AND sm.movement_date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND sm.movement_date <= ?';
      params.push(filters.date_to);
    }

    query += ' ORDER BY sm.movement_date DESC, sm.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return db.prepare(query).all(...params) as StockMovement[];
  }

  static getById(id: number, db: Database.Database): StockMovement | undefined {
    return db.prepare(`
      SELECT
        sm.*,
        i.item_code,
        i.item_name,
        i.unit_of_measure,
        w.warehouse_code,
        w.warehouse_name
      FROM stock_movements sm
      JOIN items i ON sm.item_id = i.id
      JOIN warehouses w ON sm.warehouse_id = w.id
      WHERE sm.id = ?
    `).get(id) as StockMovement | undefined;
  }

  static getItemLedger(itemId: number, warehouseId: number | null = null, db: Database.Database): StockMovement[] {
    let query = `
      SELECT
        sm.*,
        w.warehouse_code,
        w.warehouse_name
      FROM stock_movements sm
      JOIN warehouses w ON sm.warehouse_id = w.id
      WHERE sm.item_id = ?
    `;
    const params: any[] = [itemId];

    if (warehouseId) {
      query += ' AND sm.warehouse_id = ?';
      params.push(warehouseId);
    }

    query += ' ORDER BY sm.movement_date DESC, sm.created_at DESC';

    return db.prepare(query).all(...params) as StockMovement[];
  }

  static getStockSummary(db: Database.Database) {
    return db.prepare(`
      SELECT
        i.id,
        i.item_code,
        i.item_name,
        i.category,
        i.unit_of_measure,
        i.current_stock,
        i.reorder_level,
        i.standard_cost,
        i.current_stock * i.standard_cost as stock_value,
        CASE
          WHEN i.current_stock <= i.reorder_level AND i.reorder_level > 0 THEN 1
          ELSE 0
        END as low_stock
      FROM items i
      WHERE i.is_active = 1
      ORDER BY i.item_name
    `).all();
  }

  static getBalance(itemId: number, warehouseId: number, db: Database.Database) {
    return db.prepare(`
      SELECT COALESCE(quantity, 0) as quantity
      FROM stock_balances
      WHERE item_id = ? AND warehouse_id = ?
    `).get(itemId, warehouseId);
  }
}

export default StockMovementModel;
