import Database from 'better-sqlite3';

interface ItemLocation {
  id: number;
  item_id: number;
  warehouse_id: number;
  rack_no: string;
  is_primary: number;
  warehouse_code?: string;
  warehouse_name?: string;
  item_code?: string;
  item_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface CreateItemLocationDTO {
  item_id: number;
  warehouse_id: number;
  rack_no: string;
  is_primary?: boolean;
}

interface UpdateItemLocationDTO {
  warehouse_id?: number;
  rack_no?: string;
  is_primary?: boolean;
}

class ItemLocationModel {
  static getByItemId(itemId: number, db: Database.Database): ItemLocation[] {
    return db.prepare(`
      SELECT
        il.*,
        w.warehouse_code,
        w.warehouse_name
      FROM item_locations il
      INNER JOIN warehouses w ON il.warehouse_id = w.id
      WHERE il.item_id = ?
      ORDER BY il.is_primary DESC, il.rack_no
    `).all(itemId) as ItemLocation[];
  }

  static getByWarehouseId(warehouseId: number, db: Database.Database): ItemLocation[] {
    return db.prepare(`
      SELECT
        il.*,
        i.item_code,
        i.item_name
      FROM item_locations il
      INNER JOIN items i ON il.item_id = i.id
      WHERE il.warehouse_id = ?
      AND i.is_active = 1
      ORDER BY il.rack_no
    `).all(warehouseId) as ItemLocation[];
  }

  static getById(id: number, db: Database.Database): ItemLocation | undefined {
    return db.prepare(`
      SELECT
        il.*,
        w.warehouse_code,
        w.warehouse_name,
        i.item_code,
        i.item_name
      FROM item_locations il
      INNER JOIN warehouses w ON il.warehouse_id = w.id
      INNER JOIN items i ON il.item_id = i.id
      WHERE il.id = ?
    `).get(id) as ItemLocation | undefined;
  }

  static create(data: CreateItemLocationDTO, db: Database.Database): number {
    const stmt = db.prepare(`
      INSERT INTO item_locations (item_id, warehouse_id, rack_no, is_primary)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.item_id,
      data.warehouse_id,
      data.rack_no,
      data.is_primary ? 1 : 0
    );

    return result.lastInsertRowid as number;
  }

  static update(id: number, data: UpdateItemLocationDTO, db: Database.Database): Database.RunResult {
    const stmt = db.prepare(`
      UPDATE item_locations
      SET warehouse_id = COALESCE(?, warehouse_id),
          rack_no = COALESCE(?, rack_no),
          is_primary = COALESCE(?, is_primary),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    return stmt.run(
      data.warehouse_id || null,
      data.rack_no || null,
      data.is_primary !== undefined ? (data.is_primary ? 1 : 0) : null,
      id
    );
  }

  static delete(id: number, db: Database.Database): Database.RunResult {
    return db.prepare('DELETE FROM item_locations WHERE id = ?').run(id);
  }

  static deleteByItemId(itemId: number, db: Database.Database): Database.RunResult {
    return db.prepare('DELETE FROM item_locations WHERE item_id = ?').run(itemId);
  }

  static setPrimary(id: number, db: Database.Database): Database.RunResult {
    const location = this.getById(id, db);
    if (!location) throw new Error('Location not found');

    // Unset primary for all other locations of this item
    db.prepare(`
      UPDATE item_locations
      SET is_primary = 0
      WHERE item_id = ?
    `).run(location.item_id);

    // Set this one as primary
    return db.prepare(`
      UPDATE item_locations
      SET is_primary = 1
      WHERE id = ?
    `).run(id);
  }

  static getRackCodesForWarehouse(warehouseId: number, db: Database.Database): string[] {
    const warehouse = db.prepare('SELECT num_racks FROM warehouses WHERE id = ?').get(warehouseId) as { num_racks: number } | undefined;
    if (!warehouse || !warehouse.num_racks) return [];

    const rackLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const racks: string[] = [];
    const numRacks = warehouse.num_racks;

    for (let i = 0; i < numRacks; i++) {
      const letter = rackLetters[i % 26];
      const shelfNum = Math.floor(i / 26) + 1;
      if (numRacks <= 26) {
        racks.push(`${letter}1`);
      } else {
        racks.push(`${letter}${shelfNum}`);
      }
    }

    return racks;
  }

  static getPrimaryLocationsForItems(itemIds: number[], db: Database.Database): Array<{
    item_id: number;
    warehouse_id: number;
    rack_no: string;
    warehouse_code: string;
    warehouse_name: string;
  }> {
    if (itemIds.length === 0) return [];

    const placeholders = itemIds.map(() => '?').join(',');
    return db.prepare(`
      SELECT
        il.item_id,
        il.warehouse_id,
        il.rack_no,
        w.warehouse_code,
        w.warehouse_name
      FROM item_locations il
      INNER JOIN warehouses w ON il.warehouse_id = w.id
      WHERE il.item_id IN (${placeholders})
      AND il.is_primary = 1
    `).all(...itemIds) as Array<{
      item_id: number;
      warehouse_id: number;
      rack_no: string;
      warehouse_code: string;
      warehouse_name: string;
    }>;
  }

  static getPrimaryLocation(itemId: number, db: Database.Database): {
    item_id: number;
    warehouse_id: number;
    rack_no: string;
    warehouse_code: string;
    warehouse_name: string;
  } | undefined {
    return db.prepare(`
      SELECT
        il.item_id,
        il.warehouse_id,
        il.rack_no,
        w.warehouse_code,
        w.warehouse_name
      FROM item_locations il
      INNER JOIN warehouses w ON il.warehouse_id = w.id
      WHERE il.item_id = ?
      AND il.is_primary = 1
      LIMIT 1
    `).get(itemId) as {
      item_id: number;
      warehouse_id: number;
      rack_no: string;
      warehouse_code: string;
      warehouse_name: string;
    } | undefined;
  }
}

export default ItemLocationModel;
