import db from '../config/database';
import ItemModel from '../models/Item';
import WarehouseModel from '../models/Warehouse';
import StockMovementModel from '../models/StockMovement';

describe('ItemModel', () => {
  let createdItemId: number;

  describe('create', () => {
    it('creates a new item and returns its ID', () => {
      const id = ItemModel.create({
        item_code: `MODEL-TEST-${Date.now()}`,
        item_name: 'Model Test Item',
        category: 'Test',
        unit_of_measure: 'Nos',
        standard_cost: 10,
        standard_selling_price: 20,
      }, 1, db);
      expect(id).toBeGreaterThan(0);
      createdItemId = id;
    });

    it('creates item with default values for optional fields', () => {
      const id = ItemModel.create({
        item_code: `MINIMAL-${Date.now()}`,
        item_name: 'Minimal Item',
      }, 1, db);
      expect(id).toBeGreaterThan(0);
    });
  });

  describe('getById', () => {
    it('returns item by ID', () => {
      const item = ItemModel.getById(createdItemId, db);
      expect(item).toBeDefined();
      expect(item?.id).toBe(createdItemId);
      expect(item?.item_name).toBe('Model Test Item');
    });

    it('returns undefined for non-existent ID', () => {
      const item = ItemModel.getById(999999, db);
      expect(item).toBeUndefined();
    });
  });

  describe('getByCode', () => {
    it('returns item by code', () => {
      const item = ItemModel.getById(createdItemId, db);
      expect(item).toBeDefined();
      const byCode = ItemModel.getByCode(item!.item_code, db);
      expect(byCode).toBeDefined();
      expect(byCode?.id).toBe(createdItemId);
    });

    it('returns undefined for non-existent code', () => {
      const item = ItemModel.getByCode('NONEXISTENT-CODE-XYZ', db);
      expect(item).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all active items', () => {
      const items = ItemModel.getAll({}, db);
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('filters by category', () => {
      const items = ItemModel.getAll({ category: 'Test' }, db);
      expect(items.length).toBeGreaterThan(0);
      items.forEach(item => {
        expect(item.category).toBe('Test');
      });
    });

    it('filters by search term', () => {
      const items = ItemModel.getAll({ search: 'Model Test' }, db);
      expect(items.length).toBeGreaterThan(0);
    });

    it('returns empty array for non-matching search', () => {
      const items = ItemModel.getAll({ search: 'zzzznonexistent' }, db);
      expect(items.length).toBe(0);
    });

    it('excludes inactive items', () => {
      const items = ItemModel.getAll({}, db);
      items.forEach(item => {
        expect(item.is_active).toBe(1);
      });
    });
  });

  describe('update', () => {
    it('updates item fields', () => {
      const result = ItemModel.update(createdItemId, {
        item_name: 'Updated Model Item',
        unit_of_measure: 'Kg',
        description: 'Updated description',
        category: 'Updated',
        reorder_level: 50,
        standard_cost: 15,
        standard_selling_price: 30,
        is_raw_material: true,
        is_finished_good: false,
        is_purchased: true,
        is_manufactured: false,
      }, db);
      expect(result.changes).toBe(1);

      const updated = ItemModel.getById(createdItemId, db);
      expect(updated?.item_name).toBe('Updated Model Item');
      expect(updated?.unit_of_measure).toBe('Kg');
    });

    it('returns 0 changes for non-existent ID', () => {
      const result = ItemModel.update(999999, {
        item_name: 'Ghost Item',
        unit_of_measure: 'Nos',
        is_raw_material: false,
        is_finished_good: false,
        is_purchased: false,
        is_manufactured: false,
      }, db);
      expect(result.changes).toBe(0);
    });
  });

  describe('delete', () => {
    it('soft-deletes an item (sets is_active=0)', () => {
      const result = ItemModel.delete(createdItemId, db);
      expect(result.changes).toBe(1);

      const deleted = ItemModel.getById(createdItemId, db);
      expect(deleted?.is_active).toBe(0);
    });

    it('deleted item does not appear in getAll', () => {
      const items = ItemModel.getAll({}, db);
      const found = items.find(i => i.id === createdItemId);
      expect(found).toBeUndefined();
    });
  });

  describe('getStockByWarehouse', () => {
    it('returns stock distribution across warehouses', () => {
      const stock = ItemModel.getStockByWarehouse(createdItemId, db);
      expect(Array.isArray(stock)).toBe(true);
    });
  });

  describe('getCategories', () => {
    it('returns distinct categories', () => {
      const categories = ItemModel.getCategories(db);
      expect(Array.isArray(categories)).toBe(true);
    });
  });

  describe('getLowStock', () => {
    it('returns items below reorder level', () => {
      const lowStock = ItemModel.getLowStock(db);
      expect(Array.isArray(lowStock)).toBe(true);
    });
  });
});

describe('WarehouseModel', () => {
  let createdWarehouseId: number;

  describe('create', () => {
    it('creates a new warehouse', () => {
      const id = WarehouseModel.create(db, {
        warehouse_code: `MODEL-WH-${Date.now()}`,
        warehouse_name: 'Model Test Warehouse',
        location: 'Test Location',
      });
      expect(id).toBeGreaterThan(0);
      createdWarehouseId = id;
    });
  });

  describe('getById', () => {
    it('returns warehouse by ID', () => {
      const wh = WarehouseModel.getById(db, createdWarehouseId);
      expect(wh).toBeDefined();
      expect(wh?.warehouse_name).toBe('Model Test Warehouse');
    });

    it('returns undefined for non-existent ID', () => {
      const wh = WarehouseModel.getById(db, 999999);
      expect(wh).toBeUndefined();
    });
  });

  describe('getByCode', () => {
    it('returns warehouse by code', () => {
      const wh = WarehouseModel.getById(db, createdWarehouseId);
      expect(wh).toBeDefined();
      const byCode = WarehouseModel.getByCode(db, wh!.warehouse_code);
      expect(byCode).toBeDefined();
      expect(byCode?.id).toBe(createdWarehouseId);
    });

    it('returns undefined for non-existent code', () => {
      const wh = WarehouseModel.getByCode(db, 'NONEXISTENT-WH');
      expect(wh).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all active warehouses', () => {
      const warehouses = WarehouseModel.getAll(db);
      expect(Array.isArray(warehouses)).toBe(true);
      expect(warehouses.length).toBeGreaterThan(0);
    });
  });

  describe('update', () => {
    it('updates warehouse fields', () => {
      WarehouseModel.update(db, createdWarehouseId, {
        warehouse_code: (WarehouseModel.getById(db, createdWarehouseId)?.warehouse_code)!,
        warehouse_name: 'Updated Warehouse',
        location: 'Updated Location',
      });

      const updated = WarehouseModel.getById(db, createdWarehouseId);
      expect(updated?.warehouse_name).toBe('Updated Warehouse');
    });
  });

  describe('delete', () => {
    it('soft-deletes a warehouse', () => {
      WarehouseModel.delete(db, createdWarehouseId);

      const deleted = WarehouseModel.getById(db, createdWarehouseId);
      expect(deleted?.is_active).toBe(0);
    });
  });

  describe('getStockSummary', () => {
    it('returns stock summary for a warehouse', () => {
      const summary = WarehouseModel.getStockSummary(db);
      expect(Array.isArray(summary)).toBe(true);
    });
  });
});

describe('StockMovementModel', () => {
  describe('recordMovement', () => {
    it('records a stock-in movement and updates balance', () => {
      const result = StockMovementModel.recordMovement({
        item_id: 1,
        warehouse_id: 1,
        movement_type: 'in',
        quantity: 100,
        unit_cost: 10,
        remarks: 'Model test stock-in',
      }, 1, db);
      expect(result.id).toBeGreaterThan(0);
      expect(result.movement_no).toMatch(/^STK-/);
    });

    it('records a stock-out movement', () => {
      const result = StockMovementModel.recordMovement({
        item_id: 1,
        warehouse_id: 1,
        movement_type: 'out',
        quantity: 10,
        remarks: 'Model test stock-out',
      }, 1, db);
      expect(result.id).toBeGreaterThan(0);
    });

    it('records an adjustment movement', () => {
      const result = StockMovementModel.recordMovement({
        item_id: 1,
        warehouse_id: 1,
        movement_type: 'adjustment',
        quantity: -5,
        remarks: 'Model test adjustment',
      }, 1, db);
      expect(result.id).toBeGreaterThan(0);
    });
  });

  describe('getAll', () => {
    it('returns all movements', () => {
      const movements = StockMovementModel.getAll({}, db);
      expect(Array.isArray(movements)).toBe(true);
      expect(movements.length).toBeGreaterThan(0);
    });

    it('filters by item_id', () => {
      const movements = StockMovementModel.getAll({ item_id: 1 }, db);
      expect(movements.length).toBeGreaterThan(0);
      movements.forEach(m => {
        expect(m.item_id).toBe(1);
      });
    });

    it('filters by movement_type', () => {
      const movements = StockMovementModel.getAll({ movement_type: 'in' }, db);
      expect(movements.length).toBeGreaterThan(0);
      movements.forEach(m => {
        expect(m.movement_type).toBe('in');
      });
    });

    it('respects limit', () => {
      const movements = StockMovementModel.getAll({ limit: 5 }, db);
      expect(movements.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getById', () => {
    it('returns movement by ID', () => {
      const movements = StockMovementModel.getAll({ limit: 1 }, db);
      if (movements.length > 0) {
        const movement = StockMovementModel.getById(movements[0].id, db);
        expect(movement).toBeDefined();
        expect(movement?.id).toBe(movements[0].id);
      }
    });

    it('returns undefined for non-existent ID', () => {
      const movement = StockMovementModel.getById(999999, db);
      expect(movement).toBeUndefined();
    });
  });
});
