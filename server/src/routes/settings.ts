import express from 'express';
const router = express.Router();
import settingsController from '../controllers/settingsController';
import { authenticateToken } from '../middleware/auth';

router.use(authenticateToken);

router.get('/', settingsController.getSettings);
router.get('/:key', settingsController.getSetting);
router.put('/:key', settingsController.updateSetting);
router.post('/bulk', settingsController.updateSettings);

export default router;
