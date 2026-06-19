# AG Grid Status/Conditional Cell Coloring — Unification Spec

**Created:** June 16, 2026
**Source:** Interview with user across 4 rounds of questions

---

## 1. Goal

Standardize how AG Grid status columns (and other conditionally colored cells) look across all pages in the MiniERP application. Currently, some pages use **badge/text-only styling** (via `cellRenderer`) while **ExpensesPage** uses **full-cell coloring** (via `cellClass`). All pages should be migrated to full-cell coloring for consistency.

## 2. Chosen Approach

**Full-cell coloring via AG Grid's `cellClass` callback** (not `cellStyle`), following the ExpensesPage pattern.

- `cellClass` applies a CSS class to the entire `<div class="ag-cell">` element
- The class sets `background-color` on the whole cell (subtle tint), plus `color` for text
- CSS classes are defined centrally in a shared file

## 3. Pages Affected

### 3.1 Core Pages (with status columns — 12 pages)

| # | Page | Status/Colored Columns | Current Approach |
|---|------|----------------------|-----------------|
| 1 | `pages/sales/SalesPage.jsx` | status (Paid/Unpaid/Partial/Overdue/Draft/Cancelled) + returned_amount | badge via cellRenderer |
| 2 | `pages/sales-orders/SalesOrdersPage.jsx` | status (Draft/Confirmed/Invoiced/Completed/Cancelled) | badge via cellRenderer |
| 3 | `pages/quotations/QuotationsPage.jsx` | status (Draft/Sent/Accepted/Rejected/Converted/Expired) | badge via cellRenderer |
| 4 | `pages/expenses/ExpensesPage.jsx` | status (Paid/Approved/Pending/Cancelled) | **Already full-cell** via cellClass |
| 5 | `pages/bom/BOMPage.jsx` | is_active (Active/Inactive) | badge via cellRenderer |
| 6 | `pages/roles/RolesPage.jsx` | is_active (Active/Inactive), is_system_role (System/Custom — "Type" column) | badge via cellRenderer |
| 7 | `pages/users/UsersPage.jsx` | is_active (Active/Inactive) | badge via cellRenderer |
| 8 | `pages/customers/CustomersPage.jsx` | is_active (Active/Inactive), credit_limit, current_balance, credit_utilization | badge / cellClass mix |
| 9 | `pages/inventory/ItemsPage.jsx` | current_stock (low stock coloring) | cellStyle (inline object) |
| 10 | `pages/customers/CustomerDetailPage.jsx` | **3 grids**: invoices (status + balance), ledger (transaction type), payments | cellRenderer + cellClass mix |
| 11 | `pages/inventory/StockByWarehousePage.tsx` | quantity (conditional color based on value) | cellStyle (inline object) |
| 12 | `pages/forecasts/DemandForecast.tsx` | stock (conditional), recommendation (badge), trend, confidence | cellStyle + cellRenderer |

### 3.2 Report Pages (with status/conditional columns — 5 pages)

| # | Page | Status/Colored Columns | Current Approach |
|---|------|----------------------|-----------------|
| 13 | `pages/reports/ExpensesReport.jsx` | status (Paid/Approved/Pending/Cancelled) | Already full-cell via cellClass |
| 14 | `pages/reports/SalesSummaryReport.jsx` | status (Paid/Partially Paid/Overdue/Unpaid) | Already full-cell via cellClass |
| 15 | `pages/reports/ProductionSummaryReport.jsx` | status (Completed/In Progress/Pending) | Already full-cell via cellClass |
| 16 | `pages/reports/PurchaseSummaryReport.jsx` | status (Completed/Partially Received/Pending) | Already full-cell via cellClass |
| 17 | `pages/reports/SupplierAnalysisReport.jsx` | on_time_delivery_rate (excellent/good/fair/poor) | Already full-cell via cellClass |
| 18 | `pages/reports/InventoryMovementReport.jsx` | movement_type (In/Out) | Already full-cell via cellClass |

### 3.3 Other Pages (with minor conditional styling — 2 pages)

| # | Page | Status/Colored Columns | Current Approach |
|---|------|----------------------|-----------------|
| 19 | `pages/sales/InvoiceReturnHistory.tsx` | Total Value column | cellStyle inline |
| 20 | `pages/purchases/PurchaseReturnHistory.tsx` | Reference Type (badge), Total Value | cellRenderer + cellStyle |

### 3.4 Pages WITHOUT status/conditional coloring (no changes needed — 13 pages)

