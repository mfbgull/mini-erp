import express from 'express';
const router = express.Router();
import userController from '../controllers/userController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

// All user routes require authentication
router.use(authenticateToken);

// Admin-only routes
router.use(requireAdmin);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id/reset-password', userController.resetPassword);
router.put('/:id/toggle-status', userController.toggleUserStatus);

export default router;
