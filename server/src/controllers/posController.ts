import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import db from '../config/database';
import logger from '../utils/logger';
import { getNextSequenceNumber } from '../utils/sequence';
import SaleModel from '../models/Sale';
import ItemModel from '../models/Item';
import WarehouseModel from '../models/Warehouse';

function generatePOSTransactionNo(): string {
  const year = new Date().getFullYear();
  const settingKey = `POS_last_no_${year}`;
  const nextNo = getNextSequenceNumber(db, settingKey);
  return `POS-${year}-${nextNo.toString().padStart(6, '0')}`;
}

function generateSaleNo(): string {
  const year = new Date().getFullYear();
  const settingKey = `SALE_last_no_${year}`;
  const nextNo = getNextSequenceNumber(db, settingKey);
  return `SALE-${year}-${nextNo.toString().padStart(4, '0')}`;
}

function createPOSSale(req: AuthRequest, res: Response): void {
  try {
    const { warehouse_id, sale_date, items, cash_received, customer_name } = req.body;
    const userId = req.user!.id;

    if (!warehouse_id) {
      res.status(400).json({ error: 'Warehouse is required' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one item is required' });
      return;
    }

    if (!sale_date) {
      res.status(400).json({ error: 'Sale date is required' });
      return;
    }

    const warehouse = WarehouseModel.getById(db, warehouse_id);
    if (!warehouse) {
      res.status(400).json({ error: 'Warehouse not found' });
      return;
    }

    let total = 0;
    for (const item of items) {
      if (!item.item_id || !item.quantity || item.quantity <= 0) {
        res.status(400).json({ error: 'Each item must have item_id and quantity > 0' });
        return;
      }
      if (item.unit_price === undefined || item.unit_price < 0) {
        res.status(400).json({ error: 'Each item must have a valid unit_price' });
        return;
      }
      total += item.quantity * item.unit_price;
    }

    const cashAmount = parseFloat(cash_received) || 0;
    if (cashAmount < total) {
      res.status(400).json({
        error: `Insufficient cash. Total: ${total.toFixed(2)}, Received: ${cashAmount.toFixed(2)}`
      });
      return;
    }

    const customerName = customer_name || 'Walk-in Customer';
    const result = SaleModel.createPOSSale(
      warehouse_id,
      sale_date,
      items,
      customerName,
      userId,
      db,
      generatePOSTransactionNo,
      generateSaleNo,
      cashAmount
    );

    res.status(201).json({
      success: true,
      message: 'POS sale completed successfully',
      data: result
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process POS sale';
    logger.error('POS Sale Error:', error);
    res.status(500).json({ error: message });
  }
}

function getPOSTransactions(req: Request, res: Response): void {
  try {
    const { start_date, end_date, limit = 50 } = req.query;

    const transactions = SaleModel.getPOSTransactions(
      db,
      start_date as string,
      end_date as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    logger.error('Get POS Transactions Error:', error);
    res.status(500).json({ error: 'Failed to fetch POS transactions' });
  }
}

export default {
  createPOSSale,
  getPOSTransactions
};
