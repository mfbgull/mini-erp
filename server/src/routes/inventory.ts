import express from 'express';
const router = express.Router();
import inventoryController from '../controllers/inventoryController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { sensitiveOperationLimiter } from '../middleware/rateLimiter';

router.use(authenticateToken);

router.get('/items', inventoryController.getItems);
router.get('/items/:id', inventoryController.getItem);
router.post('/items', sensitiveOperationLimiter, inventoryController.createItem);
router.put('/items/:id', sensitiveOperationLimiter, inventoryController.updateItem);
router.delete('/items/:id', requireAdmin, sensitiveOperationLimiter, inventoryController.deleteItem);

router.get('/items-categories', inventoryController.getCategories);
router.get('/items-low-stock', inventoryController.getLowStock);
router.get('/items-uom', inventoryController.getUnitsOfMeasure);

router.get('/warehouses', inventoryController.getWarehouses);
router.get('/warehouses/:id', inventoryController.getWarehouse);
router.post('/warehouses', sensitiveOperationLimiter, inventoryController.createWarehouse);
router.put('/warehouses/:id', sensitiveOperationLimiter, inventoryController.updateWarehouse);

router.get('/stock-movements', inventoryController.getStockMovements);
router.post('/stock-movements', sensitiveOperationLimiter, inventoryController.createStockMovement);

router.get('/stock-summary', inventoryController.getStockSummary);
router.get('/stock-ledger/:itemId', inventoryController.getItemLedger);
router.get('/stock-balances', inventoryController.getStockBalances);

export default router;
