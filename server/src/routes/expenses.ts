import express from 'express';
const router = express.Router();
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { sensitiveOperationLimiter } from '../middleware/rateLimiter';
import expenseController from '../controllers/expenseController';

router.get('/categories', expenseController.getExpenseCategories);
router.get('/status-options', expenseController.getExpenseStatusOptions);
router.get('/payment-method-options', expenseController.getExpensePaymentMethodOptions);

router.use(authenticateToken);

router.post('/', sensitiveOperationLimiter, expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.get('/summary', expenseController.getExpenseSummary);
router.get('/date-range', expenseController.getExpensesByDateRange);
router.get('/category/:category', expenseController.getExpensesByCategory);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', sensitiveOperationLimiter, expenseController.updateExpense);
router.delete('/:id', requireAdmin, sensitiveOperationLimiter, expenseController.deleteExpense);
router.post('/categories', sensitiveOperationLimiter, expenseController.createExpenseCategory);
router.put('/categories/:id', sensitiveOperationLimiter, expenseController.updateExpenseCategory);
router.delete('/categories/:id', requireAdmin, sensitiveOperationLimiter, expenseController.deleteExpenseCategory);

export default router;
