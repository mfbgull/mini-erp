import express from 'express';
const router = express.Router();
import rolesController from '../controllers/rolesController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

// All role routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', rolesController.getRoles);
router.get('/permissions', rolesController.getPermissions);
router.get('/:id/permissions', rolesController.getRolePermissions);
router.post('/', rolesController.createRole);
router.put('/:id', rolesController.updateRole);
router.put('/:id/permissions', rolesController.updateRolePermissions);
router.delete('/:id', rolesController.deleteRole);

export default router;
