# Ponytail Audit: mini-erp

**Date:** 2026-06-20
**Scope:** Whole-repo over-engineering scan (116,831 lines of source)
**Mode:** report only — no changes applied

---

## How to use this document

Each finding is tagged and ranked by impact. To implement, process in order from
Tier 1 (biggest win per effort) to Tier 3 (optional polish). Every entry includes:

- **Tag** — what kind of finding: `delete`, `shrink`, `yagni`, `stdlib`
- **What to cut** — exact file(s) or pattern
- **Replacement** — what it becomes, or `nothing` if pure deletion
- **Lines saved** — rough estimate

Apply one tier at a time, commit between tiers.

---

## Tier 1 — Largest cuts

### 1.1 Duplicate type definitions across ~25 files

**Tag:** `delete`
**What:** 22+ per-entity `*Types.ts` files in `client/src/utils/` +
`client/src/types.ts` (271 lines) + `client/src/types/index.ts` (411 lines) +
`server/src/types/index.ts` (515 lines) — all defining near-identical
interfaces for the same entities.
**Replacement:** Keep ONE shared type location. `server/src/types/index.ts`
is authorative (server owns the data model). Have the client import from a
shared package or re-export a single file. Delete all `*Types.ts` files.
**Files to touch:**
- Delete: `client/src/utils/invoiceTypes.ts`, `customerTypes.ts`,
  `salesOrderTypes.ts`, `purchaseOrderTypes.ts`, `quotationTypes.ts`,
  `productionTypes.ts`, `integrationTypes.ts`, `purchaseOrderDetailTypes.ts`,
  `bomTypes.ts`, `arReportsTypes.ts`, `reportTypes.ts`, `quotationViewTypes.ts`,
  `stockMovementTypes.ts`, `itemTypes.ts`, `purchaseTypes.ts`,
  `expenseTypes.ts`, `posTypes.ts`, `dashboardTypes.ts`, `roleTypes.ts`,
  `userTypes.ts`, `supplierTypes.ts`, `settingsTypes.ts`,
  `supplierDetailTypes.ts`, `warehouseTypes.ts`
- Consolidate: `client/src/types.ts` + `client/src/types/index.ts` → one file
**Lines saved:** ~1,700

### 1.2 Per-entity route files (24 files, same CRUD boilerplate)

**Tag:** `delete`
**What:** Every entity has its own `routes/entity.ts` file doing the same
pattern: `router.post('/entity', controller.create)`, `router.get('/entity',
controller.getAll)`, etc. ~24 files, each 12-50 lines.
**Replacement:** One generic CRUD route factory function. Pass the controller
and base path, it registers all standard endpoints. Only keep custom routes
(non-CRUD) in per-entity files.
**Files to touch:**
- `server/src/routes/auth.ts`, `accounting.ts`, `activityLog.ts`, `bom.ts`,
  `customers.ts`, `dashboard.ts`, `employees.ts`, `expenses.ts`,
  `forecasts.ts`, `integrations.ts`, `inventory.ts`, `invoices.ts`,
  `mobileInvoices.ts`, `payments.ts`, `pos.ts`, `production.ts`,
  `purchaseOrders.ts`, `purchases.ts`, `reports.ts`, `roles.ts`, `sales.ts`,
  `settings.ts`, `suppliers.ts`, `users.ts`
**Lines saved:** ~600-700

### 1.3 SalesService — pure delegation layer

**Tag:** `delete`
**What:** `server/src/services/salesService.ts` wraps `QuotationModel`,
`SalesOrderModel`, `InvoiceModel` methods with zero added logic. Every method
is `return XModel.method(arg, db)`.
**Replacement:** Call model methods directly from controllers. Delete the
entire service file.
**File:** `server/src/services/salesService.ts`
**Lines saved:** ~300

### 1.4 Integration services (6 files, mostly speculative)

