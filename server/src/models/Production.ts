import Database from 'better-sqlite3';

interface Production {
  id: number;
  production_no: string;
  output_item_id: number;
  output_quantity: number;
  warehouse_id: number;
  raw_materials_warehouse_id?: number;
  production_date: string;
  bom_id?: number;
  remarks?: string;
  created_by: number;
  created_at?: string;
  output_item_code?: string;
  output_item_name?: string;
  output_uom?: string;
  finished_goods_warehouse_code?: string;
  finished_goods_warehouse_name?: string;
  raw_materials_warehouse_code?: string;
  raw_materials_warehouse_name?: string;
  created_by_username?: string;
  inputs?: ProductionInput[];
}

interface ProductionInput {
  id: number;
  production_id: number;
  item_id: number;
  quantity: number;
  warehouse_id: number;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
  warehouse_code?: string;
  warehouse_name?: string;
}

interface ProductionFilters {
  start_date?: string;
  end_date?: string;
  output_item_id?: number;
  warehouse_id?: number;
  raw_materials_warehouse_id?: number;
  limit?: number;
}

interface CreateProductionDTO {
  output_item_id: number;
  output_quantity: number;
  warehouse_id: number;
  raw_materials_warehouse_id?: number;
  production_date: string;
  input_items: { item_id: number; quantity: number }[];
  bom_id?: number;
  remarks?: string;
}

class ProductionModel {
  static recordProduction(data: CreateProductionDTO, userId: number, db: Database.Database): Production {
    const {
      output_item_id,
      output_quantity,
      warehouse_id,
      raw_materials_warehouse_id,
      production_date,
      input_items,
      bom_id,
      remarks
    } = data;

    const materialsWarehouseId = raw_materials_warehouse_id || warehouse_id;

    const transaction = db.transaction(() => {
      const productionNo = this.generateProductionNo(db);

      const productionStmt = db.prepare(`
        INSERT INTO productions (
          production_no, output_item_id, output_quantity, warehouse_id,
          raw_materials_warehouse_id, production_date, bom_id, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = productionStmt.run(
        productionNo,
        output_item_id,
        output_quantity,
        warehouse_id,
        materialsWarehouseId,
        production_date,
        bom_id || null,
        remarks || null,
        userId
      );

      const productionId = result.lastInsertRowid as number;

      const inputStmt = db.prepare(`
        INSERT INTO production_inputs (
          production_id, item_id, quantity, warehouse_id
        ) VALUES (?, ?, ?, ?)
      `);

      const movementNo = 'STK-' + new Date().getFullYear() + '-0001';

      for (const input of input_items) {
        const stockBalance = db.prepare(`
          SELECT quantity FROM stock_balances
          WHERE item_id = ? AND warehouse_id = ?
        `).get(input.item_id, materialsWarehouseId) as { quantity: any } | undefined;

        const availableStock = stockBalance ? parseFloat(String(stockBalance.quantity)) : 0;

        if (availableStock < input.quantity) {
          const item = db.prepare('SELECT item_name FROM items WHERE id = ?').get(input.item_id) as { item_name: string };
          throw new Error(`Insufficient stock for ${item.item_name} in warehouse. Available: ${availableStock}, Required: ${input.quantity}`);
        }

        inputStmt.run(productionId, input.item_id, input.quantity, materialsWarehouseId);

        db.prepare(`
          INSERT INTO stock_movements (
            movement_no, item_id, warehouse_id, movement_type,
            quantity, unit_cost, reference_doctype, reference_docno,
            remarks, movement_date, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          movementNo,
          input.item_id,
          materialsWarehouseId,
          'PRODUCTION',
          -input.quantity,
          null,
          'Production',
          productionNo,
          `Consumed for production: ${productionNo} (from warehouse)`,
          production_date,
          userId
        );

        const existingBalance = db.prepare(`
          SELECT * FROM stock_balances
          WHERE item_id = ? AND warehouse_id = ?
        `).get(input.item_id, materialsWarehouseId) as any;

        if (existingBalance) {
          db.prepare(`
            UPDATE stock_balances
            SET quantity = quantity + ?,
                last_updated = CURRENT_TIMESTAMP
            WHERE item_id = ? AND warehouse_id = ?
          `).run(-input.quantity, input.item_id, materialsWarehouseId);
        } else {
          db.prepare(`
            INSERT INTO stock_balances (item_id, warehouse_id, quantity)
            VALUES (?, ?, ?)
          `).run(input.item_id, materialsWarehouseId, -input.quantity);
        }

        db.prepare(`
          UPDATE items
          SET current_stock = (
            SELECT COALESCE(SUM(quantity), 0)
            FROM stock_balances
            WHERE item_id = ?
          )
          WHERE id = ?
        `).run(input.item_id, input.item_id);
      }

      db.prepare(`
        INSERT INTO stock_movements (
          movement_no, item_id, warehouse_id, movement_type,
          quantity, unit_cost, reference_doctype, reference_docno,
          remarks, movement_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movementNo,
        output_item_id,
        warehouse_id,
        'PRODUCTION',
        output_quantity,
        null,
        'Production',
        productionNo,
        `Produced to: ${productionNo} (to warehouse)`,
        production_date,
        userId
      );

      const outputExistingBalance = db.prepare(`
        SELECT * FROM stock_balances
        WHERE item_id = ? AND warehouse_id = ?
      `).get(output_item_id, warehouse_id) as any;

      if (outputExistingBalance) {
        db.prepare(`
          UPDATE stock_balances
          SET quantity = quantity + ?,
              last_updated = CURRENT_TIMESTAMP
          WHERE item_id = ? AND warehouse_id = ?
        `).run(output_quantity, output_item_id, warehouse_id);
      } else {
        db.prepare(`
          INSERT INTO stock_balances (item_id, warehouse_id, quantity)
          VALUES (?, ?, ?)
        `).run(output_item_id, warehouse_id, output_quantity);
      }

      db.prepare(`
        UPDATE items
        SET current_stock = (
          SELECT COALESCE(SUM(quantity), 0)
          FROM stock_balances
          WHERE item_id = ?
        )
        WHERE id = ?
      `).run(output_item_id, output_item_id);

      db.prepare(`
        INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        'CREATE',
        'Production',
        productionId,
        `Recorded production ${productionNo}: ${output_quantity} units produced (Materials from: WH-${materialsWarehouseId}, Goods to: WH-${warehouse_id})`
      );

      return this.getById(productionId, db) as Production;
    });

    return transaction();
  }

