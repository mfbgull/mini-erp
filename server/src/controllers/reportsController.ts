import { Request, Response } from 'express';
import db from '../config/database';
import logger from '../utils/logger';
import ReportsModel from '../models/Reports';

function getARAgingReport(req: Request, res: Response): void {
  try {
    const asOfDate = (Array.isArray(req.query.asOfDate) ? req.query.asOfDate[0] : req.query.asOfDate) || new Date().toISOString().split('T')[0];
    res.json({ success: true, data: ReportsModel.getARAgingReport(asOfDate as string, db) });
  } catch (error) {
    logger.error('Error fetching AR aging report:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch AR aging report' });
  }
}

function getCustomerStatements(req: Request, res: Response): void {
  try {
    const { customerId } = req.query;
    if (!customerId) { res.status(400).json({ success: false, error: 'customerId is required' }); return; }
    const statements = ReportsModel.getCustomerStatements(db, parseInt(customerId as string, 10));
    res.json({ success: true, data: statements });
  } catch (error) {
    logger.error('Error fetching customer statements:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer statements' });
  }
}

function getTopDebtors(req: Request, res: Response): void {
  try {
    const { limit = 10 } = req.query;
    const debtors = ReportsModel.getTopDebtors(db, parseInt(limit as string, 10));
    res.json({ success: true, data: debtors });
  } catch (error) {
    logger.error('Error fetching top debtors:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch top debtors' });
  }
}

function getDSOMetric(req: Request, res: Response): void {
  try {
    const period = (req.query as { period?: number }).period ?? 30;
    const dsoData = ReportsModel.getDSOMetric(db, period);
    res.json({ success: true, data: dsoData });
  } catch (error) {
    logger.error('Error fetching DSO metric:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch DSO metric' });
  }
}

function getReceivablesSummary(req: Request, res: Response): void {
  try {
    const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().split('T')[0];
    const summary = ReportsModel.getReceivablesSummary(db, asOfDate);
    res.json({ success: true, data: { asOfDate, ...summary } });
  } catch (error) {
    logger.error('Error fetching receivables summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch receivables summary' });
  }
}

function getSalesSummary(req: Request, res: Response): void {
  try {
    const _defaultEnd = new Date();
    const _defaultStart = new Date();
    _defaultStart.setMonth(_defaultStart.getMonth() - 1);
    const startDefault = _defaultStart.toISOString().split('T')[0];
    const endDefault = _defaultEnd.toISOString().split('T')[0];
    const startDate = String((Array.isArray(req.query.startDate) ? req.query.startDate[0] : req.query.startDate) || startDefault);
    const endDate = String((Array.isArray(req.query.endDate) ? req.query.endDate[0] : req.query.endDate) || endDefault);
    const salesData = ReportsModel.getSalesSummary(db, startDate, endDate);
    res.json({ success: true, data: salesData });
  } catch (error) {
    logger.error('Error fetching sales summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sales summary' });
  }
}

function getSalesByCustomer(req: Request, res: Response): void {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) { res.status(400).json({ success: false, error: 'startDate and endDate are required' }); return; }
    const sales = ReportsModel.getSalesByCustomer(db, startDate as string, endDate as string);
    res.json({ success: true, data: { period: { startDate, endDate }, sales } });
  } catch (error) {
    logger.error('Error fetching sales by customer:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sales by customer' });
  }
}

function getSalesByItem(req: Request, res: Response): void {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) { res.status(400).json({ success: false, error: 'startDate and endDate are required' }); return; }
    const sales = ReportsModel.getSalesByItem(db, startDate as string, endDate as string);
    res.json({ success: true, data: { period: { startDate, endDate }, sales } });
  } catch (error) {
    logger.error('Error fetching sales by item:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sales by item' });
  }
}

function getStockLevelReport(req: Request, res: Response): void {
  try { res.json({ success: true, data: ReportsModel.getStockLevelReport(db) }); }
  catch (error) { logger.error('Error fetching stock level report:', error); res.status(500).json({ success: false, error: 'Failed to fetch stock level report' }); }
}

