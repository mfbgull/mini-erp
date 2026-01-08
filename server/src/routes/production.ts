import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth';
import productionController from '../controllers/productionController';

router.use(authenticateToken);

router.post('/productions', productionController.recordProduction);
router.get('/productions', productionController.getProductions);
router.get('/productions/:id', productionController.getProduction);
router.delete('/productions/:id', productionController.deleteProduction);
router.get('/productions/summary/item/:item_id', productionController.getProductionSummaryByItem);

export default router;
