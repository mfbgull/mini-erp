import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import StockMovement from '../models/StockMovement';
import db from '../config/database';

function generatePOSTransactionNo(): string {
  const year = new Date().getFullYear();
  const settingKey = `POS_last_no_${year}`;

  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as { value: string } | undefined;

  let nextNo = 1;
  if (setting) {
    nextNo = parseInt(setting.value) + 1;
  }

  db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `).run(settingKey, nextNo.toString());

  return `POS-${year}-${nextNo.toString().padStart(6, '0')}`;
}

function generateSaleNo(): string {
  const year = new Date().getFullYear();
  const settingKey = `SALE_last_no_${year}`;

  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as { value: string } | undefined;

  let nextNo = 1;
  if (setting) {
    nextNo = parseInt(setting.value) + 1;
  }

  db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `).run(settingKey, nextNo.toString());

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

    const warehouse = db.prepare('SELECT id, warehouse_name FROM warehouses WHERE id = ?').get(warehouse_id) as { id: number; warehouse_name: string } | undefined;
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

    const transaction = db.transaction(() => {
      const transactionNo = generatePOSTransactionNo();

      const saleIds: number[] = [];
      const itemDetails: any[] = [];

      for (const item of items) {
        const itemRecord = db.prepare(`
          SELECT id, item_code, item_name, unit_of_measure
          FROM items WHERE id = ?
        `).get(item.item_id) as { id: number; item_code: string; item_name: string; unit_of_measure: string } | undefined;

        if (!itemRecord) {
          throw new Error(`Item with ID ${item.item_id} not found`);
        }

        const stockBalance = db.prepare(`
          SELECT quantity FROM stock_balances
          WHERE item_id = ? AND warehouse_id = ?
        `).get(...[item.item_id, warehouse_id] as any[]) as { quantity: number } | undefined;

        const availableStock = stockBalance ? Number(stockBalance.quantity) : 0;

        if (availableStock < item.quantity) {
          throw new Error(`Insufficient stock for ${itemRecord.item_name}. Available: ${availableStock}, Required: ${item.quantity}`);
        }

        const saleNo = generateSaleNo();
        const lineTotal = item.quantity * item.unit_price;

        const saleResult = db.prepare(`
          INSERT INTO sales (
            sale_no, item_id, warehouse_id, quantity, unit_price, total_amount,
            customer_name, sale_date, invoice_no, remarks, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          saleNo,
          item.item_id,
          warehouse_id,
          item.quantity,
          item.unit_price,
          lineTotal,
          customer_name || 'Walk-in Customer',
          sale_date,
          transactionNo,
          `POS Transaction: ${transactionNo}`,
          userId
        );

        const saleId = saleResult.lastInsertRowid as number;
        saleIds.push(saleId);

        StockMovement.recordMovement({
          item_id: item.item_id,
          warehouse_id,
          quantity: -item.quantity,
          movement_type: 'SALE',
          reference_doctype: 'POS',
          reference_docno: String(saleId),
          movement_date: sale_date,
          remarks: `POS Sale: ${transactionNo} - ${itemRecord.item_name}`
        }, userId, db);

        itemDetails.push({
          sale_id: saleId,
          sale_no: saleNo,
          item_id: item.item_id,
          item_code: itemRecord.item_code,
          item_name: itemRecord.item_name,
          unit_of_measure: itemRecord.unit_of_measure,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: lineTotal
        });
      }

      db.prepare(`
        INSERT INTO activity_log (user_id, action, entity_type, entity_id, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        'CREATE',
        'POS',
        saleIds[0],
        `POS Transaction ${transactionNo}: ${items.length} items, Total: ${total.toFixed(2)}`
      );

      return {
        transaction_no: transactionNo,
        sale_date,
        warehouse_id,
        warehouse_name: warehouse.warehouse_name,
        customer_name: customer_name || 'Walk-in Customer',
        items: itemDetails,
        subtotal: total,
        total: total,
        cash_received: cashAmount,
        change: cashAmount - total,
        items_count: items.length,
        sale_ids: saleIds
      };
    });

    const result = transaction();

    res.status(201).json({
      success: true,
      message: 'POS sale completed successfully',
      data: result
    });

  } catch (error: any) {
    console.error('POS Sale Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process POS sale' });
  }
}

function getPOSTransactions(req: Request, res: Response): void {
  try {
    const { start_date, end_date, limit = 50 } = req.query;

    let query = `
      SELECT
        s.invoice_no as transaction_no,
        s.sale_date,
        s.customer_name,
        w.warehouse_name,
        COUNT(*) as items_count,
        SUM(s.total_amount) as total
      FROM sales s
      JOIN warehouses w ON s.warehouse_id = w.id
      WHERE s.invoice_no LIKE 'POS-%'
    `;

    const params: any[] = [];

    if (start_date) {
      query += ` AND s.sale_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND s.sale_date <= ?`;
      params.push(end_date);
    }

    query += ` GROUP BY s.invoice_no ORDER BY s.created_at DESC LIMIT ?`;
    params.push(parseInt(limit as string));

    const transactions = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('Get POS Transactions Error:', error);
    res.status(500).json({ error: 'Failed to fetch POS transactions' });
  }
}

export default {
  createPOSSale,
  getPOSTransactions
};
