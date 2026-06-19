# JSX → TypeScript Refactoring Guide

## The Problem

The codebase has **52 JSX files** >= 80 lines (and growing) that mix data fetching, business logic, presentation, and export utilities in a single file. None have been converted to `.tsx`.

The `CustomerDetailPage.jsx` (1,525 lines) was refactored as the pilot — see `/home/fawad/ai/minierp/client/src/pages/customers/CustomerDetailPage.tsx` and the 14 supporting files.

---

## What We Did for CustomerDetailPage

### The "Before"
- One 1,525-line JSX file containing:
  - Inline API calls via `useQuery`/`useMutation` duplicating `queryClient.invalidateQueries()` everywhere
  - Inline currency formatting scattered in 6+ places
  - Inline business rules (canDeleteInvoice, credit checks) mixed with markup
  - Inline export functions (CSV, PDF, Image, Print)
  - Inline AG Grid column definitions recreated every render
  - 8+ scattered `window.location.href` navigations
  - No types at all (plain JSX)
  - Inline `.style` props

### The "After" — 15 typed files, 2,605 lines

```
src/
├── utils/
│   ├── customerTypes.ts           # All interfaces (Customer, Invoice, Payment, LedgerEntry, etc.)
│   ├── customerCalculations.ts    # Pure business logic (balance, metrics, credit) — zero React imports
│   ├── invoiceRules.ts            # Business rules (canDeleteInvoice, canCancelInvoice, etc.)
│   ├── ledgerExport.ts            # CSV/PDF/Image/Print export functions
│   └── statusCellUtils.ts         # AG Grid cell coloring
├── hooks/
│   ├── useCustomerData.ts         # All queries + cache invalidation helper
│   └── useCustomerMutations.ts    # All mutations (delete/cancel invoice, update/delete payment)
├── components/customer/
│   ├── CustomerHeader.tsx         # Back nav, customer info, stats bar
│   ├── OverviewTab.tsx            # SummaryGrid, invoice breakdown, collapsible sections
│   ├── InvoicesTab.tsx            # AG Grid (desktop) + mobile view
│   ├── LedgerTab.tsx              # AG Grid + export toolbar + totals
│   ├── PaymentsTab.tsx            # AG Grid (desktop) + mobile view
│   ├── EditPaymentForm.tsx        # Payment edit form
│   └── CustomerModals.tsx         # All modals (record/edit payment, delete confirmations)
└── pages/customers/
    └── CustomerDetailPage.tsx     # Orchestrator (332 lines) — hooks → component props
```

### Key Architectural Decisions

1. **Types → app/utils/<domain>Types.ts** — Keep domain types separate from shared `types.ts` to avoid polluting global types with page-specific interfaces.

2. **Utilities → app/utils/ with zero React imports** — Business logic (`customerCalculations.ts`, `invoiceRules.ts`) have no React/JSX imports, making them testable via `node --test` without JSDOM.

3. **Hooks → app/hooks/use<Domain>Data.ts + use<Domain>Mutations.ts** — Wrap all `useQuery` calls in a single data hook, all `useMutation` calls in a mutations hook. The page component consumes only hook results, never calling `useQuery`/`useMutation` directly.

4. **Export functions → app/utils/<domain>Export.ts** — Move all inline CSV/PDF/Image/Print logic from page components into typed utility functions that take data as input and return void (side-effect export).

5. **Components → app/components/<domain>/<Component>.tsx** — Each is a presentational wrapper with typed props. No API calls, no business logic, no export logic. Just receive props and render.

6. **Page orchestrator → app/pages/<domain>/<Page>.tsx** — The page is the glue. It imports hooks (data), instantiates mutations, calls utility functions for metrics/rules, and passes everything as props to components.

---

## The Refactoring Process (Step by Step)

### Phase 1: Read and Understand
```
1. Read the full JSX file (all chunks).
2. Read dependencies: types.ts, api.ts, context files, existing components, CSS.
3. Map out:
   - All API endpoints called
   - All business rules (conditions, calculations)
   - All export functions
   - All duplicated code patterns (invalidateQueries, formatting, etc.)
   - All inline styles
   - All states: loading, error, empty, data
```

### Phase 2: Create Types
```
1. Create utils/<domain>Types.ts
2. Define: Customer, Invoice, Payment, LedgerEntry, DomainMetrics, TabProps, ColDefs
3. Create enums for status values (InvoiceStatus, etc.)
4. Never use 'any'. Never suppress types unless cross-component unavoidable.
```

### Phase 3: Create Utilities
```
1. utils/<domain>Calculations.ts — pure functions only (no React imports)
   - calculateBalance, calculateMetrics, formatCurrency, etc.
2. utils/<domain>Rules.ts — business rule functions
   - canDeleteX(), canCancelX(), etc.
3. utils/<domain>Export.ts — export functions
   - exportToCSV, exportToPDF, exportToImage, handlePrint
4. Keep each function focused and testable.
```

