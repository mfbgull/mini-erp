import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth';
import purchaseController from '../controllers/purchaseController';

router.use(authenticateToken);

router.post('/purchases', purchaseController.recordPurchase);
router.get('/purchases', purchaseController.getPurchases);
router.get('/purchases/:id', purchaseController.getPurchase);
router.delete('/purchases/:id', purchaseController.deletePurchase);
router.get('/purchases/summary/item/:item_id', purchaseController.getPurchaseSummaryByItem);
router.get('/purchases/summary/daterange', purchaseController.getPurchaseSummaryByDateRange);
router.get('/purchases/top-suppliers', purchaseController.getTopSuppliers);

export default router;
