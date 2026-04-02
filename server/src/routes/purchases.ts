import express from 'express';
const router = express.Router();
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { sensitiveOperationLimiter } from '../middleware/rateLimiter';
import purchaseController from '../controllers/purchaseController';

router.use(authenticateToken);

router.post('/purchases', sensitiveOperationLimiter, purchaseController.recordPurchase);
router.get('/purchases', purchaseController.getPurchases);
router.get('/purchases/:id', purchaseController.getPurchase);
router.delete('/purchases/:id', requireAdmin, sensitiveOperationLimiter, purchaseController.deletePurchase);
router.get('/purchases/summary/item/:item_id', purchaseController.getPurchaseSummaryByItem);
router.get('/purchases/summary/daterange', purchaseController.getPurchaseSummaryByDateRange);
router.get('/purchases/top-suppliers', purchaseController.getTopSuppliers);

export default router;
