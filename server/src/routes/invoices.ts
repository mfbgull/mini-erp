import express from 'express';
const router = express.Router();
import invoiceController from '../controllers/invoiceController';
import { authenticateToken } from '../middleware/auth';

router.use(authenticateToken);

router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoice);
router.get('/:id/payments', invoiceController.getInvoicePayments);
router.post('/', invoiceController.createInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

export default router;
