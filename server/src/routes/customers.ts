import express from 'express';
const router = express.Router();
import customersController from '../controllers/customersController';
import { authenticateToken } from '../middleware/auth';
import { validateZodQuery, validateZodParams, zodSchemas } from '../middleware/validation';
import { z } from 'zod';

// All customer routes require authentication
router.use(authenticateToken);

const customerListQuery = z.object({
  ...zodSchemas.pagination.shape,
  ...zodSchemas.search.shape,
  ...zodSchemas.sorting(['customer_name', 'customer_code', 'created_at', 'id', 'current_balance', 'credit_limit']).shape,
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
});

router.get('/', validateZodQuery(customerListQuery), customersController.getCustomers);
router.get('/:id', validateZodParams(zodSchemas.id), customersController.getCustomer);
router.post('/', customersController.createCustomer);
router.put('/:id', customersController.updateCustomer);
router.delete('/:id', customersController.deleteCustomer);
router.get('/:id/ledger', customersController.getCustomerLedger);
router.get('/:id/statement', customersController.getCustomerStatement);
router.get('/:id/balance', customersController.getCustomerBalance);
router.post('/recalculate-balances', customersController.recalculateAllBalances);

export default router;
