/**
 * Activity Log Routes
 * API endpoints for viewing and managing activity logs
 */

import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import activityLogController from '../controllers/activityLogController';

const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get activity logs with filters and pagination
router.get('/', activityLogController.getActivityLogs);

// Get activity statistics
router.get('/stats', activityLogController.getActivityStats);

// Get recent activity (for dashboard)
router.get('/recent', activityLogController.getRecentActivity);

// Get available entity types for filtering
router.get('/entity-types', activityLogController.getEntityTypes);

// Get available actions for filtering
router.get('/actions', activityLogController.getActions);

// Get all users for filtering dropdown
router.get('/users', activityLogController.getUsers);

// Get activity logs for a specific user
router.get('/user/:id', activityLogController.getUserActivity);

// Get activity logs for a specific entity
router.get('/entity/:type/:id', activityLogController.getEntityActivity);

// Export activity logs to CSV
router.get('/export', activityLogController.exportLogs);

// Cleanup old logs (admin only)
router.post('/cleanup', requireAdmin, activityLogController.cleanupLogs);

export default router;
