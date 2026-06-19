import express from 'express';
const router = express.Router();
import forecastsController from '../controllers/forecastsController';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

router.use(authenticateToken);

router.get('/dashboard', requirePermission('forecasts', 'read'), forecastsController.getDashboard);
router.get('/demand', requirePermission('forecasts', 'read'), forecastsController.getDemand);
router.get('/trends', requirePermission('forecasts', 'read'), forecastsController.getTrends);
router.post('/generate', requirePermission('forecasts', 'create'), forecastsController.generateForecasts);

export default router;
