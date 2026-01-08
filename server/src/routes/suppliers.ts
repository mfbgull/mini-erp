import express from 'express';
const router = express.Router();
import suppliersController from '../controllers/suppliersController';

router.get('/', suppliersController.getSuppliers);
router.get('/next-code', suppliersController.getNextSupplierCode);
router.get('/:id', suppliersController.getSupplierById);
router.post('/', suppliersController.createSupplier);
router.put('/:id', suppliersController.updateSupplier);
router.delete('/:id', suppliersController.deleteSupplier);

export default router;