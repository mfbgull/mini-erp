import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth';
import posController from '../controllers/posController';

router.use(authenticateToken);

router.post('/sale', posController.createPOSSale);
router.get('/transactions', posController.getPOSTransactions);

export default router;