- `pages/purchases/PurchasesPage.jsx`
- `pages/inventory/StockMovementPage.jsx`
- `pages/inventory/WarehousesPage.jsx`
- `pages/production/ProductionPage.jsx`
- `pages/payments/PaymentsPage.tsx`
- `pages/reports/StockLevelReport.jsx`
- `pages/reports/BOMUsageReport.jsx`
- `pages/reports/StockValuationReport.jsx`
- `pages/reports/SalesByItemReport.jsx`
- `pages/reports/SalesByCustomerReport.jsx`
- `pages/reports/ARReportsPage.jsx` (AR Aging + Top Debtors grids)
- `pages/reports/CustomerStatementsReport.jsx`
- `pages/reports/DemandForecast.tsx` (only the `cellStyle` + custom renderers — see section 3.1)

## 4. Status Value Mapping & Color Scheme

### 4.1 Unified Semantic Groups

All status values across pages are grouped by semantic meaning. Each group gets a shared color.

| Semantic Group | Status Values (across all pages) | CSS Variable (background) | CSS Variable (text) |
|---------------|--------------------------------|--------------------------|---------------------|
| **Success/Active/Paid** | Paid, Active, Completed, Accepted, Invoiced, Converted | `var(--success-bg)` | `var(--success)` |
| **Warning/Pending/Partial** | Partial, Partially Paid, Pending, Approved, Sent, Confirmed | `var(--warning-bg)` | `var(--warning)` |
| **Draft/Inactive/Default** | Draft, Inactive, Expired | `var(--neutral-100)` | `var(--text-tertiary)` |
| **Error/Cancelled/Rejected** | Cancelled, Rejected, Inactive (negative context) | `var(--error-bg)` | `var(--error)` |
| **Info/Custom** | Unpaid, Overdue, System (role type) | `var(--info-bg)` | `var(--info)` |

### 4.2 Detailed Per-Page Mapping

| Page | Status Value | CSS Class | Background | Text Color |
|------|-------------|-----------|-----------|------------|
| **SalesPage** | Paid | `cell-status-paid` | `var(--success-bg)` | `var(--success)` |
| | Unpaid | `cell-status-unpaid` | `var(--info-bg)` | `var(--info)` |
| | Partial/Partially Paid | `cell-status-partial` | `var(--warning-bg)` | `var(--warning)` |
| | Overdue | `cell-status-overdue` | `var(--error-bg)` | `var(--error)` |
| | Draft | `cell-status-draft` | `var(--neutral-100)` | `var(--text-tertiary)` |
| | Cancelled | `cell-status-cancelled` | `var(--error-bg)` | `var(--error)` |
| | Returned (secondary badge) | Keep inline badge, no cellClass | — | — |
| **SalesOrdersPage** | Draft | `cell-status-draft` | `var(--neutral-100)` | `var(--text-tertiary)` |
| | Confirmed | `cell-status-confirmed` | `var(--warning-bg)` | `var(--warning)` |
| | Invoiced | `cell-status-invoiced` | `var(--info-bg)` | `var(--info)` |
| | Completed | `cell-status-completed` | `var(--success-bg)` | `var(--success)` |
| | Cancelled | `cell-status-cancelled` | `var(--error-bg)` | `var(--error)` |
| **QuotationsPage** | Draft | `cell-status-draft` | `var(--neutral-100)` | `var(--text-tertiary)` |
| | Sent | `cell-status-sent` | `var(--warning-bg)` | `var(--warning)` |
| | Accepted | `cell-status-accepted` | `var(--success-bg)` | `var(--success)` |
| | Rejected | `cell-status-rejected` | `var(--error-bg)` | `var(--error)` |
| | Converted | `cell-status-converted` | `var(--info-bg)` | `var(--info)` |
| | Expired | `cell-status-expired` | `var(--neutral-100)` | `var(--text-tertiary)` |
| **ExpensesPage** | Paid | `cell-status-paid` | `var(--success-bg)` | `var(--success)` |
| | Approved | `cell-status-approved` | `var(--warning-bg)` | `var(--warning)` |
| | Pending | `cell-status-pending` | `var(--warning-bg)` | `var(--warning)` |
| | Cancelled | `cell-status-cancelled` | `var(--error-bg)` | `var(--error)` |
| **BOMPage** | Active | `cell-status-active` | `var(--success-bg)` | `var(--success)` |
| | Inactive | `cell-status-inactive` | `var(--neutral-100)` | `var(--text-tertiary)` |
| **RolesPage** | Active | `cell-status-active` | `var(--success-bg)` | `var(--success)` |
| | Inactive | `cell-status-inactive` | `var(--neutral-100)` | `var(--text-tertiary)` |
| | System (type) | `cell-type-system` | `var(--info-bg)` | `var(--info)` |
| | Custom (type) | `cell-type-custom` | `var(--neutral-100)` | `var(--text-tertiary)` |
| **UsersPage** | Active | `cell-status-active` | `var(--success-bg)` | `var(--success)` |
| | Inactive | `cell-status-inactive` | `var(--neutral-100)` | `var(--text-tertiary)` |
| **CustomersPage** | Active | `cell-status-active` | `var(--success-bg)` | `var(--success)` |
| | Inactive | `cell-status-inactive` | `var(--neutral-100)` | `var(--text-tertiary)` |
| **ItemsPage** | Low stock (stock ≤ reorder_level) | `cell-stock-low` | `var(--warning-bg)` | `var(--warning)` |
| | Out of stock (stock = 0) | `cell-stock-out` | `var(--error-bg)` | `var(--error)` |
| **CustomersPage** (conditional) | Credit utilization ≥ 90% | `cell-credit-high` | `var(--error-bg)` | `var(--error)` |
| | Credit utilization ≥ 75% | `cell-credit-warn` | `var(--warning-bg)` | `var(--warning)` |
| | Balance > 0 | `cell-balance-due` | `var(--warning-bg)` | `var(--warning)` |
| | Balance ≤ 0 | `cell-balance-clear` | `var(--success-bg)` | `var(--success)` |

