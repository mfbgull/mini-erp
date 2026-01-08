import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth';
import expenseController from '../controllers/expenseController';

router.get('/categories', expenseController.getExpenseCategories);
router.get('/status-options', expenseController.getExpenseStatusOptions);
router.get('/payment-method-options', expenseController.getExpensePaymentMethodOptions);

router.use(authenticateToken);

router.post('/', expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.get('/summary', expenseController.getExpenseSummary);
router.get('/date-range', expenseController.getExpensesByDateRange);
router.get('/category/:category', expenseController.getExpensesByCategory);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);
router.post('/categories', expenseController.createExpenseCategory);
router.put('/categories/:id', expenseController.updateExpenseCategory);
router.delete('/categories/:id', expenseController.deleteExpenseCategory);

export default router;
