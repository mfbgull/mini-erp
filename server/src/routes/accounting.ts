/**
 * Accounting Routes
 * -----------------
 * REST surface for the chart of accounts and accounting periods.
 *
 * Mount point: /api/accounting
 *
 * Auth:
 *   - All routes are gated by authenticateToken.
 *   - State-changing routes (POST /periods, POST /periods/:id/close) are
 *     gated by requireAdmin on top of the token check.
 *
 *   Note: we apply the admin guard inside the controller rather than as
 *   router-level middleware so that we can return our own JSON error
 *   shape via sendForbidden() instead of a bare 403 from the middleware.
 *
 * Rate limiting: the global apiLimiter (in app.ts) covers all /api routes.
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { sensitiveOperationLimiter } from '../middleware/rateLimiter';
import accountingController from '../controllers/accountingController';

const router = Router();

// All endpoints require authentication.
router.use(authenticateToken);

// ---- Chart of accounts -----------------------------------------------------

// GET /api/accounting/accounts
router.get('/accounts', accountingController.listAccounts);

// GET /api/accounting/accounts/balances  (must come before /:code so it
// doesn't get captured as a "code" param)
router.get('/accounts/balances', accountingController.listAccountBalances);

// GET /api/accounting/accounts/:code
router.get('/accounts/:code', accountingController.getAccount);

// GET /api/accounting/accounts/:code/balance
router.get('/accounts/:code/balance', accountingController.getAccountBalance);

// ---- Accounting periods ----------------------------------------------------

// GET /api/accounting/periods
router.get('/periods', accountingController.listPeriods);

// GET /api/accounting/periods/current  (must come before /:id)
router.get('/periods/current', accountingController.getCurrentPeriod);

// GET /api/accounting/periods/:id
router.get('/periods/:id', accountingController.getPeriod);

// POST /api/accounting/periods  (admin only; sensitive operation rate limit)
router.post(
  '/periods',
  sensitiveOperationLimiter,
  accountingController.openPeriod
);

// POST /api/accounting/periods/:id/close  (admin only)
router.post(
  '/periods/:id/close',
  sensitiveOperationLimiter,
  accountingController.closePeriod
);

export default router;
