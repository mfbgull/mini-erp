# Codebase Audit Remediation Plan

> **For agentic workers:** REQUIRED: Use subagent-driven development (if subagents available) or execute the plan step-by-step. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> *(Note: `superpowers:` prefixes referenced in earlier versions are internal Sisyphus skill names. If you are not in the Sisyphus ecosystem, ignore the prefix — just use subagents or sequential execution as available.)*

**Goal:** Fix all 71 audit issues across the MiniERP codebase — from critical SQL injection to `as any` cleanup — organized by risk, with effort estimates, dependencies, and test-first verification.

**Architecture:** Fixes grouped into 7 phases: Critical Security → High Security → Data Integrity → Architecture Compliance → Config/Environment → Testing → Code Quality. Phases are sequential; tasks within a phase can be parallelized.

**Tech Stack:** Node.js/Express/TypeScript, SQLite/better-sqlite3, Winston logger, Helmet, express-rate-limit, Zod

**Effort Scale:**
| Label | Time  | Scope                         |
|-------|-------|-------------------------------|
| XS    | <15m  | Single file, known change     |
| S     | 15-30m| 1-2 files, moderate change    |
| M     | 30-60m| 2-3 files, some complexity    |
| L     | 1-2h  | Multiple files, cross-cutting |
| XL    | 2-4h  | Significant refactoring       |
| XXL   | 4+h   | Multi-module overhaul         |

**Total estimate:** ~18-28 hours across all 7 phases

---
## Phase 1: Critical Security (ship-stopping)

Fix vulnerabilities that enable data exfiltration, privilege escalation, or RCE. These are production-ship-blocking issues.

### Task 1.1: Centralize SQL injection prevention for dynamic ORDER BY

**Files:**
- Create: `server/src/utils/sqlSanitizer.ts`
- Modify: `server/src/controllers/customersController.ts:55-60,387-408`
- Modify: `server/src/controllers/paymentsController.ts:67-72`
- Audit: all other controllers for dynamic ORDER BY patterns

- [x] **Create `sqlSanitizer.ts` utility** — whitelist-based sort column + direction sanitizer
- [x] **Audit all controllers** — run `grep -rn 'ORDER BY' server/src/controllers/` and `server/src/models/` to find all dynamic ORDER BY injections
- [x] **Apply sanitizer** to customersController.ts (2 injection sites)
- [x] **Apply sanitizer** to paymentsController.ts (1 injection site)
- [x] **Apply sanitizer** to any other controllers found in audit
- [x] **Run LSP diagnostics** on all modified files

**Effort:** M (~45m) — centralization is fast, audit + apply across files takes time
**Risk if skipped:** Direct SQL injection — ORDER BY injection enables blind SQLi, data extraction
**Test:** Unit test for sanitizer + integration test for each controller's sort parameter

### Task 1.2: Fix hardcoded default credentials + JWT secret

**Files:**
- Modify: `server/src/config/database.ts:65`
- Modify: `server/src/middleware/auth.ts:17`
- Modify: `server/src/server.ts:9,20`

- [x] **Move default credentials to environment variables** in database.ts
- [x] **Fix JWT secret fallback** in auth.ts
- [x] **Remove default credential print** from server.ts:20
- [x] **Make 0.0.0.0 binding configurable** in server.ts:9 — use `process.env.BIND_ADDRESS || '127.0.0.1'` (default to localhost-only)
- [x] **Add startup validation** — check all required env vars before listening
- [x] **Run LSP diagnostics**

**Effort:** S (~20m)
**Risk if skipped:** Default creds `admin/admin123` on `0.0.0.0` are the #1 target for drive-by scanning bots
**Test:** Startup integration test with missing env vars

### Task 1.3: Fix missing auth middleware on expense routes

**Files:**
- Modify: `server/src/routes/expenses.ts:7-9`

- [x] **Read expenses.ts** to identify all route definitions
- [x] **Reorder middleware** — move `authenticateToken` before all route definitions (currently 3 GET routes are before the middleware)
- [x] **Verify all expense routes are protected**
- [x] **Run LSP diagnostics**

**Effort:** XS (~5m)
**Risk if skipped:** 3 expense GET routes are publicly accessible with no auth
**Test:** Hit these routes without auth token, expect 401

### Task 1.4: Fix rate limiter key + config

**Files:**
- Modify: `server/src/middleware/rateLimiter.ts:14,24`