  static generateProductionNo(db: Database.Database): string {
    const year = new Date().getFullYear();
    const settingKey = `PROD_last_no_${year}`;

    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as { value: string } | undefined;

    let nextNo = 1;
    if (setting) {
      nextNo = parseInt(setting.value) + 1;
    }

    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(settingKey, nextNo.toString());

    return `PROD-${year}-${nextNo.toString().padStart(4, '0')}`;
  }

  static getAll(filters: ProductionFilters = {}, db: Database.Database): Production[] {
    let query = `
      SELECT
        p.*,
        i.item_code as output_item_code,
        i.item_name as output_item_name,
        i.unit_of_measure as output_uom,
        fgw.warehouse_code as finished_goods_warehouse_code,
        fgw.warehouse_name as finished_goods_warehouse_name,
        rmw.warehouse_code as raw_materials_warehouse_code,
        rmw.warehouse_name as raw_materials_warehouse_name,
        u.username as created_by_username
      FROM productions p
      JOIN items i ON p.output_item_id = i.id
      JOIN warehouses fgw ON p.warehouse_id = fgw.id
      LEFT JOIN warehouses rmw ON p.raw_materials_warehouse_id = rmw.id
      JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.start_date) {
      query += ` AND p.production_date >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND p.production_date <= ?`;
      params.push(filters.end_date);
    }

    if (filters.output_item_id) {
      query += ` AND p.output_item_id = ?`;
      params.push(filters.output_item_id);
    }

    if (filters.warehouse_id) {
      query += ` AND p.warehouse_id = ?`;
      params.push(filters.warehouse_id);
    }

    if (filters.raw_materials_warehouse_id) {
      query += ` AND p.raw_materials_warehouse_id = ?`;
      params.push(filters.raw_materials_warehouse_id);
    }

    query += ` ORDER BY p.production_date DESC, p.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }

    return db.prepare(query).all(...params) as Production[];
  }

  static getById(id: number, db: Database.Database): Production | undefined {
    const production = db.prepare(`
      SELECT
        p.*,
        i.item_code as output_item_code,
        i.item_name as output_item_name,
        i.unit_of_measure as output_uom,
        fgw.warehouse_code as finished_goods_warehouse_code,
        fgw.warehouse_name as finished_goods_warehouse_name,
        rmw.warehouse_code as raw_materials_warehouse_code,
        rmw.warehouse_name as raw_materials_warehouse_name,
        u.username as created_by_username
      FROM productions p
      JOIN items i ON p.output_item_id = i.id
      JOIN warehouses fgw ON p.warehouse_id = fgw.id
      LEFT JOIN warehouses rmw ON p.raw_materials_warehouse_id = rmw.id
      JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(id) as Production | undefined;

    if (production) {
      production.inputs = db.prepare(`
        SELECT
          pi.*,
          i.item_code,
          i.item_name,
          i.unit_of_measure,
          w.warehouse_code as warehouse_code,
          w.warehouse_name as warehouse_name
        FROM production_inputs pi
        JOIN items i ON pi.item_id = i.id
        JOIN warehouses w ON pi.warehouse_id = w.id
        WHERE pi.production_id = ?
      `).all(id) as ProductionInput[];
    }

    return production;
  }

  static getSummaryByItem(item_id: number, db: Database.Database) {
    return db.prepare(`
      SELECT
        COUNT(*) as production_count,
        SUM(output_quantity) as total_quantity_produced,
        MIN(production_date) as first_production_date,
        MAX(production_date) as last_production_date
      FROM productions
      WHERE output_item_id = ?
    `).get(item_id);
  }

  static delete(id: number, userId: number, db: Database.Database): boolean {
    const production = this.getById(id, db);

    if (!production) {
      throw new Error('Production not found');
    }

    db.prepare('DELETE FROM production_inputs WHERE production_id = ?').run(id);

    db.prepare('DELETE FROM productions WHERE id = ?').run(id);

    db.prepare(`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userId,
      'DELETE',
      'Production',
      id,
      `Deleted production ${production.production_no}`
    );

    return true;
  }
}

export default ProductionModel;