function getLowStockReport(req: Request, res: Response): void {
  try { res.json({ success: true, data: ReportsModel.getLowStockReport(db) }); }
  catch (error) { logger.error('Error fetching low stock report:', error); res.status(500).json({ success: false, error: 'Failed to fetch low stock report' }); }
}

function getStockValuationReport(req: Request, res: Response): void {
  try {
    const reportData = ReportsModel.getStockValuationReport(db);
    res.json({ success: true, data: reportData });
  } catch (error) { logger.error('Error fetching stock valuation report:', error); res.status(500).json({ success: false, error: 'Failed to fetch stock valuation report' }); }
}

function getInventoryMovementReport(req: Request, res: Response): void {
  try {
    const { startDate, endDate, itemId } = req.query;
    const reportData = ReportsModel.getInventoryMovementReport(db, startDate as string, endDate as string, itemId ? parseInt(itemId as string, 10) : undefined);
    res.json({ success: true, data: reportData });
  } catch (error) { logger.error('Error fetching inventory movement report:', error); res.status(500).json({ success: false, error: 'Failed to fetch inventory movement report' }); }
}

function getProfitLossReport(req: Request, res: Response): void {
  try {
    const fromDate = String((Array.isArray(req.query.fromDate) ? req.query.fromDate[0] : req.query.fromDate) || '');
    const toDate = String((Array.isArray(req.query.toDate) ? req.query.toDate[0] : req.query.toDate) || '');
    if (!fromDate || !toDate) { res.status(400).json({ success: false, error: 'fromDate and toDate are required' }); return; }
    res.json({ success: true, data: ReportsModel.getProfitLossReport(fromDate, toDate, db) });
  } catch (error) { logger.error('Error fetching P&L report:', error); res.status(500).json({ success: false, error: 'Failed to fetch P&L report' }); }
}

function getCashFlowReport(req: Request, res: Response): void {
  try {
    const fromDate = String((Array.isArray(req.query.fromDate) ? req.query.fromDate[0] : req.query.fromDate) || '');
    const toDate = String((Array.isArray(req.query.toDate) ? req.query.toDate[0] : req.query.toDate) || '');
    if (!fromDate || !toDate) { res.status(400).json({ success: false, error: 'fromDate and toDate are required' }); return; }
    res.json({ success: true, data: ReportsModel.getCashFlow(fromDate, toDate, db) });
  } catch (error) { logger.error('Error fetching cash flow report:', error); res.status(500).json({ success: false, error: 'Failed to fetch cash flow report' }); }
}

function getPurchaseSummary(req: Request, res: Response): void {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) { res.status(400).json({ success: false, error: 'startDate and endDate are required' }); return; }
    res.json({ success: true, data: ReportsModel.getPurchaseSummary(startDate as string, endDate as string, db) });
  } catch (error) { logger.error('Error fetching purchase summary:', error); res.status(500).json({ success: false, error: 'Failed to fetch purchase summary' }); }
}

function getSupplierAnalysis(req: Request, res: Response): void {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) { res.status(400).json({ success: false, error: 'startDate and endDate are required' }); return; }
    const analysis = ReportsModel.getSupplierAnalysis(db, startDate as string, endDate as string);
    res.json({ success: true, data: { period: { startDate, endDate }, analysis } });
  } catch (error) { logger.error('Error fetching supplier analysis:', error); res.status(500).json({ success: false, error: 'Failed to fetch supplier analysis' }); }
}

function getProductionSummary(req: Request, res: Response): void {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) { res.status(400).json({ success: false, error: 'startDate and endDate are required' }); return; }
    res.json({ success: true, data: ReportsModel.getProductionEfficiency(startDate as string, endDate as string, db) });
  } catch (error) { logger.error('Error fetching production summary:', error); res.status(500).json({ success: false, error: 'Failed to fetch production summary' }); }
}

function getBOMUsageReport(req: Request, res: Response): void {
  try {
    const { bomId } = req.query;
    if (!bomId) { res.status(400).json({ success: false, error: 'bomId is required' }); return; }
    res.json({ success: true, data: ReportsModel.getBOMUsage(parseInt(bomId as string, 10), db) });
  } catch (error) { logger.error('Error fetching BOM usage report:', error); res.status(500).json({ success: false, error: 'Failed to fetch BOM usage report' }); }
}

