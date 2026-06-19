import express from 'express';
import dashboardController from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

const router = express.Router();

router.use(authenticateToken);

router.get('/summary', requirePermission('dashboard', 'read'), dashboardController.getSummary);

export default router;
