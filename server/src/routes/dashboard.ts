import express from 'express';
import dashboardController from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/summary', dashboardController.getSummary);

export default router;