## 5. CSS Architecture

### 5.1 Shared CSS File

Create: `client/src/styles/ag-grid-status-cells.css`

This file will contain all `cell-status-*`, `cell-type-*`, `cell-stock-*`, `cell-balance-*`, `cell-credit-*` classes.

```css
/* ============================================
   AG Grid Cell Status/Coloring Classes
   Shared across all AG Grid pages
   Light mode defaults via CSS variables
   ============================================ */

/* --- Cell base --- */
.ag-cell.cell-status-paid,
.ag-cell.cell-status-completed,
.ag-cell.cell-status-accepted,
.ag-cell.cell-status-active,
.ag-cell.cell-status-converted,
.ag-cell.cell-balance-clear {
  background-color: var(--success-bg, #dcfce7);
  color: var(--success, #15803d);
}

.ag-cell.cell-status-partial,
.ag-cell.cell-status-partially-paid,
.ag-cell.cell-status-pending,
.ag-cell.cell-status-approved,
.ag-cell.cell-status-sent,
.ag-cell.cell-status-confirmed,
.ag-cell.cell-stock-low,
.ag-cell.cell-credit-warn,
.ag-cell.cell-balance-due {
  background-color: var(--warning-bg, #fef3c7);
  color: var(--warning, #d97706);
}

.ag-cell.cell-status-draft,
.ag-cell.cell-status-expired,
.ag-cell.cell-status-inactive,
.ag-cell.cell-type-custom {
  background-color: var(--neutral-100, #f3f4f6);
  color: var(--text-tertiary, #6b7280);
}

.ag-cell.cell-status-cancelled,
.ag-cell.cell-status-rejected,
.ag-cell.cell-stock-out,
.ag-cell.cell-credit-high {
  background-color: var(--error-bg, #fee2e2);
  color: var(--error, #dc2626);
}

.ag-cell.cell-status-overdue,
.ag-cell.cell-status-unpaid,
.ag-cell.cell-status-invoiced,
.ag-cell.cell-type-system {
  background-color: var(--info-bg, #dbeafe);
  color: var(--info, #1d4ed8);
}
```

### 5.2 Dark Mode Overrides

Add to `client/src/assets/styles/dark-mode.css`:

```css
/* AG Grid cell status colors — dark mode */
html.dark .ag-cell.cell-status-paid,
html.dark .ag-cell.cell-status-completed,
html.dark .ag-cell.cell-status-accepted,
html.dark .ag-cell.cell-status-active,
html.dark .ag-cell.cell-status-converted,
html.dark .ag-cell.cell-balance-clear {
  background-color: rgba(16, 185, 129, 0.2) !important;
  color: #34D399 !important;
}

html.dark .ag-cell.cell-status-partial,
html.dark .ag-cell.cell-status-pending,
html.dark .ag-cell.cell-status-approved,
html.dark .ag-cell.cell-status-sent,
html.dark .ag-cell.cell-status-confirmed,
html.dark .ag-cell.cell-stock-low,
html.dark .ag-cell.cell-credit-warn,
html.dark .ag-cell.cell-balance-due {
  background-color: rgba(245, 158, 11, 0.2) !important;
  color: #FBBF24 !important;
}

html.dark .ag-cell.cell-status-draft,
html.dark .ag-cell.cell-status-expired,
html.dark .ag-cell.cell-status-inactive,
html.dark .ag-cell.cell-type-custom {
  background-color: rgba(107, 114, 128, 0.2) !important;
  color: #9CA3AF !important;
}

html.dark .ag-cell.cell-status-cancelled,
html.dark .ag-cell.cell-status-rejected,
html.dark .ag-cell.cell-stock-out,
html.dark .ag-cell.cell-credit-high {
  background-color: rgba(239, 68, 68, 0.2) !important;
  color: #FB7185 !important;
}

html.dark .ag-cell.cell-status-overdue,
html.dark .ag-cell.cell-status-unpaid,
html.dark .ag-cell.cell-status-invoiced,
html.dark .ag-cell.cell-type-system {
  background-color: rgba(59, 130, 246, 0.2) !important;
  color: #60A5FA !important;
}
```

