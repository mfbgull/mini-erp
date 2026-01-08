import { Request, Response } from 'express';
import ProductionModel from '../models/Production';
import { AuthRequest } from '../types';
import { logCRUD, ActionType } from '../services/activityLogger';
import db from '../config/database';

function recordProduction(req: AuthRequest, res: Response): void {
  try {
    const {
      output_item_id,
      output_quantity,
      warehouse_id,
      raw_materials_warehouse_id,
      production_date,
      input_items,
      remarks
    } = req.body;

    if (!output_item_id || !output_quantity || !warehouse_id || !production_date || !input_items || !input_items.length) {
      res.status(400).json({ error: 'Output item, quantity, warehouse, date, and input items are required' });
      return;
    }

    if (output_quantity <= 0) {
      res.status(400).json({ error: 'Output quantity must be positive' });
      return;
    }

    const productionData = {
      ...req.body,
      raw_materials_warehouse_id: raw_materials_warehouse_id || warehouse_id
    };

    const production = ProductionModel.recordProduction(productionData, req.user!.id, db);

    // Log production creation using activity logger
    logCRUD(ActionType.WO_CREATE, 'WorkOrder', production.id, `Created production: ${production.production_no} - ${production.output_item_name} (${production.output_quantity} units)`, req.user!.id);

    res.status(201).json(production);
  } catch (error: any) {
    console.error('Record production error:', error);
    res.status(500).json({ error: error.message || 'Failed to record production' });
  }
}

function getProductions(req: Request, res: Response): void {
  try {
    const filters = {
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
      output_item_id: req.query.output_item_id ? Number(req.query.output_item_id) : undefined,
      warehouse_id: req.query.warehouse_id ? Number(req.query.warehouse_id) : undefined,
      limit: req.query.limit ? parseInt(String(req.query.limit)) : undefined
    };
    res.json(ProductionModel.getAll(filters, db));
  } catch (error) {
    console.error('Get productions error:', error);
    res.status(500).json({ error: 'Failed to get productions' });
  }
}

function getProduction(req: Request, res: Response): void {
  try {
    const production = ProductionModel.getById(Number(req.params.id), db);
    if (!production) {
      res.status(404).json({ error: 'Production not found' });
      return;
    }
    res.json(production);
  } catch (error) {
    console.error('Get production error:', error);
    res.status(500).json({ error: 'Failed to get production' });
  }
}

function getProductionSummaryByItem(req: Request, res: Response): void {
  try {
    const { item_id } = req.params;
    if (!item_id) {
      res.status(400).json({ error: 'Item ID is required' });
      return;
    }
    res.json(ProductionModel.getSummaryByItem(Number(item_id), db));
  } catch (error) {
    console.error('Get production summary error:', error);
    res.status(500).json({ error: 'Failed to get production summary' });
  }
}

function deleteProduction(req: AuthRequest, res: Response): void {
  try {
    const productionId = Number(req.params.id);
    const production = ProductionModel.getById(productionId, db);

    ProductionModel.delete(productionId, req.user!.id, db);

    // Log production deletion using activity logger
    if (production) {
      logCRUD(ActionType.WO_DELETE, 'WorkOrder', productionId, `Deleted production: ${production.production_no}`, req.user!.id);
    }

    res.json({ success: true, message: 'Production deleted successfully' });
  } catch (error: any) {
    console.error('Delete production error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete production' });
  }
}

export default {
  recordProduction,
  getProductions,
  getProduction,
  getProductionSummaryByItem,
  deleteProduction
};
