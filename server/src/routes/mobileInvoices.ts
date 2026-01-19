import express from 'express';
const router = express.Router();
import mobileInvoiceController from '../controllers/mobileInvoiceController';
import { authenticateToken } from '../middleware/auth';

// All routes require authentication
router.use(authenticateToken);

// Draft management - for saving incomplete invoice state
router.post('/draft', mobileInvoiceController.createDraft);
router.put('/draft/:id', mobileInvoiceController.updateDraft);
router.get('/draft/:id', mobileInvoiceController.getDraft);
router.delete('/draft/:id', mobileInvoiceController.deleteDraft);

// Search endpoints for mobile autocomplete
router.get('/items/search', mobileInvoiceController.searchItems);
router.get('/customers/search', mobileInvoiceController.searchCustomers);

// Configuration endpoints
router.get('/tax-rates', mobileInvoiceController.getTaxRates);
router.get('/payment-terms', mobileInvoiceController.getPaymentTerms);

// Final submission - creates actual invoice from draft or direct data
router.post('/submit', mobileInvoiceController.submitInvoice);

export default router;
