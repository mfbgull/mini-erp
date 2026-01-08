import express from 'express';
const router = express.Router();
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

router.post('/login', authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/change-password', authenticateToken, authController.changePassword);

export default router;
