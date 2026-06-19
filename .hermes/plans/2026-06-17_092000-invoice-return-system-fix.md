# Invoice Return System — Display & Backend Fix Plan

**Goal:** Make the return flow display correctly and intuitively in the UI, fix the backend status logic to surface return info, add guards against over-return, and clean up invoice 151 data.

**Architecture:** The ledger (`customer_ledger`) is the source of truth for financial amounts. The `invoices` table aggregates this data, and the `invoices.balance_amount` and `invoices.status` are computed fields. The frontend renders status as a badge and shows paid/returned amounts in the summary.

**Tech Stack:** Node.js/Express/TypeScript (backend), React/TypeScript/TanStack Query/AG-Grid (frontend), SQLite (better-sqlite3).

---
## Summary of Changes

| # | File | Change |
|---|------|--------|
| 1 | `server/src/types/index.ts` | Add `'Partially Returned'` to `InvoiceStatus` |
| 2 | `server/src/models/Invoice.ts` | Add `'Partially Returned'` to `status` type |
| 3 | `server/src/config/database.ts` | Startup SQL: add `Partially Returned` status, cap `returned_amount` |
| 4 | `server/src/utils/ledgerUtils.ts` | Fix `updateInvoiceStatus()` to handle partial returns |
| 5 | `server/src/controllers/invoiceController.ts` | Add over-return guard at invoice-level + fix status/db reorder |
| 6 | DB data: invoice 151 | total=3000, returned=1500 — match ledger |
| 7 | DB data: stock movement 78 | Remove the extra over-return stock movement |
| 8 | `client/src/components/invoice/InvoiceTemplate.tsx` | Remove `-` prefix from Paid/Returned lines |
| 9 | `client/src/pages/sales/SalesPage.jsx` | Fix status column renderer for Returned/Partially Returned |
| 10 | `client/src/components/common/CompactInvoiceCard.tsx` | Add Returned/Partially Returned status display + returned_amount in preview |
| 11 | `client/src/utils/statusCellUtils.js` | Add `'returned'` and `'partially returned'` status classes |
| 12 | Build + verify | Compile, restart server, check invoice 151 and 152 |

---

## Task 1: Add 'Partially Returned' to type definitions

### 1a: `server/src/types/index.ts:57-65`

Current:
```typescript
export type InvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Unpaid'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled'
  | 'Returned';
```

Change:
```typescript
export type InvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Unpaid'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled'
  | 'Returned'
  | 'Partially Returned';
```

### 1b: `server/src/models/Invoice.ts:16`

Current:
```
  status: 'Draft' | 'Sent' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled' | 'Returned';
```

Change — add `'Partially Returned'`:
```
  status: 'Draft' | 'Sent' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled' | 'Returned' | 'Partially Returned';
```

---

## Task 2: Fix startup migration — `server/src/config/database.ts`

### 2a: Add returned_amount capping (prevent over-returns)

Before the balance recalculation, add:
```sql
UPDATE invoices SET returned_amount = total_amount WHERE returned_amount > total_amount AND total_amount > 0;
```

Insert this at line ~198, right before the `balance_amount` UPDATE.

### 2b: Rewrite status SQL (lines 206-211)

Current (statuses can get overwritten, masked returns):
```sql
UPDATE invoices SET status = 'Paid' WHERE balance_amount <= 0 AND total_amount > 0 AND (returned_amount IS NULL OR returned_amount < total_amount);
UPDATE invoices SET status = 'Returned' WHERE returned_amount >= total_amount AND total_amount > 0;
UPDATE invoices SET status = 'Partially Paid' WHERE balance_amount > 0 AND balance_amount < total_amount AND paid_amount > 0;
UPDATE invoices SET status = 'Unpaid' WHERE (paid_amount = 0 OR paid_amount IS NULL) AND (returned_amount IS NULL OR returned_amount < total_amount);
```

Replace with:
```sql
UPDATE invoices SET status = 'Returned' WHERE returned_amount >= total_amount AND total_amount > 0;
UPDATE invoices SET status = 'Partially Returned' WHERE returned_amount > 0 AND returned_amount < total_amount AND total_amount > 0;
UPDATE invoices SET status = 'Paid' WHERE balance_amount <= 0 AND total_amount > 0 AND (returned_amount IS NULL OR returned_amount = 0);
UPDATE invoices SET status = 'Partially Paid' WHERE balance_amount > 0 AND balance_amount < total_amount AND paid_amount > 0 AND (returned_amount IS NULL OR returned_amount = 0);
UPDATE invoices SET status = 'Unpaid' WHERE (paid_amount = 0 OR paid_amount IS NULL) AND (returned_amount IS NULL OR returned_amount = 0) AND total_amount > 0;
```

Key changes:
- `'Returned'` and `'Partially Returned'` are set FIRST so they aren't overwritten
- `'Paid'` / `'Partially Paid'` / `'Unpaid'` now require `returned = 0` to match
- Order ensures returns take priority over payment status