**Tag:** `delete` / `yagni`
**What:** 6 external API integrations in
`server/src/services/integrations/` — Weatherstack weather, TaxJar tax
calculation, Fixer currency exchange, Numverify phone validation, SendGrid
email, Twilio SMS. For a desktop SQLite ERP that likely serves one
company/location. Each service has `loadSettings()`, `reloadSettings()`,
`isConfigured()` boilerplate and a singleton pattern.
**Replacement:** Delete all 6 service files and the integrations route. If
email is genuinely needed, keep only `emailService.ts` and make it a simple
function, not a class.
**Files to delete:**
- `server/src/services/integrations/weatherService.ts`
- `server/src/services/integrations/taxService.ts`
- `server/src/services/integrations/currencyService.ts`
- `server/src/services/integrations/validationService.ts`
- `server/src/services/integrations/emailService.ts`
- `server/src/services/integrations/notificationService.ts`
- `server/src/routes/integrations.ts`
**Dependencies to remove from `server/package.json`:**
- `@sendgrid/mail`, `twilio`
**Lines saved:** ~1,000+ plus 2 dependencies

### 1.5 apiResponse.ts — 190-line Express response wrapper

**Tag:** `shrink`
**What:** `server/src/utils/apiResponse.ts` has `sendSuccess`, `sendCreated`,
`sendError`, `sendBadRequest`, `sendUnauthorized`, `sendForbidden`,
`sendNotFound`, `sendConflict`, `sendValidationError`, `sendInternalError`,
`sendLegacySuccess`, `sendLegacyError` — all wrappers around
`res.status(N).json(...)`.
**Replacement:** Use `res.status(N).json({data})` directly. Or keep 2 helpers
(`sendSuccess`, `sendError`) and delete the rest.
**File:** `server/src/utils/apiResponse.ts`
**Lines saved:** ~160

---

## Tier 2 — Medium cuts

### 2.1 Custom CSRF middleware

**Tag:** `yagni`
**What:** `server/src/middleware/csrf.ts` implements the double-submit cookie
pattern by hand — generating tokens, comparing cookie vs header, etc.
**Replacement:** For a first-party SPA talking to its own API, `SameSite=Strict`
cookies + `helmet` cover CSRF. Delete the middleware and the client-side
CSRF token injection in `client/src/utils/api.ts`.
**File:** `server/src/middleware/csrf.ts`
**Also remove** the CSRF token logic from `client/src/utils/api.ts`
(interceptor reading `csrf-token` cookie).
**Lines saved:** ~46 + client interceptor

### 2.2 Winston logger with file rotation

**Tag:** `yagni`
**What:** `server/src/utils/logger.ts` configures Winston with JSON format,
error-level file transport (with 5MB rotation), combined log file transport.
For a local desktop app.
**Replacement:** `console.log` with `[timestamp] [LEVEL]` prefix. Or keep
Winston but remove file transports — console only.
**File:** `server/src/utils/logger.ts`
**Lines saved:** ~30 (and simpler config)

### 2.3 Duplicated editable-cell / searchable-cell components

**Tag:** `delete`
**What:** 4 nearly identical `*EditableCell.tsx` components (Invoice,
PurchaseOrder, Quotation, SalesOrder), 4 `*SearchableCell.tsx`, 4
`*ItemsTable.tsx`, 4 `*FormHeader.tsx`.
**Replacement:** One generic editable cell, one searchable cell, one items
table component. Accept entity-specific config as props.
**Files to consolidate:**
- `client/src/components/invoice/InvoiceEditableCell.tsx`
- `client/src/components/purchase-order/PurchaseOrderEditableCell.tsx`
- `client/src/components/quotation/QuotationEditableCell.tsx`
- `client/src/components/sales-order/SalesOrderEditableCell.tsx`
- Same pattern for `*SearchableCell`, `*ItemsTable`, `*FormHeader`
**Lines saved:** ~500-600

### 2.4 Three invoice templates

