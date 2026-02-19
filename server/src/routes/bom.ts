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

// All BOM routes require authentication
router.use(authenticateToken);

router.get('/', getAllBOMs);
router.get('/:id', getBOMById);
router.get('/by-item/:itemId', getBOMsByFinishedItem);
router.post('/', createBOM);
router.put('/:id', updateBOM);
router.patch('/:id/toggle-active', toggleBOMActive);
router.delete('/:id', deleteBOM);

export default router;
