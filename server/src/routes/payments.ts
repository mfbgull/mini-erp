import express from 'express';
const router = express.Router();
import paymentsController from '../controllers/paymentsController';
import { validateZodQuery, validateZodParams, zodSchemas } from '../middleware/validation';
import { z } from 'zod';

const paymentListQuery = z.object({
  ...zodSchemas.pagination.shape,
  ...zodSchemas.search.shape,
  ...zodSchemas.sorting(['payment_date', 'payment_no', 'amount', 'customer_name', 'id', 'created_at']).shape,
  ...zodSchemas.dateRange.shape,
  customerId: z.string().regex(/^\d+$/).optional(),
});

router.get('/', validateZodQuery(paymentListQuery), paymentsController.getPayments);
router.get('/:id', validateZodParams(zodSchemas.id), paymentsController.getPayment);
router.post('/', paymentsController.createPayment);
router.put('/:id', paymentsController.updatePayment);
router.delete('/:id', paymentsController.deletePayment);
router.post('/:id/allocate', paymentsController.allocatePaymentToInvoice);

export default router;