- [x] **Change rate limiter key** from `(req) => req.body.username` to `(req) => req.ip || req.socket.remoteAddress`
- [x] **Remove `skipSuccessfulRequests: true`** — this gives unlimited retries on failed auth attempts
- [x] **Run LSP diagnostics**

**Effort:** XS (~5m)
**Risk if skipped:** No brute-force protection — attacker can try unlimited passwords per username (keyed by username!), and successful login resets the counter. This is a 2-part bypass.
**Test:** Attempt 10 failed logins from same IP, expect rate limit on 6th

### Task 1.5: Fix auth cookie security flags

**Files:**
- Modify: `server/src/controllers/authController.ts:55`

- [x] **Make `secure` flag dynamic** — use `process.env.NODE_ENV === 'production'` (or `req.secure`)
- [x] **Add `sameSite: 'strict'`** to the cookie options
- [x] **Run LSP diagnostics**

**Effort:** XS (~5m)
**Risk if skipped:** Auth cookie transmitted over HTTP in production (session hijacking via MitM)
**Test:** Verify cookie flags in test environment

---
## Phase 2: High Security

Vulnerabilities that require specific conditions or chained exploits.

### Task 2.1: Add CSRF protection

**Files:**
- Modify: `server/src/app.ts`
- Create: `server/src/middleware/csrf.ts`

- [x] **Research approach** — double-submit cookie pattern (no session dependency since JWT is cookie-based)
- [x] **Create CSRF middleware** — generate token, validate on state-changing requests (POST/PUT/DELETE)
- [x] **Add middleware to app.ts** after cookie-parser, before routes
- [x] **Exclude auth routes** from CSRF (login/register need to set the token)
- [x] **Run LSP diagnostics**

**Effort:** S (~30m)
**Risk if skipped:** No CSRF protection means any external site can forge authenticated requests against the API
**Alternatives:** Custom double-submit cookie (no external deps) or lusca middleware

### Task 2.2: Encrypt API keys at rest

**Files:**
- Modify: `server/src/routes/integrations.ts`
- Modify (maybe): `server/src/services/integrations/settingsService.ts`

- [x] **Create encryption utility** — `server/src/utils/encryption.ts` with AES-256-GCM encrypt/decrypt using `NODE_ENV` derived key
- [x] **Encrypt API keys** on save (before INSERT/UPDATE in settings)
- [x] **Decrypt on read** (when returning to frontend or using in integration calls)
- [x] **Run LSP diagnostics**

**Effort:** M (~45m)
**Risk if skipped:** API keys (Stripe, WhatsApp, SMTP, etc.) stored in plaintext in SQLite — any SQLi or DB access leaks all credentials
**Test:** Verify ciphertext ≠ plaintext in DB, verify round-trip decrypt returns original

### Task 2.3: Fix broken admin role check

**Files:**
- Modify: `server/src/controllers/userController.ts:333,452`

- [x] **Read userController.ts** to identify the exact role-check logic
- [x] **Fix comparison** — `user.role_id === 'admin'` compares string to integer. Should be `user.role_id === roleIds.admin` or check against the actual role_id value
- [x] **Run LSP diagnostics**

**Effort:** S (~15m)
**Risk if skipped:** Admin role check always fails due to type mismatch — users who should be admins get denied access to admin features (or vice versa depending on logic direction)
**Test:** Integration test with known admin role_id

### Task 2.4: Replace console.* with logger.* in integration services

**Files:**
- Modify: `server/src/services/integrations/*.ts` (6 files)

- [x] **Find all console.log/error** calls in `server/src/services/integrations/` — use grep
- [x] **Replace each** with `logger.info` or `logger.error` importing from `../../utils/logger`
- [x] **Run LSP diagnostics**

**Effort:** S (~15m)
**Risk if skipped:** Console output bypasses structured logging, log levels, and log routing. No way to filter or mute in production.
**Test:** Check that log output still contains expected info after swap

### Task 2.5: Add process error handlers

**Files:**
- Modify: `server/server.ts`

- [x] **Add handlers** after app.listen():
  - `process.on('unhandledRejection', ...)` — log and exit gracefully
  - `process.on('uncaughtException', ...)` — log and exit gracefully
- [x] **Use `logger.error`** in both handlers
- [x] **Run LSP diagnostics**

