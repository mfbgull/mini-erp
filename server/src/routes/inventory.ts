import express from 'express';
const router = express.Router();
import inventoryController from '../controllers/inventoryController';
import { authenticateToken } from '../middleware/auth';

router.use(authenticateToken);

router.get('/items', inventoryController.getItems);
router.get('/items/:id', inventoryController.getItem);
router.post('/items', inventoryController.createItem);
router.put('/items/:id', inventoryController.updateItem);
router.delete('/items/:id', inventoryController.deleteItem);

router.get('/items-categories', inventoryController.getCategories);
router.get('/items-low-stock', inventoryController.getLowStock);

router.get('/warehouses', inventoryController.getWarehouses);
router.get('/warehouses/:id', inventoryController.getWarehouse);
router.post('/warehouses', inventoryController.createWarehouse);
router.put('/warehouses/:id', inventoryController.updateWarehouse);

router.get('/stock-movements', inventoryController.getStockMovements);
router.post('/stock-movements', inventoryController.createStockMovement);

router.get('/stock-summary', inventoryController.getStockSummary);
router.get('/stock-ledger/:itemId', inventoryController.getItemLedger);
router.get('/stock-balances', inventoryController.getStockBalances);

export default router;
