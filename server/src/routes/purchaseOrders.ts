import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth';
import purchaseOrderController from '../controllers/purchaseOrderController';

router.use(authenticateToken);

// CRUD - Purchase Orders
router.post('/purchase-orders', purchaseOrderController.createPurchaseOrder);
router.get('/purchase-orders', purchaseOrderController.getPurchaseOrders);
router.get('/purchase-orders/:id', purchaseOrderController.getPurchaseOrder);
router.put('/purchase-orders/:id', purchaseOrderController.updatePurchaseOrder);
router.delete('/purchase-orders/:id', purchaseOrderController.deletePurchaseOrder);

// Line Items
router.post('/purchase-orders/:id/items', purchaseOrderController.addLineItem);
router.put('/purchase-orders/:id/items/:itemId', purchaseOrderController.updateLineItem);
router.delete('/purchase-orders/:id/items/:itemId', purchaseOrderController.deleteLineItem);

// Status
router.post('/purchase-orders/:id/status', purchaseOrderController.updateStatus);
router.get('/purchase-orders/pending', purchaseOrderController.getPendingOrders);

// Goods Receipts
router.get('/purchase-orders/:id/receipts', purchaseOrderController.getGoodsReceipts);
router.post('/purchase-orders/:id/receipts', purchaseOrderController.createGoodsReceipt);

// Summary & Reporting
router.get('/purchase-orders/summary/supplier/:supplierId', purchaseOrderController.getSummaryBySupplier);

// Supplier Ledger (AP)
router.get('/suppliers/:supplierId/balance', purchaseOrderController.getSupplierBalance);
router.get('/suppliers/:supplierId/transactions', purchaseOrderController.getSupplierTransactions);

export default router;
