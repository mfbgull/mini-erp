import express from 'express';
const router = express.Router();
import {
  getAllBOMs,
  getBOMById,
  getBOMsByFinishedItem,
  createBOM,
  updateBOM,
  toggleBOMActive,
  deleteBOM
} from '../controllers/bomController';
import { authenticateToken } from '../middleware/auth';

router.get('/', getAllBOMs);
router.get('/:id', getBOMById);
router.get('/by-item/:itemId', getBOMsByFinishedItem);
router.post('/', authenticateToken, createBOM);
router.put('/:id', authenticateToken, updateBOM);
router.patch('/:id/toggle-active', authenticateToken, toggleBOMActive);
router.delete('/:id', authenticateToken, deleteBOM);

export default router;
