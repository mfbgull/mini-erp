import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import Purchase from '../models/Purchase';
import db from '../config/database';

function recordPurchase(req: AuthRequest, res: Response): void {
  try {
    const {
      item_id,
      warehouse_id,
      quantity,
      unit_cost,
      supplier_name,
      purchase_date,
      invoice_no,
      remarks
    } = req.body;

    if (!item_id || !warehouse_id || !quantity || !unit_cost || !purchase_date) {
      res.status(400).json({
        error: 'Item, warehouse, quantity, unit cost, and purchase date are required'
      });
      return;
    }

    if (quantity <= 0) {
      res.status(400).json({ error: 'Quantity must be positive' });
      return;
    }

    if (unit_cost < 0) {
      res.status(400).json({ error: 'Unit cost cannot be negative' });
      return;
    }

    const purchase = Purchase.recordPurchase(req.body, req.user!.id, db);

    res.status(201).json(purchase);
  } catch (error: any) {
    console.error('Record purchase error:', error);
    res.status(500).json({ error: error.message || 'Failed to record purchase' });
  }
}

function getPurchases(req: Request, res: Response): void {
  try {
    const filters = {
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
      item_id: req.query.item_id ? Number(req.query.item_id) : undefined,
      warehouse_id: req.query.warehouse_id ? Number(req.query.warehouse_id) : undefined,
      supplier_name: req.query.supplier_name as string | undefined,
      limit: req.query.limit ? parseInt(String(req.query.limit)) : undefined
    };

    const purchases = Purchase.getAll(filters, db);

    res.json(purchases);
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Failed to get purchases' });
  }
}

function getPurchase(req: Request, res: Response): void {
  try {
    const purchase = Purchase.getById(Number(req.params.id), db);

    if (!purchase) {
      res.status(404).json({ error: 'Purchase not found' });
      return;
    }

    res.json(purchase);
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({ error: 'Failed to get purchase' });
  }
}

function getPurchaseSummaryByItem(req: Request, res: Response): void {
  try {
    const { item_id } = req.params;

    if (!item_id) {
      res.status(400).json({ error: 'Item ID is required' });
      return;
    }

    const summary = Purchase.getSummaryByItem(Number(item_id), db);

    res.json(summary);
  } catch (error) {
    console.error('Get purchase summary error:', error);
    res.status(500).json({ error: 'Failed to get purchase summary' });
  }
}

function getPurchaseSummaryByDateRange(req: Request, res: Response): void {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      res.status(400).json({ error: 'Start date and end date are required' });
      return;
    }

    const summary = Purchase.getSummaryByDateRange(start_date as string, end_date as string, db);

    res.json(summary);
  } catch (error) {
    console.error('Get purchase summary error:', error);
    res.status(500).json({ error: 'Failed to get purchase summary' });
  }
}

function getTopSuppliers(req: Request, res: Response): void {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
    const suppliers = Purchase.getTopSuppliers(limit, db);

    res.json(suppliers);
  } catch (error) {
    console.error('Get top suppliers error:', error);
    res.status(500).json({ error: 'Failed to get top suppliers' });
  }
}

function deletePurchase(req: AuthRequest, res: Response): void {
  try {
    Purchase.delete(Number(req.params.id), req.user!.id, db);

    res.json({ success: true, message: 'Purchase deleted successfully' });
  } catch (error: any) {
    console.error('Delete purchase error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete purchase' });
  }
}

export default {
  recordPurchase,
  getPurchases,
  getPurchase,
  getPurchaseSummaryByItem,
  getPurchaseSummaryByDateRange,
  getTopSuppliers,
  deletePurchase
};
