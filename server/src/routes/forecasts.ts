import express from 'express';
const router = express.Router();
import forecastsController from '../controllers/forecastsController';
import { authenticateToken } from '../middleware/auth';

router.use(authenticateToken);

router.get('/dashboard', forecastsController.getDashboard);
router.get('/demand', forecastsController.getDemand);
router.get('/trends', forecastsController.getTrends);
router.post('/generate', forecastsController.generateForecasts);

export default router;