---

## Task 3: Fix `updateInvoiceStatus` — `server/src/utils/ledgerUtils.ts`

Lines 83-120. Replace the status determination logic (lines 96-111):

Current:
```javascript
let newStatus = 'Unpaid';

if (currentStatus === 'Cancelled') {
  newStatus = 'Cancelled';
} else if (currentStatus === 'Returned') {
  newStatus = 'Returned';
} else if (returned >= total && total > 0) {
  newStatus = 'Returned';
} else if (balance <= 0 && total > 0) {
  newStatus = 'Paid';
} else if (balance < total && balance > 0) {
  newStatus = 'Partially Paid';
} else if (balance === total && total > 0) {
  newStatus = 'Unpaid';
}
```

New:
```javascript
let newStatus = 'Unpaid';

if (currentStatus === 'Cancelled') {
  newStatus = 'Cancelled';
} else if (returned >= total && total > 0) {
  // All items returned
  newStatus = 'Returned';
} else if (returned > 0 && total > 0) {
  // Some items returned, some remain
  newStatus = 'Partially Returned';
} else if (balance <= 0 && total > 0) {
  newStatus = 'Paid';
} else if (balance < total && balance > 0) {
  newStatus = 'Partially Paid';
} else if (balance >= total && total > 0) {
  newStatus = 'Unpaid';
}
```

Also ensure the Overdue check at line 113 is skipped for Returned/Partially Returned:
```javascript
if (newStatus !== 'Paid' && newStatus !== 'Returned' && newStatus !== 'Partially Returned'
    && invoice.due_date && new Date(invoice.due_date) < new Date()) {
  newStatus = 'Overdue';
}
```

---

## Task 4: Add invoice-level over-return guard — `server/src/controllers/invoiceController.ts`

At line ~990, before the `returned_amount` UPDATE:

Add a check:
```javascript
// Guard: prevent monetary over-return (defense in depth beyond item-level check)
const currentReturned = Number(invoice.returned_amount || 0);
const newReturnedTotal = currentReturned + returnAmount;
if (newReturnedTotal > Number(invoice.total_amount)) {
  throw new Error(
    `Cannot return more than the invoice total. ` +
    `Already returned: ${formatCurrency(currentReturned)}, ` +
    `this return: ${formatCurrency(returnAmount)}, ` +
    `invoice total: ${formatCurrency(invoice.total_amount)}.`
  );
}
```

Insert before line 990 (before `UPDATE invoices SET returned_amount = ...`).

---

## Task 5: Fix invoice 151 data (DB)

Using a script (`NODE_PATH=./server/node_modules node /tmp/...`):

```sql
-- Fix total_amount to match ledger (which has the correct 3000)
UPDATE invoices SET total_amount = 3000 WHERE id = 151 AND total_amount = 1500;

-- Fix returned_amount to match the one actual ledger return
UPDATE invoices SET returned_amount = 1500 WHERE id = 151;

-- Recalculate balance
UPDATE invoices SET balance_amount = MAX(0, total_amount - COALESCE(paid_amount,0) - COALESCE(returned_amount,0)) WHERE id = 151;

-- Remove the extra stock movements (IDs 77 and 78 are the extra returns)
DELETE FROM stock_movements WHERE id IN (77, 78);
```

This realigns invoice 151 with its ledger: total=3000 (items sum: 2×$1,500), paid=1500, returned=1500, balance=0, status=Returned.

---

## Task 6: Remove minus signs — `client/src/components/invoice/InvoiceTemplate.tsx`

Lines 394 and 399. Current:
```tsx
<span>-{formatCurrency(safeParseFloat(invoice.paid_amount || 0))}</span>
<span>-{formatCurrency(safeParseFloat(invoice.returned_amount))}</span>
```

Change to:
```tsx
<span>{formatCurrency(safeParseFloat(invoice.paid_amount || 0))}</span>
<span>{formatCurrency(safeParseFloat(invoice.returned_amount))}</span>
```

---

## Task 7: Fix grid status column — `client/src/pages/sales/SalesPage.jsx`

Update the status `cellRenderer` (line 254). Current logic appends " Returned" regardless of actual status:

```jsx
cellRenderer: (params) => {
  const hasReturn = parseFloat(params.data?.returned_amount || 0) > 0;
  return (
    <span>
      {params.value || 'Unknown'}
      {hasReturn && <span className="returned-indicator"> Returned</span>}
    </span>
  );
}
```

Replace with:
```jsx
cellRenderer: (params) => {
  const status = params.value || 'Unknown';
  const returnedAmt = parseFloat(params.data?.returned_amount || 0);
  // If status already includes "Returned", don't append redundant text
  if (status === 'Returned' || status === 'Partially Returned') {
    return <span>{status}</span>;
  }
  // For other statuses with returns, show indicator
  if (returnedAmt > 0) {
    return <span>{status} <span className="returned-indicator">(Returned)</span></span>;
  }
  return <span>{status}</span>;
}
```

