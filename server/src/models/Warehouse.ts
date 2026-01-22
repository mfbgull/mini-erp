import Database from 'better-sqlite3';

interface Warehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
  location?: string;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
}

interface CreateWarehouseDTO {
  warehouse_code: string;
  warehouse_name: string;
  location?: string;
}

interface UpdateWarehouseDTO {
  warehouse_name: string;
  location?: string;
}

interface StockSummary {
  id: number;
  item_code: string;
  item_name: string;
  unit_of_measure: string;
  quantity: number;
  standard_cost: number;
  value: number;
}

class WarehouseModel {
  static getAll(db: Database.Database): Warehouse[] {
    return db.prepare(`
      SELECT * FROM warehouses
      WHERE is_active = 1
      ORDER BY warehouse_name
    `).all() as Warehouse[];
  }

  static getById(id: number, db: Database.Database): Warehouse | undefined {
    return db.prepare('SELECT * FROM warehouses WHERE id = ?').get(id) as Warehouse | undefined;
  }

  static getByCode(code: string, db: Database.Database): Warehouse | undefined {
    return db.prepare('SELECT * FROM warehouses WHERE warehouse_code = ?').get(code) as Warehouse | undefined;
  }

  static create(data: CreateWarehouseDTO, db: Database.Database): number {
    const stmt = db.prepare(`
      INSERT INTO warehouses (warehouse_code, warehouse_name, location)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      data.warehouse_code,
      data.warehouse_name,
      data.location || null
    );

    return result.lastInsertRowid as number;
  }

  static update(id: number, data: UpdateWarehouseDTO, db: Database.Database): Database.RunResult {
    const stmt = db.prepare(`
      UPDATE warehouses
      SET warehouse_name = ?,
          location = ?
      WHERE id = ?
    `);

    return stmt.run(
      data.warehouse_name,
      data.location || null,
      id
    );
  }

  static delete(id: number, db: Database.Database): Database.RunResult {
    const stmt = db.prepare('UPDATE warehouses SET is_active = 0 WHERE id = ?');
    return stmt.run(id);
  }

  static getStockSummary(warehouseId: number, db: Database.Database): StockSummary[] {
    return db.prepare(`
      SELECT
        i.id,
        i.item_code,
        i.item_name,
        i.unit_of_measure,
        COALESCE(sb.quantity, 0) as quantity,
        i.standard_cost,
        COALESCE(sb.quantity, 0) * i.standard_cost as value
      FROM items i
      INNER JOIN stock_balances sb ON sb.item_id = i.id AND sb.warehouse_id = ?
      WHERE i.is_active = 1
      AND sb.quantity > 0
      ORDER BY i.item_name
    `).all(warehouseId) as StockSummary[];
  }
}

export default WarehouseModel;
