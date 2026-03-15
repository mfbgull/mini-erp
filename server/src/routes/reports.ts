import express from 'express';
const router = express.Router();
import reportsController from '../controllers/reportsController';
import { authenticateToken } from '../middleware/auth';
import { sensitiveOperationLimiter } from '../middleware/rateLimiter';
import { validateZodQuery, zodSchemas } from '../middleware/validation';

// All report routes require authentication
router.use(authenticateToken);

router.get('/ar-aging', sensitiveOperationLimiter, reportsController.getARAgingReport);
router.get('/customer-statements', sensitiveOperationLimiter, reportsController.getCustomerStatements);
router.get('/top-debtors', reportsController.getTopDebtors);
router.get('/dso', validateZodQuery(zodSchemas.period), reportsController.getDSOMetric);
router.get('/ar-summary', reportsController.getReceivablesSummary);
router.get('/sales-summary', reportsController.getSalesSummary);
router.get('/sales-by-customer', reportsController.getSalesByCustomer);
router.get('/sales-by-item', reportsController.getSalesByItem);
router.get('/stock-level', reportsController.getStockLevelReport);
router.get('/low-stock', reportsController.getLowStockReport);
router.get('/stock-valuation', sensitiveOperationLimiter, reportsController.getStockValuationReport);
router.get('/inventory-movement', sensitiveOperationLimiter, reportsController.getInventoryMovementReport);
router.get('/profit-loss', sensitiveOperationLimiter, reportsController.getProfitLossReport);
router.get('/cash-flow', sensitiveOperationLimiter, reportsController.getCashFlowReport);
router.get('/purchase-summary', reportsController.getPurchaseSummary);
router.get('/supplier-analysis', reportsController.getSupplierAnalysis);
router.get('/production-summary', reportsController.getProductionSummary);
router.get('/bom-usage', reportsController.getBOMUsageReport);
router.get('/expenses', sensitiveOperationLimiter, reportsController.getExpensesReport);
router.get('/trial-balance', sensitiveOperationLimiter, reportsController.getTrialBalanceReport);
router.get('/general-ledger', sensitiveOperationLimiter, reportsController.getGeneralLedgerReport);
router.get('/balance-sheet', sensitiveOperationLimiter, reportsController.getBalanceSheetReport);
router.get('/income-statement', sensitiveOperationLimiter, reportsController.getIncomeStatementReport);
router.get('/tax-summary', sensitiveOperationLimiter, reportsController.getTaxSummaryReport);
router.get('/batch-traceability/:itemId', reportsController.getBatchTraceabilityReport);

export default router;