## 6. Implementation Pattern

### 6.1 Status Column (cellClass approach — standard case)

For pages that currently use `cellRenderer` for their status column:

**Before:**
```jsx
{
  headerName: 'Status',
  field: 'status',
  cellRenderer: (params) => {
    const status = params.value?.toLowerCase();
    return <span className={`status-badge status-${status}`}>{params.value}</span>;
  }
}
```

**After:**
```jsx
{
  headerName: 'Status',
  field: 'status',
  cellClass: (params) => {
    const status = params.value?.toLowerCase();
    switch (status) {
      case 'paid': case 'completed': case 'accepted': case 'active': case 'converted':
        return 'cell-status-active';  // success group
      case 'partial': case 'partially-paid': case 'pending': case 'approved': case 'sent': case 'confirmed':
        return 'cell-status-partial';  // warning group
      case 'draft': case 'expired': case 'inactive':
        return 'cell-status-draft';    // neutral group
      case 'cancelled': case 'rejected':
        return 'cell-status-cancelled'; // error group
      case 'overdue': case 'unpaid': case 'invoiced':
        return 'cell-status-overdue';   // info group
      default:
        return 'cell-status-draft';
    }
  }
}
```

### 6.2 Boolean Status (is_active)

**Before:**
```jsx
{
  headerName: 'Status',
  field: 'is_active',
  cellRenderer: (params) => (
    <span className={`status-badge ${params.value ? 'active' : 'inactive'}`}>
      {params.value ? 'Active' : 'Inactive'}
    </span>
  )
}
```

**After:**
```jsx
{
  headerName: 'Status',
  field: 'is_active',
  cellRenderer: (params) => params.value ? 'Active' : 'Inactive',  // plain text
  cellClass: (params) => params.value ? 'cell-status-active' : 'cell-status-inactive'
}
```

### 6.3 Conditional (non-status) Columns

**ItemsPage — Stock column:**
```jsx
{
  headerName: 'Stock',
  field: 'current_stock',
  cellClass: (params) => {
    if (params.value <= 0) return 'cell-stock-out';
    if (params.data.reorder_level > 0 && params.value <= params.data.reorder_level) return 'cell-stock-low';
    return '';
  }
}
```

**CustomersPage — Credit Limit / Balance:**
```jsx
// Balance column:
{
  headerName: 'Current Balance',
  field: 'current_balance',
  cellClass: (params) => parseFloat(params.value || 0) > 0 ? 'cell-balance-due' : 'cell-balance-clear'
}

// Credit Utilization column:
{
  headerName: 'Credit Utilization',
  field: 'credit_utilization_percent',
  cellClass: (params) => {
    if (!params.data.credit_limit) return '';
    const util = params.value || 0;
    if (util >= 90) return 'cell-credit-high';
    if (util >= 75) return 'cell-credit-warn';
    return '';
  }
}
```

### 6.4 SalesPage — "Returned" Secondary Badge

The SalesPage has a special case where a "Returned" badge appears alongside the main status. Since the user chose to **keep separate** indicators for this case, the approach is:

```jsx
{
  headerName: 'Status',
  field: 'status',
  cellClass: (params) => {
    // Main cell color based on primary status
    const hasReturn = parseFloat(params.data?.returned_amount || 0) > 0;
    let cls = getCellStatusClass(params.value);  // from shared helper
    if (hasReturn) cls += ' cell-has-return';    // optional modifier
    return cls;
  },
  cellRenderer: (params) => {
    const hasReturn = parseFloat(params.data?.returned_amount || 0) > 0;
    return (
      <div className="status-cell">
        <span>{params.value || 'Unknown'}</span>
        {hasReturn && (
          <span className="returned-badge-inline">Returned</span>
        )}
      </div>
    );
  }
}
```

