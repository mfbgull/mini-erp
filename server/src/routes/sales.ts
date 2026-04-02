import express from 'express';
const router = express.Router();
import { authenticateToken, requireAdmin } from '../middleware/auth';
import salesController from '../controllers/salesController';
import { sensitiveOperationLimiter } from '../middleware/rateLimiter';

router.use(authenticateToken);

// ============ Quotations Routes ============

// POST /api/quotations - Create new quotation
router.post('/quotations', requireAdmin, salesController.createQuotation);

// GET /api/quotations - Get all quotations with filters
router.get('/quotations', salesController.getQuotations);

// GET /api/quotations/:id - Get single quotation
router.get('/quotations/:id', salesController.getQuotation);

// PUT /api/quotations/:id - Update quotation
router.put('/quotations/:id', requireAdmin, salesController.updateQuotation);

// DELETE /api/quotations/:id - Delete quotation
router.delete('/quotations/:id', requireAdmin, sensitiveOperationLimiter, salesController.deleteQuotation);

// POST /api/quotations/:id/convert - Convert quotation to sales order
router.post('/quotations/:id/convert', requireAdmin, salesController.convertQuotationToSalesOrder);

// GET /api/quotations/:id/cycle-chain - Get sales cycle chain for quotation
router.get('/quotations/:id/cycle-chain', salesController.getQuotationCycleChain);

// ============ Sales Orders Routes ============

// POST /api/sales-orders - Create new sales order
router.post('/sales-orders', requireAdmin, salesController.createSalesOrder);

// GET /api/sales-orders - Get all sales orders with filters
router.get('/sales-orders', salesController.getSalesOrders);

// GET /api/sales-orders/:id - Get single sales order
router.get('/sales-orders/:id', salesController.getSalesOrder);

// PUT /api/sales-orders/:id - Update sales order
router.put('/sales-orders/:id', requireAdmin, salesController.updateSalesOrder);

// DELETE /api/sales-orders/:id - Delete sales order
router.delete('/sales-orders/:id', requireAdmin, sensitiveOperationLimiter, salesController.deleteSalesOrder);

// POST /api/sales-orders/:id/convert - Convert sales order to invoice
router.post('/sales-orders/:id/convert', requireAdmin, salesController.convertSalesOrderToInvoice);

// GET /api/sales-orders/:id/cycle-chain - Get sales cycle chain for sales order
router.get('/sales-orders/:id/cycle-chain', salesController.getSalesOrderCycleChain);

// GET /api/sales-orders/:id/invoices - Get invoices for sales order
router.get('/sales-orders/:id/invoices', salesController.getInvoicesBySalesOrder);

// ============ Invoice Links (from sales cycle) ============

// GET /api/quotations/:id/invoices - Get invoices for quotation (via SO or direct)
router.get('/quotations/:id/invoices', salesController.getInvoicesByQuotation);

// ============ Dashboard ============

// GET /api/sales/dashboard - Get sales dashboard summary
router.get('/dashboard', salesController.getSalesDashboard);

// ============ Legacy Routes (kept for backward compatibility) ============

// GET /api/sales/summary/item/:item_id - Sales summary by item
router.get('/sales/summary/item/:item_id', salesController.getSalesSummaryByItem);

// GET /api/sales/summary/daterange - Sales summary by date range
router.get('/sales/summary/daterange', salesController.getSalesSummaryByDateRange);

// GET /api/sales/top-customers - Top customers by revenue
router.get('/sales/top-customers', salesController.getTopCustomers);

// GET /api/sales/item-customer-history - Item-customer price history
router.get('/sales/item-customer-history', salesController.getItemCustomerPriceHistory);

// GET /api/sales/:id - Get sale (legacy, redirects to invoice)
router.get('/sales/:id', salesController.getSale);

// DELETE /api/sales/:id - Delete sale (legacy, deprecated)
router.delete('/sales/:id', requireAdmin, sensitiveOperationLimiter, salesController.deleteSale);

export default router;