Also add a "Returned" column to the grid (insert after "Paid" column, before "Balance"):

```jsx
{
  headerName: 'Returned',
  field: 'returned_amount',
  sortable: true,
  filter: 'agNumberColumnFilter',
  width: 100,
  valueFormatter: params => params.value ? formatCurrency(parseFloat(params.value)) : '$0.00',
  cellClass: params => parseFloat(params.value || 0) > 0 ? 'text-warning' : ''
},
```

---

## Task 8: Fix CompactInvoiceCard — `client/src/components/common/CompactInvoiceCard.tsx`

### 8a: Update getStatusClass (line 36-45)

Current:
```typescript
const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'paid': return 'stock-normal';
    case 'partial':
    case 'partially paid': return 'stock-low';
    case 'overdue': return 'stock-out-of-stock';
    case 'cancelled': return 'stock-out-of-stock';
    default: return 'stock-low';
  }
};
```

Add `'returned'` and `'partially returned'`:
```typescript
const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'paid': return 'stock-normal';
    case 'returned': return 'stock-normal';     // settled
    case 'partial':
    case 'partially paid':
    case 'partially returned': return 'stock-low';
    case 'overdue': return 'stock-out-of-stock';
    case 'cancelled': return 'stock-out-of-stock';
    default: return 'stock-low';
  }
};
```

### 8b: Add returned_amount in mobile detail preview (lines 153-173)

In the `.item-preview-stats` section, add a row after "Balance":

```tsx
{parseFloat(String((invoice as Record<string, unknown>).returned_amount || '0')) > 0 && (
  <div className="preview-stat">
    <span className="preview-stat-label">Returned</span>
    <span className="preview-stat-value stock-warning">
      {formatCurrency(parseFloat(String((invoice as Record<string, unknown>).returned_amount || '0')))}
    </span>
  </div>
)}
```

---

## Task 9: Add status classes — `client/src/utils/statusCellUtils.js`

In the `getStatusCellClass` function:
- Add `'returned'` to the success/active group (line 25)
- Add `'partially returned'` to the warning/partial group (line 31)

Change line 25:
```javascript
if (['paid', 'active', 'completed', 'accepted', 'converted', 'invoiced', 'returned'].includes(s)) {
```

Change line 30-33:
```javascript
if (
  ['partial', 'partially paid', 'partially-paid', 'partially_paid',
   'partially received', 'partially_received',
   'partially returned', 'partially-returned', 'partially_returned',
   'pending', 'approved', 'sent', 'confirmed', 'in progress'].includes(s)
) {
```

---

## Task 10: Build & verify

```bash
# Build server
cd /home/fawad/ai/minierp/server && npm run build

# Restart server
pkill -f "node dist/server.js" || true
cd /home/fawad/ai/minierp/server && node dist/server.js &

# Verify invoice 151 API
curl -s http://localhost:3010/api/invoices/151 -b /tmp/cookies.txt | python3 -m json.tool

Expected: total_amount=3000, returned_amount=1500, balance_amount=0, status="Returned"

# Verify invoice 152 API
curl -s http://localhost:3010/api/invoices/152 -b /tmp/cookies.txt | python3 -m json.tool

Expected: total_amount=2000, paid_amount=1000, returned_amount=1000, balance_amount=0

# Visual check in browser
- http://localhost:3010/sales/invoice/151/view → Subtotal=$3000, Total=$3000, Paid=$1500, Returned=$1500, Balance=$0, Status="Returned"
- http://localhost:3010/sales/invoice/152/view → Subtotal=$2000, Total=$2000, Paid=$1000, Returned=$1000, Balance=$0
- http://localhost:3010/sales → Grid shows clean status labels
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Deleting stock movements 77, 78 | Stock discrepancy if other records reference them | Delete only AFTER backup. Run SELECT first to verify IDs 77,78 are the extra returns for invoice 151 only |
| Status change for ALL invoices with returns | Existing "Paid" invoices with returns become "Partially Returned" | This is the DESIRED fix — the old behavior was masking returns |
| Over-return guard in controller | Could block legitimate returns if total_amount is wrong | The guard uses invoice's total_amount. Run the data cleanup first so totals are correct |

## Verification After Execution

1. API: `curl /api/invoices/151` — verify returned_amount=1500 (not 3000/4500), status=Returned
2. API: `curl /api/invoices` — check all 7 invoices with returns have correct status
3. Browser: invoice 151 view — no minus signs on Paid, no "Returned" double-label on status
4. Browser: sales grid — "Returned" badge shows cleanly, "Partially Returned" where applicable
5. Stock movements: `SELECT * FROM stock_movements WHERE reference_docno='INV-2026-896362'` — only ID 75 (-2), 76 (+1)
