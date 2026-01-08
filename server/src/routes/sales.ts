import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth';
import salesController from '../controllers/salesController';

router.use(authenticateToken);

// Direct sale endpoints removed - use POS system or invoices instead
// router.post('/sales', salesController.recordSale);
// router.get('/sales', salesController.getSales);
router.get('/sales/summary/item/:item_id', salesController.getSalesSummaryByItem);
router.get('/sales/summary/daterange', salesController.getSalesSummaryByDateRange);
router.get('/sales/top-customers', salesController.getTopCustomers);
router.get('/sales/item-customer-history', salesController.getItemCustomerPriceHistory);
router.get('/sales/:id', salesController.getSale);
router.delete('/sales/:id', salesController.deleteSale);

export default router;