### Phase 4: Create Hooks
```
1. hooks/use<Domain>Data.ts
   - Query key factory: domainKeys.single(id), domainKeys.list(filter)
   - All useQuery calls: useDomainData, useDomainList
   - Cache invalidation helper: invalidateDomainQueries(queryClient, id)
2. hooks/use<Domain>Mutations.ts
   - All useMutation calls (CRUD operations)
   - Mutations take id parameter and use queryClient + toast internally
```

### Phase 5: Create Components
```
1. Identify every visual section in the original page.
2. Extract each into a component: <Section>.tsx
3. Each component:
   - Has typed props (React.memo)
   - No inline styles (CSS classes)
   - No API calls
   - No business logic
   - No export logic
   - Returns Promise<void> for callbacks
4. For modals: create a single <DomainModals>.tsx that groups all modals
```

### Phase 6: Create Page
```
1. The page is the orchestrator.
2. Import hooks and call them at the top.
3. Compute metrics from utility functions.
4. Create useCallback handlers that call mutations or navigate.
5. Render loading/error/data state handlers.
6. Pass everything as props to components.
7. Use lazy() for non-critical tabs.
```

### Phase 7: Delete Old File
```
1. Verify the new .tsx route is registered in App.tsx (lazy import path works).
2. Move old .jsx to .jsx.bak.
3. Run typecheck + lint + build.
4. Browser test loading/error/data states.
5. Fix any issues.
```

---

## Files Remaining for Refactoring

### HIGH PRIORITY (1000+ lines — biggest impact)

| Lines | File | Notes |
|-------|------|-------|
| 2,163 | `pages/sales/SalesInvoicePage.jsx` | Largest file in codebase |
| 1,535 | `pages/sales-orders/SalesOrderFormPage.jsx` | Form + grid + calculations |
| 1,502 | `pages/quotations/QuotationFormPage.jsx` | Similar to SalesOrderForm |
| 1,386 | `pages/purchase-orders/PurchaseOrderFormPage.jsx` | Purchase order form |
| 1,104 | `pages/production/ProductionPage.jsx` | Production + BOM logic |

### MEDIUM PRIORITY (500–999 lines)

| Lines | File |
|-------|------|
| 875 | `pages/IntegrationsPage.jsx` |
| 854 | `pages/reports/ARReportsPage.jsx` |
| 839 | `pages/inventory/StockMovementPage.jsx` |
| 800 | `pages/purchase-orders/PurchaseOrderDetailPage.jsx` |
| 780 | `pages/expenses/ExpensesPage.jsx` |
| 763 | `pages/bom/BOMPage.jsx` |
| 739 | `pages/inventory/ItemsPage.jsx` |
| 631 | `pages/purchases/PurchasesPage.jsx` |
| 602 | `pages/pos/POSPage.jsx` |
| 598 | `pages/customers/CustomersPage.jsx` |
| 558 | `pages/reports/InventoryMovementReport.jsx` |
| 537 | `pages/users/UsersPage.jsx` |
| 526 | `pages/reports/StockLevelReport.jsx` |
| 514 | `pages/reports/StockValuationReport.jsx` |
| 506 | `pages/reports/PurchaseSummaryReport.jsx` |

### LOWER PRIORITY (200–499 lines, 30 files)

Includes: `SalesPage.jsx`, `Dashboard.jsx`, `SupplierDetailPage.jsx`, `SettingsPage.jsx`, `InvoiceViewPage.jsx`, multiple report pages, and shared components (`POLineItems.jsx`, `PurchaseOrderCard.jsx`, `SupplierCard.jsx`, etc.)

### LOWEST PRIORITY (80–199 lines, 2 files)
- `pages/quotations/QuotationViewPage.jsx` (163)
- `pages/purchase-orders/PurchaseOrdersPage.jsx` (128)

---

## Common Pitfalls to Avoid

- **Do NOT** modify shared `types.ts` — create domain-specific types in `utils/<domain>Types.ts`
- **Do NOT** import React in utility files — pure `.ts`, not `.tsx`
- **Do NOT** use `any` — prefer `unknown` + casting, or `as` for cross-component contravariance
- **Do NOT** keep inline styles — move to existing or new CSS files
- **Do NOT** change business behavior or API endpoints
- **DO** use `React.memo` on all presentational components
- **DO** use `useMemo`/`useCallback` for column defs, metrics, and action handlers
- **DO** use `invalidateQueries` helper from the data hook to avoid scattered calls
- **DO** keep the old `.jsx` as `.bak` until the new `.tsx` is verified in browser

---

## Verification Checklist

Before deleting the old `.jsx`:
- [ ] `npx tsc --noEmit` — zero new errors in our files
- [ ] `npx eslint src/utils/<domain>* src/hooks/<domain>* src/components/<domain>/* src/pages/<domain>/*` — zero errors
- [ ] `npx vite build` — succeeds
- [ ] Browser loads the page without console errors
- [ ] Loading state renders correctly
- [ ] Error state renders correctly
- [ ] Data state renders correctly
- [ ] All tabs/actions work
