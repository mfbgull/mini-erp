import express from 'express';
const router = express.Router();
import paymentsController from '../controllers/paymentsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateZodQuery, validateZodParams, zodSchemas } from '../middleware/validation';
import { sensitiveOperationLimiter } from '../middleware/rateLimiter';
import { z } from 'zod';

router.use(authenticateToken);

const paymentListQuery = z.object({
  ...zodSchemas.pagination.shape,
  ...zodSchemas.search.shape,
  ...zodSchemas.sorting(['payment_date', 'payment_no', 'amount', 'customer_name', 'id', 'created_at']).shape,
  ...zodSchemas.dateRange.shape,
  customerId: z.string().regex(/^\d+$/).optional(),
});

router.get('/', validateZodQuery(paymentListQuery), paymentsController.getPayments);
router.get('/:id', validateZodParams(zodSchemas.id), paymentsController.getPayment);
router.post('/', sensitiveOperationLimiter, paymentsController.createPayment);
router.put('/:id', sensitiveOperationLimiter, paymentsController.updatePayment);
router.delete('/:id', requireAdmin, sensitiveOperationLimiter, paymentsController.deletePayment);
router.post('/:id/allocate', sensitiveOperationLimiter, paymentsController.allocatePaymentToInvoice);

export default router;