function getExpensesReport(req: Request, res: Response): void {
  try {
    const fromDate = String((Array.isArray(req.query.fromDate) ? req.query.fromDate[0] : req.query.fromDate) || req.query.from_date || '');
    const toDate = String((Array.isArray(req.query.toDate) ? req.query.toDate[0] : req.query.toDate) || req.query.to_date || '');
    const category = String((Array.isArray(req.query.category) ? req.query.category[0] : req.query.category) || '');
    if (!fromDate || !toDate) { res.status(400).json({ success: false, error: 'fromDate and toDate are required' }); return; }
    res.json({ success: true, data: ReportsModel.getExpenseReport(fromDate, toDate, category, db) });
  } catch (error) { logger.error('Error fetching expenses report:', error); res.status(500).json({ success: false, error: 'Failed to fetch expenses report' }); }
}

function getTrialBalanceReport(req: Request, res: Response): void {
  try {
    const { asOfDate = new Date().toISOString().split('T')[0] } = req.query;
    res.json({ success: true, data: ReportsModel.getTrialBalance(asOfDate as string, db) });
  } catch (error) { logger.error('Error fetching trial balance report:', error); res.status(500).json({ success: false, error: 'Failed to fetch trial balance report' }); }
}

function getGeneralLedgerReport(req: Request, res: Response): void {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) { res.status(400).json({ success: false, error: 'startDate and endDate are required' }); return; }
    res.json({ success: true, data: ReportsModel.getGeneralLedger(startDate as string, endDate as string, db) });
  } catch (error) { logger.error('Error fetching general ledger report:', error); res.status(500).json({ success: false, error: 'Failed to fetch general ledger report' }); }
}

function getBalanceSheetReport(req: Request, res: Response): void {
  try {
    const { asOfDate = new Date().toISOString().split('T')[0] } = req.query;
    res.json({ success: true, data: ReportsModel.getBalanceSheet(asOfDate as string, db) });
  } catch (error) { logger.error('Error fetching balance sheet report:', error); res.status(500).json({ success: false, error: 'Failed to fetch balance sheet report' }); }
}

function getIncomeStatementReport(req: Request, res: Response): void {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) { res.status(400).json({ success: false, error: 'startDate and endDate are required' }); return; }
    res.json({ success: true, data: ReportsModel.getIncomeStatement(startDate as string, endDate as string, db) });
  } catch (error) { logger.error('Error fetching income statement report:', error); res.status(500).json({ success: false, error: 'Failed to fetch income statement report' }); }
}

function getTaxSummaryReport(req: Request, res: Response): void {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) { res.status(400).json({ success: false, error: 'startDate and endDate are required' }); return; }
    res.json({ success: true, data: ReportsModel.getTaxSummary(startDate as string, endDate as string, db) });
  } catch (error) { logger.error('Error fetching tax summary report:', error); res.status(500).json({ success: false, error: 'Failed to fetch tax summary report' }); }
}

function getBatchTraceabilityReport(req: Request, res: Response): void {
  try {
    const { itemId } = req.query;
    if (!itemId) { res.status(400).json({ success: false, error: 'itemId is required' }); return; }
    const itemIdNum = parseInt(itemId as string, 10);
    res.json({ success: true, data: ReportsModel.getBatchTraceability(db, itemIdNum) });
  } catch (error) { logger.error('Error fetching batch traceability report:', error); res.status(500).json({ success: false, error: 'Failed to fetch batch traceability report' }); }
}

export default {
  getARAgingReport, getCustomerStatements, getTopDebtors, getDSOMetric, getReceivablesSummary,
  getSalesSummary, getSalesByCustomer, getSalesByItem, getStockLevelReport, getLowStockReport,
  getStockValuationReport, getInventoryMovementReport, getProfitLossReport, getCashFlowReport,
  getPurchaseSummary, getSupplierAnalysis, getProductionSummary, getBOMUsageReport,
  getExpensesReport, getTrialBalanceReport, getGeneralLedgerReport, getBalanceSheetReport,
  getIncomeStatementReport, getTaxSummaryReport, getBatchTraceabilityReport,
};