The `.returned-badge-inline` is just text-styled (no background), since the cell background provides the status color context.

### 6.5 ExpensesPage — Already Full-Cell, Just Update Classes

ExpensesPage already uses `cellClass`. Just rename the classes from `status-paid` → `cell-status-paid` etc., and ensure they match the shared CSS.

## 7. Helper Utility (optional but recommended)

To avoid repeating the switch-case mapping in every page, create a shared helper at `client/src/utils/statusCellUtils.js`:

```js
// Maps a status value to the CSS class for AG Grid cell coloring
export function getCellStatusClass(status) {
  const s = (status || '').toLowerCase().trim();
  // Success/Active group
  if (['paid', 'completed', 'accepted', 'active', 'converted', 'system'].includes(s)) return 'cell-status-active';
  // Warning/Pending group
  if (['partial', 'partially paid', 'partially-paid', 'pending', 'approved', 'sent', 'confirmed'].includes(s)) return 'cell-status-partial';
  // Draft/Inactive group
  if (['draft', 'expired', 'inactive', 'custom'].includes(s)) return 'cell-status-draft';
  // Error group
  if (['cancelled', 'rejected'].includes(s)) return 'cell-status-cancelled';
  // Info group
  if (['unpaid', 'overdue', 'invoiced'].includes(s)) return 'cell-status-overdue';
  return 'cell-status-draft';
}
```

## 8. CSS Cleanup After Migration

For each page that has its status column migrated to the shared classes, remove (or keep for backward compat):

- Page-specific `.status-badge`, `.status-*` CSS classes from the page CSS file that are now obsolete for AG Grid
- BUT keep any mobile card or non-grid status badge styles — those still need their own CSS

Pages needing CSS cleanup (remove now-unused AG Grid status badge styles):
- `SalesPage.css` — `.status-badge`, `.status-paid`, `.status-unpaid`, `.status-partial`, `.status-partially-paid`, `.status-overdue`, `.status-draft`, `.status-returned`, `.status-cell`, `.status-unknown`
- `SalesOrdersPage.css` — `.status-badge`, `.status-draft`, `.status-confirmed`, `.status-invoiced`, `.status-completed`, `.status-cancelled`
- `QuotationsPage.css` — `.status-badge`, `.status-draft`, `.status-sent`, `.status-accepted`, `.status-rejected`, `.status-converted`, `.status-expired`
- `Expenses.css` — `.status-paid`, `.status-partially-paid`, `.status-unpaid`, `.status-cancelled`
- `BOMPage.css` — `.status-badge`, `.status-badge.active`, `.status-badge.inactive`
- `RolesPage.css` — status badge styles
- `UsersPage.css` — status badge styles
- `CustomersPage.css` — status/cell class styles for grid

Keep only the styles used by mobile CompactCard components and non-grid contexts.

## 9. Status Value Standardization

Where possible, standardize display text for status values:

| Current Value(s) | Standardized To |
|-----------------|----------------|
| `is_active: 1 / true` | "Active" |
| `is_active: 0 / false` | "Inactive" |
| `is_system_role: 1 / true` | "System" |
| `is_system_role: 0 / false` | "Custom" |

This is primarily a display change via the `cellRenderer` or `valueFormatter`.

## 10. Implementation Order

1. **Create shared CSS file** `client/src/styles/ag-grid-status-cells.css`
2. **Add dark mode overrides** to `dark-mode.css`
3. **Create shared helper utility** `client/src/utils/statusCellUtils.js`
4. **Migrate each page** (one at a time, test as you go):
   - SalesPage.jsx
   - SalesOrdersPage.jsx
   - QuotationsPage.jsx
   - BOMPage.jsx
   - RolesPage.jsx
   - UsersPage.jsx
   - CustomersPage.jsx
   - ItemsPage.jsx (stock column)
   - ExpensesPage.jsx (just rename classes)
5. **Clean up page-specific CSS** — remove now-redundant status badge styles from each page
6. **Typecheck** — run `cd client && npx tsc --noEmit` (or the project's typecheck command)
7. **Verify** — start dev server and visually confirm each page

## 11. Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| Pages that share CSS class names (e.g., `.status-badge`) may conflict | Use unique scoped class names for shared cells (`.cell-status-*`) |
| Dark mode may not render correctly | Test each page in both light and dark mode after migration |
| Mobile cards use same CSS classes as grid | Only remove grid-specific status styles; keep mobile card styles |
| ExpensesPage already works differently | Rename its classes to match the new shared system |
| Some pages load CSS after AG Grid (priority issues) | Increase specificity with `.ag-cell.cell-status-*` selector |
