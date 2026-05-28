import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import SalesService from '../services/salesService';
import logger from '../utils/logger';

// ============ Quotation Controllers ============

/**
 * POST /api/quotations
 * Create a new quotation
 */
function createQuotation(req: AuthRequest, res: Response): void {
  try {
    const {
      customer_id,
      customer_name,
      quotation_date,
      expiry_date,
      status,
      source_type,
      notes,
      terms,
      warehouse_id,
      items
    } = req.body;

    // Validation
    if (!customer_id) {
      res.status(400).json({ error: 'Customer is required' });
      return;
    }

    if (!quotation_date) {
      res.status(400).json({ error: 'Quotation date is required' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one item is required' });
      return;
    }

    const quotation = SalesService.createQuotation({
      customer_id,
      customer_name,
      quotation_date,
      expiry_date,
      status,
      source_type,
      notes,
      terms,
      warehouse_id,
      items
    }, req.user!.id);

    res.status(201).json(quotation);
  } catch (error: any) {
    logger.error('Create quotation error:', error);
    res.status(400).json({ error: error.message || 'Failed to create quotation' });
  }
}

/**
 * GET /api/quotations
 * Get all quotations with filters
 */
function getQuotations(req: Request, res: Response): void {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      customer_id: req.query.customer_id ? Number(req.query.customer_id) : undefined,
      customer_name: req.query.customer_name as string | undefined,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
      warehouse_id: req.query.warehouse_id ? Number(req.query.warehouse_id) : undefined,
      limit: req.query.limit ? parseInt(String(req.query.limit)) : undefined
    };

    const quotations = SalesService.getQuotations(filters);
    res.json(quotations);
  } catch (error: any) {
    logger.error('Get quotations error:', error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
}

/**
 * GET /api/quotations/:id
 * Get single quotation by ID
 */
function getQuotation(req: Request, res: Response): void {
  try {
    const quotation = SalesService.getQuotation(Number(req.params.id));

    if (!quotation) {
      res.status(404).json({ error: 'Quotation not found' });
      return;
    }

    res.json(quotation);
  } catch (error: any) {
    logger.error('Get quotation error:', error);
    res.status(500).json({ error: 'Failed to fetch quotation' });
  }
}

/**
 * PUT /api/quotations/:id
 * Update quotation
 */
function updateQuotation(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const data = req.body;

    const quotation = SalesService.updateQuotation(Number(id), data, req.user!.id);
    res.json(quotation);
  } catch (error: any) {
    logger.error('Update quotation error:', error);
    res.status(400).json({ error: error.message || 'Failed to update quotation' });
  }
}

/**
 * DELETE /api/quotations/:id
 * Delete quotation
 */
function deleteQuotation(req: AuthRequest, res: Response): void {
  try {
    const result = SalesService.deleteQuotation(Number(req.params.id), req.user!.id);
    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error: any) {
    logger.error('Delete quotation error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete quotation' });
  }
}

/**
 * POST /api/quotations/:id/convert
 * Convert quotation to sales order
 */
function convertQuotationToSalesOrder(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const overrides = req.body;

    const result = SalesService.convertQuotationToSalesOrder(Number(id), req.user!.id, overrides);
    res.status(201).json({
      success: true,
      message: 'Quotation converted to sales order',
      ...result
    });
  } catch (error: any) {
    logger.error('Convert quotation to SO error:', error);
    res.status(400).json({ error: error.message || 'Failed to convert quotation' });
  }
}

/**
 * GET /api/quotations/:id/cycle-chain
 * Get complete sales cycle chain for a quotation
 */
function getQuotationCycleChain(req: Request, res: Response): void {
  try {
    const chain = SalesService.getQuotationCycleChain(Number(req.params.id));
    res.json(chain);
  } catch (error: any) {
    logger.error('Get quotation cycle chain error:', error);
    res.status(500).json({ error: 'Failed to fetch cycle chain' });
  }
}

// ============ Sales Order Controllers ============

/**
 * POST /api/sales-orders
 * Create a new sales order
 */
function createSalesOrder(req: AuthRequest, res: Response): void {
  try {
    const {
      customer_id,
      customer_name,
      so_date,
      delivery_date,
      status,
      source_type,
      source_id,
      notes,
      warehouse_id,
      items
    } = req.body;

    // Validation
    if (!customer_id) {
      res.status(400).json({ error: 'Customer is required' });
      return;
    }

    if (!so_date) {
      res.status(400).json({ error: 'Sales order date is required' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one item is required' });
      return;
    }

    const salesOrder = SalesService.createSalesOrder({
      customer_id,
      customer_name,
      so_date,
      delivery_date,
      status,
      source_type,
      source_id,
      notes,
      warehouse_id,
      items
    }, req.user!.id);

    res.status(201).json(salesOrder);
  } catch (error: any) {
    logger.error('Create sales order error:', error);
    res.status(400).json({ error: error.message || 'Failed to create sales order' });
  }
}

/**
 * GET /api/sales-orders
 * Get all sales orders with filters
 */
function getSalesOrders(req: Request, res: Response): void {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      customer_id: req.query.customer_id ? Number(req.query.customer_id) : undefined,
      customer_name: req.query.customer_name as string | undefined,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
      warehouse_id: req.query.warehouse_id ? Number(req.query.warehouse_id) : undefined,
      source_type: req.query.source_type as string | undefined,
      limit: req.query.limit ? parseInt(String(req.query.limit)) : undefined
    };

    const salesOrders = SalesService.getSalesOrders(filters);
    res.json(salesOrders);
  } catch (error: any) {
    logger.error('Get sales orders error:', error);
    res.status(500).json({ error: 'Failed to fetch sales orders' });
  }
}