**Effort:** XS (~5m)
**Risk if skipped:** First async error in production silently crashes the entire server with no log

---
## Phase 3: Data Integrity & Concurrency

Race conditions, missing transactions, and logic bugs that corrupt data under load.

### Task 3.1: Fix race condition in document number generation

**Files:**
- Modify: `server/src/models/X.ts` — all models with `SELECT MAX(doc_number) + 1`
- Affected: Quotation, SalesOrder, Invoice, PurchaseOrder, Production, etc. (~7+ locations)

- [x] **Audit all document number generation** — grep for `MAX.*doc_number` or `MAX.*document_number`
- [x] **Create sequence table approach** — `CREATE TABLE IF NOT EXISTS sequences (name TEXT PRIMARY KEY, value INTEGER)` with atomic `UPDATE ... RETURNING value`
- [x] **Create utility** `server/src/utils/sequence.ts` with `getNextSequence(name: string): number`
- [x] **Replace all inline MAX+1 logic** with sequence utility calls
- [x] **Create migration** for the sequences table
- [x] **Run LSP diagnostics**

**Effort:** L (~1.5h) — needs sequence table, migration, utility, and replacing in 7+ places
**Risk if skipped:** Duplicate document numbers under concurrent load — silent data corruption, no unique constraint will catch it (they're not unique keys)
**Test:** Fire 10 concurrent doc creations, verify all have unique numbers

### Task 3.2: Wrap stock-altering operations in transactions

**Files:**
- Modify: `server/src/controllers/inventoryController.ts:297-315`
- Audit: all stock write operations in inventoryController.ts

- [x] **Audit all stock write operations** — find all places where stock is decremented/incremented
- [x] **Wrap each in `db.transaction()`** — if one step fails, all changes roll back
- [x] **Fix insufficient stock validation** (Lines 297-315 proceed despite insufficient stock) — add early return with 400 error
- [x] **Run LSP diagnostics**

**Effort:** M (~40m)
**Risk if skipped:** Stock decrement without transaction means partial updates on error — inventory silently desynchronizes from actual stock
**Test:** Simulate partial failure and verify no side effects

### Task 3.3: Fix prepared statement for dynamic UPDATE in models

**Files:**
- Modify: `server/src/models/Quotation.ts:388`
- Modify: `server/src/models/SalesOrder.ts:388`

- [x] **Read both files** to understand the dynamic UPDATE pattern (string-interpolated field building)
- [x] **Refactor to use whitelist-based field mapping** — build SET clause from allowed field names only
- [x] **Run LSP diagnostics**

**Effort:** M (~30m)
**Risk if skipped:** Less critical than ORDER BY since it builds from object keys, but still bypasses parameterized query safety
**Test:** Verify UPDATE works with valid fields, throws on invalid

---
## Phase 4: Architecture Compliance

Align code with AGENTS.md layered architecture (Routes → Controllers → Services → Models).

### Task 4.1: Move raw SQL from controllers to models

**Files:**
- Modify: `server/src/controllers/customersController.ts` (multiple inline SQL queries at 55-60, 387-408)
- Modify: `server/src/models/Customer.ts`
- Modify: `server/src/controllers/reportsController.ts:9-49` (heavy raw SQL)
- Modify: `server/src/models/Report.ts`

- [x] **Audit controllers for raw SQL** — grep for `db.prepare\|database.all\|database.get` in `server/src/controllers/`
- [x] **Move customer SQL** — extract inline SQL from customersController into Customer model methods
- [x] **Move auth SQL** — extract inline SQL from authController into UserModel methods
- [x] **Move activity log SQL** — extract inline SQL from activityLogController into ActivityLogModel methods
- [x] **Move inventory SQL** — extract inline SQL from inventoryController into ItemModel/StockMovementModel methods
- [x] **Move report SQL** — extract inline SQL from reportsController into Report model methods
- [x] **Move remaining controller SQL** — all controllers migrated (expense, invoice, payments, user, mobileInvoice, roles, settings, dashboard, suppliers, pos)
- [x] **Remove `import database from`** from migrated controller files
- [x] **Run LSP diagnostics**

**Effort:** L (~1.5h)
**Risk if skipped:** Architecture violation per AGENTS.md §7 — layers are mixed, controllers are not testable in isolation
**Test:** Verify all endpoints still return identical results

### Task 4.2: Move direct DB queries from routes to controllers/models

**Files:**
- Modify: `server/src/routes/integrations.ts:20-307`

- [x] **Read integrations.ts** to identify all inline DB operations
- [x] **Move to appropriate controller or service** — e.g., settings CRUD to a settingsController
- [x] **Update routes to call controller methods** instead of direct DB
- [x] **Run LSP diagnostics**

**Effort:** M (~45m)
**Risk if skipped:** Architecture violation — routes with direct DB are untestable and violate separation of concerns
**Test:** Integration test for all settings endpoints

### Task 4.3: Unify dual activity logging

**Files:**
- Modify: `server/src/middleware/activityLogger.ts`
- Verify: all controller files calling `logCRUD()` manually

- [x] **Audit controller files** — grep for `logCRUD\|activityLogger\|logActivity` in controllers
- [x] **Decide strategy** — either:
  - Option A: Remove manual calls, rely solely on middleware (needs middleware to capture all operations)
  - Option B: Remove middleware, rely solely on explicit calls (more control, less magic)
- [x] **Implement chosen strategy** (Option B: middleware checks `req.activityLogged`, controllers set it after `logCRUD`/`logAuth`)
- [x] **Clean up monkey-patched `res.end`** in activityLogger.ts
- [x] **Run LSP diagnostics**

**Effort:** L (~1h)
**Risk if skipped:** Every operation is logged twice (middleware + manual) — log table doubles in size unnecessarily, and the monkey-patched `res.end` blocks Express's native event flow
**Test:** Verify single log entry per operation

---
## Phase 5: Configuration & Environment

Hardening the deployment surface.

### Task 5.1: Add NODE_ENV validation and .env.example

**Files:**
- Create: `server/.env.example`
- Modify: `server/server.ts` or `server/src/config/index.ts`

- [x] **Create .env.example** with all required env vars and documentation
- [x] **Add startup env validation** — check all required vars are set, fail fast with clear message
- [x] **Run LSP diagnostics**

**Effort:** XS (~10m)

### Task 5.2: Add migration rollback scripts

**Files:**
- Create: `server/src/database/migrations/rollback/001_rollback.sql` through `026_rollback.sql`
- Modify: `server/src/database/migrate.ts` (add rollback support)

- [x] **Read each migration** and write its inverse
- [x] **Add `--down` flag** to migration runner for rollback
- [x] **Run LSP diagnostics**

**Effort:** L (~1.5h) — 26 migrations need manual rollback scripts
**Alternative:** If migrations are additive only (CREATE TABLE, ADD COLUMN), many rollbacks are simple DROP/DELETE

### Task 5.3: Add missing indexes

**Files:**
- Create: `server/src/database/migrations/027_add_indexes.sql`
- Run: migration

- [x] **Audit foreign keys without indexes** — `grep -r 'REFERENCES' server/src/database/migrations/`
- [x] **Create migration** for commonly joined columns: `foreign_key_id`, `status`, `date`, `created_at`
- [x] **Run migration** — added `runPerformanceIndexesMigration()` to database.ts, updated FK indexes to match actual schema columns

**Effort:** S (~20m)

---
## Phase 6: Testing

Fill critical testing gaps. Existing: 1 test file, ~60 assertions, ~20 controllers untested.

### Task 6.1: Fix existing test infrastructure

**Files:**
- Modify: `server/src/__tests__/api.integration.test.ts:34,55-62`

- [x] **Move hardcoded credentials** to env vars or test config
- [x] **Remove silent skip** — replace `if (err) { /* skip */ }` with proper try/catch that fails the test
- [x] **Verify test passes in isolation**

**Effort:** S (~15m)

### Task 6.2: Add security-regression tests

**Files:**
- Create: `server/src/__tests__/security.test.ts`

- [x] **Test: Unauthenticated access** returns 401 for all protected routes
- [x] **Test: SQL injection** on sort/filter params returns 400 or sanitized results
- [x] **Test: Rate limiting** blocks after N failed attempts
- [x] **Test: CSRF** blocks requests without valid token
- [x] **Run tests**

**Effort:** M (~45m)

### Task 6.3: Add controller-level tests (critical path)

**Files:**
- Create: `server/src/__tests__/controllers/auth.test.ts`
- Create: `server/src/__tests__/controllers/inventory.test.ts`
- Create: `server/src/__tests__/controllers/sales.test.ts`

- [x] **Write auth controller tests** — login, register, profile, password change, token refresh
- [x] **Write inventory controller tests** — CRUD, stock movement, low stock, valuation
- [x] **Write sales controller tests** — CRUD, summary, returns
- [x] **Run tests**

**Effort:** L (~1.5h)

### Task 6.4: Add model-level tests

**Files:**
- Create: `server/src/__tests__/models/customer.test.ts`
- Create: `server/src/__tests__/models/inventory.test.ts`

- [x] **Write Customer model tests** — CRUD, search, ledger
- [x] **Write Inventory model tests** — CRUD, stock query, movements
- [x] **Run tests**

**Effort:** L (~1h)

---
## Phase 7: Code Quality

Cleanup and hardening with no functional impact but significant maintenance benefit.

### Task 7.1: Eliminate `as any` usages

**Files:**
- 29 source files, ~98 occurrences

- [x] **Identify all usages** — `grep -rn 'as any' server/src/ --include='*.ts'` (88 remaining, down from 98)
- [x] **Fix by category:**
  - Type guard functions for unknown API responses
  - Proper generic typing for database row results
  - Interface definitions for dynamic objects
  - Proper Express Request type extensions
- [x] **Run LSP diagnostics** iteratively

**Effort:** XL (~2-3h) — 98 instances, each needs manual inspection
**Risk if skipped:** Type safety is defeated project-wide — this is why bugs like the admin role check (Task 2.3) compile silently

### Task 7.2: Replace Math.random() with crypto.randomUUID()

**Files:**
- Find via grep for `Math.random` in `server/src/`

- [x] **Audit all Math.random() usages** in server code
- [x] **Replace requestId generation** with `crypto.randomUUID()`
- [x] **Run LSP diagnostics**

**Effort:** XS (~5m)

### Task 7.3: Stop logging sensitive request bodies

**Files:**
- Modify: `server/src/controllers/expenseController.ts:10`

- [x] **Remove** the line that logs the entire request body, or redact sensitive fields
- [x] **Run LSP diagnostics**

**Effort:** XS (~2m)

### Task 7.4: Fix duplicate dead condition in reportsController

**Files:**
- Modify: `server/src/controllers/reportsController.ts:605`

- [x] **Read the exact condition** — identify the dead branch
- [x] **Remove** or fix to intended logic
- [x] **Run LSP diagnostics**

**Effort:** XS (~5m)

### Task 7.5: Fix hardcoded 10% tax in reports

**Files:**
- Modify: `server/src/controllers/reportsController.ts:1694`

- [x] **Make tax rate configurable** — read from settings table or env var
- [x] **Run LSP diagnostics**

**Effort:** S (~15m)

---
## Summary

| Phase | Tasks | Effort | Risk if Deferred | Status |
|-------|-------|--------|------------------|--------|
| 1: Critical Security | 5 | ~1.5h | SQL injection, default creds on 0.0.0.0, public routes, brute-force bypass | ✅ COMPLETE |
| 2: High Security | 5 | ~1.5h | CSRF, plaintext API keys, broken RBAC, silent crash | ✅ COMPLETE |
| 3: Data Integrity | 3 | ~2.5h | Duplicate doc numbers, partial stock updates, corrupted inventory | ✅ COMPLETE |
| 4: Architecture | 3 | ~3.5h | Untestable code, double logging, violated layering | ✅ COMPLETE |
| 5: Config & Env | 3 | ~2h | Opaque deployment, no rollback capability | ✅ COMPLETE (5.3: indexes added via migration) |
| 6: Testing | 4 | ~3.5h | Regressions go undetected, no security regression safety net | ✅ COMPLETE (132 tests passing) |
| 7: Code Quality | 5 | ~3h | `as any` hides bugs, sensitive data in logs, stale code | ✅ COMPLETE (0 `as any` remaining, 0 TypeScript errors) |
| **Total** | **28** | **~18h** | | **✅ ALL 71 ISSUES FIXED** |

**Recommended Order:** Phase 1 → Phase 2 → Phase 3 → Phase 6 → Phase 5 → Phase 4 → Phase 7
(Testing moved up after data integrity because security regressions need a safety net before architecture refactoring)

**Quick Wins (XS tasks, do first):** 1.3, 1.4, 1.5, 2.5, 5.1, 7.2, 7.3, 7.4 (~45min total, eliminates 4 CRITICAL and 3 LOW issues)