**Tag:** `delete`
**What:** `InvoiceTemplate.tsx` + `InvoiceTemplateA4.tsx` +
`ThermalInvoiceTemplate.tsx` — three different components for rendering an
invoice.
**Replacement:** Pick one (A4 is standard). Delete the other two.
**Files:**
- `client/src/components/invoice/InvoiceTemplate.tsx`
- `client/src/components/invoice/InvoiceTemplateA4.tsx`
- `client/src/components/invoice/ThermalInvoiceTemplate.tsx`
**Lines saved:** ~200+

### 2.5 queryUtils.ts duplicates sqlSanitizer.ts

**Tag:** `delete`
**What:** Both deal with building safe SQL query strings/filters.
`queryUtils.ts` builds WHERE clauses, `sqlSanitizer.ts` validates sort
parameters. They overlap.
**Replacement:** Merge into one file. Or delete `queryUtils.ts` if its
logic is already covered inline.
**Files:**
- `server/src/utils/queryUtils.ts`
- `server/src/utils/sqlSanitizer.ts`
**Lines saved:** ~130

### 2.6 express-validator AND zod

**Tag:** `yagni`
**What:** Both `express-validator` and `zod` are listed in
`server/package.json` as dependencies. The app uses zōd elsewhere (client has
it too). express-validator adds a second validation DSL.
**Replacement:** Remove `express-validator` dependency. Use zōd for all
validation (it's already there).
**Dependency to remove from `server/package.json`:** `express-validator`
**Also clean up:** `server/src/middleware/validation.ts` if it uses
express-validator.

### 2.7 documentNumbering.ts overlaps sequence.ts

**Tag:** `delete`
**What:** `server/src/utils/documentNumbering.ts` (20 lines) generates
document number prefixes. `server/src/utils/sequence.ts` (48 lines) manages
auto-incrementing sequences. The first is a thin wrapper around the second.
**Replacement:** Fold `documentNumbering.ts` logic into `sequence.ts`.
**Files:**
- Delete: `server/src/utils/documentNumbering.ts`
- Update: `server/src/utils/sequence.ts`
**Lines saved:** ~20

### 2.8 Translation hook + LanguageToggle

**Tag:** `yagni`
**What:** `client/src/hooks/useTranslation.ts` and
`client/src/components/common/LanguageToggle.tsx` for i18n. The app only
has English — no translations exist.
**Replacement:** Delete both. Hard-code English strings.
**Files:**
- `client/src/hooks/useTranslation.ts`
- `client/src/components/common/LanguageToggle.tsx`
**Lines saved:** ~60

### 2.9 registerAgGrid.ts duplicates agGridIntegration.ts

**Tag:** `delete`
**What:** Both `registerAgGrid.ts` and `agGridIntegration.ts` register
AG-Grid modules.
**Replacement:** Pick one. Delete the other.
**Files:**
- `client/src/utils/registerAgGrid.ts`
- `client/src/utils/agGridIntegration.ts`
**Lines saved:** ~30

---

## Tier 3 — Smaller polish

### 3.1 26 model files, all hand-writing SQL

**Tag:** `shrink`
**What:** Every model file (Invoice.ts, Item.ts, Customer.ts, etc.) manually
writes `SELECT * FROM table WHERE ...` strings. ~10,176 total lines for
26 entities. The get/create/update/delete pattern is identical every time.
**Replacement:** One generic `BaseModel` class that takes table name, columns,
and ID field. Only override for non-standard queries.
**Lines saved:** ~7,000

### 3.2 Activity log over-engineering

**Tag:** `shrink`
**What:** Activity logging has 5 layers: `ActivityLogger` service (queue +
batch + interval flush), `activityLogController.ts`,
`activityLogRoutes.ts`, `ActivityLogContext.tsx`, plus the middleware
`activityLogger.ts`.
**Replacement:** A single `INSERT INTO activity_log` call at the point of
use. No queue, no batch, no interval flush. The setInterval queue pattern is
especially inappropriate for SQLite (single-writer, so batching doesn't help
concurrency).
**Files to simplify:**
- `server/src/services/activityLogger.ts` — remove queue, flush sync
- `server/src/middleware/activityLogger.ts`
- `server/src/controllers/activityLogController.ts`
- `server/src/routes/activityLog.ts`
- `client/src/context/ActivityLogContext.tsx`
**Lines saved:** ~500+

### 3.3 webmcp.ts — 600-line standalone MCP server

**Tag:** `delete` / investigation needed
**What:** `client/src/utils/webmcp.ts` defines its own MCP tool types,
encodes the entire API surface as tool handler functions, and wraps the
existing REST API. Either it's the primary API and REST is dead code, or
it's duplicating work.
**Replacement:** If MCP is needed, have the tools call the existing REST API
(client/src/utils/api.ts) instead of duplicating every endpoint. If MCP is
not needed, delete the file entirely.
**File:** `client/src/utils/webmcp.ts`
**Lines saved:** ~600 or zero (if MCP replaces REST)

### 3.4 node-cron dependency

**Tag:** `yagni`
**What:** `node-cron` in `server/package.json` for scheduled tasks in a
desktop app that runs on-demand.
**Replacement:** Remove `node-cron` from dependencies. Trigger maintenance
tasks (like forecast cache refresh) on app startup or on demand.
**Dependency to remove from `server/package.json`:** `node-cron`

### 3.5 Full RBAC for a desktop app

**Tag:** `yagni`
**What:** `requirePermission` middleware on every route with granular
create/read/update/delete per entity type. 24+ entities × 4 permissions each.
For a desktop app with likely 1-5 users.
**Replacement:** Simplify to 2-3 roles (Admin, User, ReadOnly). Reduce
permission checks to route-group level where possible.
**Files:**
- `server/src/middleware/requirePermission.ts`
- `server/src/models/Role.ts`
- `server/src/controllers/rolesController.ts`
- `server/src/routes/roles.ts`
**Lines saved:** ~200+

### 3.6 Two chart libraries (Chart.js + Recharts)

**Tag:** `yagni`
**What:** Both `chart.js`/`react-chartjs-2` and `recharts` are in
`client/package.json`. Some pages use one, some the other.
**Replacement:** Pick one. Recharts is more React-native (JSX-based).
Remove the other dependency.
**Dependency to remove from `client/package.json`:**
Either `chart.js` + `react-chartjs-2` or `recharts`

### 3.7 ledgerExport.ts

**Tag:** `delete`
**What:** `client/src/utils/ledgerExport.ts` is a small wrapper around
generating an HTML table for export. Likely used once.
**Replacement:** Inline the 3 lines at the call site. Delete the file.
**File:** `client/src/utils/ledgerExport.ts`
**Lines saved:** ~50

---

## Summary

| Tier | Lines removable | Dependencies droppable |
|------|----------------|----------------------|
| 1    | ~4,000-5,000   | @sendgrid/mail, twilio |
| 2    | ~1,500-2,000   | express-validator     |
| 3    | ~8,000+        | node-cron, chart.js or recharts |
| **Total** | **~30,000-40,000** | **~5-7 dependencies** |

### Implementation order

1. **Tier 1 first** — biggest impact, safest (mostly deletion)
2. `npm uninstall` removed deps after each tier
3. **Tier 2** — medium effort, requires slight refactoring
4. **Tier 3** — optional, low priority

### Per-tier commit strategy

```
commit 1: "delete duplicate type files, consolidate to single types/"
commit 2: "replace per-entity route files with CRUD route factory"
commit 3: "delete SalesService delegation layer"
commit 4: "remove unused integration services and dependencies"
commit 5: "simplify apiResponse.ts to minimal helpers"
...
```

Each commit should compile and pass `npm run typecheck` before the next
(per AGENTS.md SELF_AUDIT rule).
