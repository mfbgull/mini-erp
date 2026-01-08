import { Request, Response } from 'express';
import Database from 'better-sqlite3';
import ItemModel from '../models/Item';
import WarehouseModel from '../models/Warehouse';
import StockMovementModel from '../models/StockMovement';
import { AuthRequest } from '../types';
import { logCRUD, ActionType } from '../services/activityLogger';
import db from '../config/database';

function getItems(req: Request, res: Response): void {
  try {
    const items = ItemModel.getAll(req.query, db);
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
}

function getItem(req: Request, res: Response): void {
  try {
    const item = ItemModel.getById(Number(req.params.id), db);

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const stockByWarehouse = ItemModel.getStockByWarehouse(item.id, db);

    res.json({
      ...item,
      stock_by_warehouse: stockByWarehouse
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
}

function createItem(req: AuthRequest, res: Response): void {
  try {
    const { item_code, item_name } = req.body;

    if (!item_code || !item_name) {
      res.status(400).json({ error: 'Item code and name are required' });
      return;
    }

    const existing = ItemModel.getByCode(item_code, db);
    if (existing) {
      res.status(400).json({ error: 'Item code already exists' });
      return;
    }

    const itemId = ItemModel.create(req.body, req.user!.id, db);

    // Log item creation using activity logger
    logCRUD(ActionType.ITEM_CREATE, 'Item', itemId, `Created item: ${item_name}`, req.user!.id, {
      item_code,
      item_name,
      category: req.body.category
    });

    const newItem = ItemModel.getById(itemId, db);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
}

function updateItem(req: AuthRequest, res: Response): void {
  try {
    const itemId = Number(req.params.id);
    const existingItem = ItemModel.getById(itemId, db);

    if (!existingItem) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    ItemModel.update(itemId, req.body, db);

    // Log item update using activity logger
    logCRUD(ActionType.ITEM_UPDATE, 'Item', itemId, `Updated item: ${req.body.item_name || existingItem.item_name}`, req.user!.id, {
      changes: Object.keys(req.body)
    });

    const updatedItem = ItemModel.getById(itemId, db);
    res.json(updatedItem);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
}

function deleteItem(req: AuthRequest, res: Response): void {
  try {
    const itemId = Number(req.params.id);
    const item = ItemModel.getById(itemId, db);

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (item.current_stock && item.current_stock > 0) {
      res.status(400).json({ error: 'Cannot delete item with existing stock' });
      return;
    }

    ItemModel.delete(itemId, db);

    // Log item deletion using activity logger
    logCRUD(ActionType.ITEM_DELETE, 'Item', itemId, `Deleted item: ${item.item_name}`, req.user!.id, {
      item_code: item.item_code
    });

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
}

function getCategories(req: Request, res: Response): void {
  try {
    const categories = ItemModel.getCategories(db);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

function getLowStock(req: Request, res: Response): void {
  try {
    const items = ItemModel.getLowStock(db);
    res.json(items);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
}

function getWarehouses(req: Request, res: Response): void {
  try {
    const warehouses = WarehouseModel.getAll(db);
    res.json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
}

function getWarehouse(req: Request, res: Response): void {
  try {
    const warehouse = WarehouseModel.getById(Number(req.params.id), db);

    if (!warehouse) {
      res.status(404).json({ error: 'Warehouse not found' });
      return;
    }

    const stockSummary = WarehouseModel.getStockSummary(warehouse.id, db);

    res.json({
      ...warehouse,
      stock_summary: stockSummary
    });
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({ error: 'Failed to fetch warehouse' });
  }
}

function createWarehouse(req: AuthRequest, res: Response): void {
  try {
    const { warehouse_code, warehouse_name } = req.body;

    if (!warehouse_code || !warehouse_name) {
      res.status(400).json({ error: 'Warehouse code and name are required' });
      return;
    }

    const existing = WarehouseModel.getByCode(warehouse_code, db);
    if (existing) {
      res.status(400).json({ error: 'Warehouse code already exists' });
      return;
    }

    const warehouseId = WarehouseModel.create(req.body, db);

    // Log warehouse creation using activity logger
    logCRUD(ActionType.WAREHOUSE_CREATE, 'Warehouse', warehouseId, `Created warehouse: ${warehouse_name}`, req.user!.id, {
      warehouse_code,
      warehouse_name,
      location: req.body.location
    });

    const newWarehouse = WarehouseModel.getById(warehouseId, db);
    res.status(201).json(newWarehouse);
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
}

function updateWarehouse(req: AuthRequest, res: Response): void {
  try {
    const warehouseId = Number(req.params.id);
    const existing = WarehouseModel.getById(warehouseId, db);

    if (!existing) {
      res.status(404).json({ error: 'Warehouse not found' });
      return;
    }

    WarehouseModel.update(warehouseId, req.body, db);

    // Log warehouse update using activity logger
    logCRUD(ActionType.WAREHOUSE_UPDATE, 'Warehouse', warehouseId, `Updated warehouse: ${req.body.warehouse_name || existing.warehouse_name}`, req.user!.id, {
      changes: Object.keys(req.body)
    });

    const updated = WarehouseModel.getById(warehouseId, db);
    res.json(updated);
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
}

function getStockMovements(req: Request, res: Response): void {
  try {
    const movements = StockMovementModel.getAll(req.query, db);
    res.json(movements);
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
}

function createStockMovement(req: AuthRequest, res: Response): void {
  try {
    const { item_id, warehouse_id, quantity, movement_type } = req.body;

    if (!item_id || !warehouse_id || !quantity || !movement_type) {
      res.status(400).json({ error: 'Item, warehouse, quantity, and movement type are required' });
      return;
    }

    const result = StockMovementModel.recordMovement(req.body, req.user!.id, db);

    const item = ItemModel.getById(item_id, db);
    const warehouse = WarehouseModel.getById(warehouse_id, db);

    // Log stock movement using activity logger
    logCRUD(ActionType.STOCK_MOVEMENT, 'StockMovement', result.id, `${movement_type}: ${quantity} ${item?.unit_of_measure || 'units'} of ${item?.item_name} at ${warehouse?.warehouse_name}`, req.user!.id, {
      item_id,
      item_code: item?.item_code,
      warehouse_id,
      warehouse_code: warehouse?.warehouse_code,
      movement_type,
      quantity
    });

    const movement = StockMovementModel.getById(result.id, db);
    res.status(201).json(movement);
  } catch (error) {
    console.error('Create stock movement error:', error);
    res.status(500).json({ error: 'Failed to create stock movement' });
  }
}

function getStockSummary(req: Request, res: Response): void {
  try {
    const summary = StockMovementModel.getStockSummary(db);
    res.json(summary);
  } catch (error) {
    console.error('Get stock summary error:', error);
    res.status(500).json({ error: 'Failed to fetch stock summary' });
  }
}

function getItemLedger(req: Request, res: Response): void {
  try {
    const itemId = Number(req.params.itemId);
    const warehouseId = req.query.warehouse_id ? Number(req.query.warehouse_id) : null;

    const ledger = StockMovementModel.getItemLedger(itemId, warehouseId, db);
    res.json(ledger);
  } catch (error) {
    console.error('Get item ledger error:', error);
    res.status(500).json({ error: 'Failed to fetch item ledger' });
  }
}

function getStockBalances(req: Request, res: Response): void {
  try {
    const balances = db.prepare(`
      SELECT
        sb.*,
        i.item_code,
        i.item_name,
        i.unit_of_measure,
        w.warehouse_code,
        w.warehouse_name
      FROM stock_balances sb
      JOIN items i ON sb.item_id = i.id
      JOIN warehouses w ON sb.warehouse_id = w.id
      ORDER BY i.item_code, w.warehouse_code
    `).all();

    res.json(balances);
  } catch (error) {
    console.error('Get stock balances error:', error);
    res.status(500).json({ error: 'Failed to fetch stock balances' });
  }
}

export default {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getCategories,
  getLowStock,
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  getStockMovements,
  createStockMovement,
  getStockSummary,
  getItemLedger,
  getStockBalances
};
