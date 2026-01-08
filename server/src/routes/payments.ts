import express from 'express';
const router = express.Router();
import paymentsController from '../controllers/paymentsController';

router.get('/', paymentsController.getPayments);
router.get('/:id', paymentsController.getPayment);
router.post('/', paymentsController.createPayment);
router.put('/:id', paymentsController.updatePayment);
router.delete('/:id', paymentsController.deletePayment);
router.post('/:id/allocate', paymentsController.allocatePaymentToInvoice);

export default router;