/**
 * GET /api/sales-orders/:id
 * Get single sales order by ID
 */
function getSalesOrder(req: Request, res: Response): void {
  try {
    const salesOrder = SalesService.getSalesOrder(Number(req.params.id));

    if (!salesOrder) {
      res.status(404).json({ error: 'Sales order not found' });
      return;
    }

    res.json(salesOrder);
  } catch (error: any) {
    logger.error('Get sales order error:', error);
    res.status(500).json({ error: 'Failed to fetch sales order' });
  }
}

/**
 * PUT /api/sales-orders/:id
 * Update sales order
 */
function updateSalesOrder(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const data = req.body;

    const salesOrder = SalesService.updateSalesOrder(Number(id), data, req.user!.id);
    res.json(salesOrder);
  } catch (error: any) {
    logger.error('Update sales order error:', error);
    res.status(400).json({ error: error.message || 'Failed to update sales order' });
  }
}

/**
 * DELETE /api/sales-orders/:id
 * Delete sales order
 */
function deleteSalesOrder(req: AuthRequest, res: Response): void {
  try {
    const result = SalesService.deleteSalesOrder(Number(req.params.id), req.user!.id);
    res.json({ success: true, message: 'Sales order deleted successfully' });
  } catch (error: any) {
    logger.error('Delete sales order error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete sales order' });
  }
}

/**
 * POST /api/sales-orders/:id/cancel
 * Cancel a sales order — reverses linked invoice stock and cancels the invoice.
 */
function cancelSalesOrder(req: AuthRequest, res: Response): void {
  try {
    const result = SalesService.cancelSalesOrder(Number(req.params.id), req.user!.id);
    res.json({ success: true, message: 'Sales order cancelled successfully', ...result });
  } catch (error: any) {
    logger.error('Cancel sales order error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel sales order' });
  }
}

/**
 * POST /api/sales-orders/:id/convert
 * Convert sales order to invoice
 */
function convertSalesOrderToInvoice(req: AuthRequest, res: Response): void {
  try {
    const { id } = req.params;
    const invoiceData = req.body;

    const result = SalesService.convertSalesOrderToInvoice(Number(id), req.user!.id, invoiceData);
    res.status(201).json({
      success: true,
      message: 'Sales order converted to invoice',
      ...result
    });
  } catch (error: any) {
    logger.error('Convert SO to invoice error:', error);
    res.status(400).json({ error: error.message || 'Failed to convert sales order' });
  }
}

/**
 * GET /api/sales-orders/:id/cycle-chain
 * Get complete sales cycle chain for a sales order
 */
function getSalesOrderCycleChain(req: Request, res: Response): void {
  try {
    const chain = SalesService.getSalesOrderCycleChain(Number(req.params.id));
    res.json(chain);
  } catch (error: any) {
    logger.error('Get sales order cycle chain error:', error);
    res.status(500).json({ error: 'Failed to fetch cycle chain' });
  }
}

// ============ Invoice Controllers (for sales cycle) ============

/**
 * GET /api/sales-orders/:id/invoices
 * Get invoices for a sales order
 */
function getInvoicesBySalesOrder(req: Request, res: Response): void {
  try {
    const invoices = SalesService.getInvoicesBySalesOrder(Number(req.params.id));
    res.json(invoices);
  } catch (error: any) {
    logger.error('Get invoices by SO error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
}

/**
 * GET /api/quotations/:id/invoices
 * Get invoices for a quotation (via SO or direct)
 */
function getInvoicesByQuotation(req: Request, res: Response): void {
  try {
    const invoices = SalesService.getInvoicesByQuotation(Number(req.params.id));
    res.json(invoices);
  } catch (error: any) {
    logger.error('Get invoices by quotation error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
}

/**
 * GET /api/sales/dashboard
 * Get sales dashboard summary
 */
function getSalesDashboard(req: Request, res: Response): void {
  try {
    const dashboard = SalesService.getDashboardSummary();
    res.json(dashboard);
  } catch (error: any) {
    logger.error('Get sales dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
}

// ============ Legacy (migrated to InvoiceModel) ============

function getSalesSummaryByDateRange(req: Request, res: Response): void {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      res.status(400).json({ error: 'Start date and end date are required' });
      return;
    }

    const stats = SalesService.getInvoiceStatsByDateRange(start_date as string, end_date as string);
    res.json(stats);
  } catch (error: any) {
    logger.error('Get sales summary by date range error:', error);
    res.status(500).json({ error: 'Failed to get sales summary' });
  }
}

export default {
  // Quotations
  createQuotation,
  getQuotations,
  getQuotation,
  updateQuotation,
  deleteQuotation,
  convertQuotationToSalesOrder,
  getQuotationCycleChain,
  
  // Sales Orders
  createSalesOrder,
  getSalesOrders,
  getSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  cancelSalesOrder,
  convertSalesOrderToInvoice,
  getSalesOrderCycleChain,
  
  // Invoices (for sales cycle)
  getInvoicesBySalesOrder,
  getInvoicesByQuotation,
  
  // Dashboard
  getSalesDashboard,
  
  // Legacy (migrated to InvoiceModel)
  getSalesSummaryByDateRange
};
