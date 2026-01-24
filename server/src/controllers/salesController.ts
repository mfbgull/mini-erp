import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import SaleModel from '../models/Sale';
import db from '../config/database';

// Direct sale manual entry removed - use POS system or invoices instead
// function recordSale(req: AuthRequest, res: Response): void {
//   try {
//     const {
//       item_id,
//       warehouse_id,
//       quantity,
//       unit_price,
//       customer_name,
//       sale_date,
//       invoice_no,
//       remarks
//     } = req.body;

//     if (!item_id || !warehouse_id || !quantity || !unit_price || !sale_date) {
//       res.status(400).json({
//         error: 'Item, warehouse, quantity, unit price, and sale date are required'
//       });
//       return;
//     }

//     if (quantity <= 0) {
//       res.status(400).json({ error: 'Quantity must be positive' });
//       return;
//     }

//     if (unit_price < 0) {
//       res.status(400).json({ error: 'Unit price cannot be negative' });
//       return;
//     }

//     const sale = SaleModel.recordSale(req.body, req.user!.id, db);

//     res.status(201).json(sale);
//   } catch (error) {
//     console.error('Record sale error:', error);
//     res.status(500).json({ error: 'Failed to record sale' });
//   }
// }

// function getSales(req: Request, res: Response): void {
//   try {
//     const filters = {
//       start_date: req.query.start_date as string | undefined,
//       end_date: req.query.end_date as string | undefined,
//       item_id: req.query.item_id ? Number(req.query.item_id) : undefined,
//       warehouse_id: req.query.warehouse_id ? Number(req.query.warehouse_id) : undefined,
//       customer_name: req.query.customer_name as string | undefined,
//       limit: req.query.limit ? parseInt(String(req.query.limit)) : undefined
//     };

//     const sales = SaleModel.getAll(filters, db);

//     res.json(sales);
//   } catch (error) {
//     console.error('Get sales error:', error);
//     res.status(500).json({ error: 'Failed to get sales' });
//   }
// }

function getSale(req: Request, res: Response): void {
  try {
    const sale = SaleModel.getById(Number(req.params.id), db);

    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    res.json(sale);
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Failed to get sale' });
  }
}

function getItemCustomerPriceHistory(req: Request, res: Response): void {
  try {
    const itemIdParam = Array.isArray(req.query.item_id) ? req.query.item_id[0] : req.query.item_id;
    const customerIdParam = Array.isArray(req.query.customer_id) ? req.query.customer_id[0] : req.query.customer_id;

    const item_id = itemIdParam ? Number(itemIdParam) : undefined;
    const customer_id = customerIdParam ? Number(customerIdParam) : undefined;

    if (!item_id || !customer_id) {
      res.status(400).json({
        success: false,
        error: 'Item ID and Customer ID are required'
      });
      return;
    }

    const history = SaleModel.getItemCustomerPriceHistory(item_id, customer_id, db);

    res.json({
      success: true,
      data: history || null
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price history'
    });
  }
}

function getSalesSummaryByItem(req: Request, res: Response): void {
  try {
    const { item_id } = req.params;
    const summary = SaleModel.getSummaryByItem(Number(item_id), db);

    res.json(summary);
  } catch (error) {
    console.error('Get sales summary by item error:', error);
    res.status(500).json({ error: 'Failed to get sales summary by item' });
  }
}

function getSalesSummaryByDateRange(req: Request, res: Response): void {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      res.status(400).json({ error: 'Start date and end date are required' });
      return;
    }

    const summary = SaleModel.getSummaryByDateRange(start_date as string, end_date as string, db);

    res.json(summary);
  } catch (error) {
    console.error('Get sales summary by date range error:', error);
    res.status(500).json({ error: 'Failed to get sales summary by date range' });
  }
}

function getTopCustomers(req: Request, res: Response): void {
  try {
    const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limit = limitParam ? parseInt(String(limitParam)) : 10;
    const customers = SaleModel.getTopCustomers(limit, db);

    res.json(customers);
  } catch (error) {
    console.error('Get top customers error:', error);
    res.status(500).json({ error: 'Failed to get top customers' });
  }
}

function deleteSale(req: AuthRequest, res: Response): void {
  try {
    const result = SaleModel.delete(Number(req.params.id), req.user!.id, db);

    res.json({ success: true, message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete sale' });
  }
}

export default {
  // recordSale,  // Removed - use POS system
  // getSales,    // Removed - use POS system
  getSale,
  getItemCustomerPriceHistory,
  getSalesSummaryByItem,
  getSalesSummaryByDateRange,
  getTopCustomers,
  deleteSale
};
