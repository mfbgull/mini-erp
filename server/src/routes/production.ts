import express from 'express';
const router = express.Router();
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { sensitiveOperationLimiter } from '../middleware/rateLimiter';
import productionController from '../controllers/productionController';

router.use(authenticateToken);

router.post('/productions', sensitiveOperationLimiter, productionController.recordProduction);
router.get('/productions', productionController.getProductions);
router.get('/productions/:id', productionController.getProduction);
router.delete('/productions/:id', requireAdmin, sensitiveOperationLimiter, productionController.deleteProduction);
router.get('/productions/summary/item/:item_id', productionController.getProductionSummaryByItem);

export default router;
