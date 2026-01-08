import express from 'express';
const router = express.Router();
import customersController from '../controllers/customersController';

router.get('/', customersController.getCustomers);
router.get('/:id', customersController.getCustomer);
router.post('/', customersController.createCustomer);
router.put('/:id', customersController.updateCustomer);
router.delete('/:id', customersController.deleteCustomer);
router.get('/:id/ledger', customersController.getCustomerLedger);
router.get('/:id/statement', customersController.getCustomerStatement);
router.get('/:id/balance', customersController.getCustomerBalance);
router.post('/recalculate-balances', customersController.recalculateAllBalances);

export default router;
