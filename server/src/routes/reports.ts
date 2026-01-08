import express from 'express';
const router = express.Router();
import reportsController from '../controllers/reportsController';

router.get('/ar-aging', reportsController.getARAgingReport);
router.get('/customer-statements', reportsController.getCustomerStatements);
router.get('/top-debtors', reportsController.getTopDebtors);
router.get('/dso', reportsController.getDSOMetric);
router.get('/ar-summary', reportsController.getReceivablesSummary);
router.get('/sales-summary', reportsController.getSalesSummary);
router.get('/sales-by-customer', reportsController.getSalesByCustomer);
router.get('/sales-by-item', reportsController.getSalesByItem);
router.get('/stock-level', reportsController.getStockLevelReport);
router.get('/low-stock', reportsController.getLowStockReport);
router.get('/stock-valuation', reportsController.getStockValuationReport);
router.get('/inventory-movement', reportsController.getInventoryMovementReport);
router.get('/profit-loss', reportsController.getProfitLossReport);
router.get('/cash-flow', reportsController.getCashFlowReport);
router.get('/purchase-summary', reportsController.getPurchaseSummary);
router.get('/supplier-analysis', reportsController.getSupplierAnalysis);
router.get('/production-summary', reportsController.getProductionSummary);
router.get('/bom-usage', reportsController.getBOMUsageReport);
router.get('/expenses', reportsController.getExpensesReport);

export default router;
