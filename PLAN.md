# Plan: Complete Invoice Return Feature

## Context

The invoice return feature exists but has several gaps compared to the purchase return feature (which has per-item tracking, return history, and proper validation). This plan addresses all missing pieces.

## Issues Found

| # | Issue | Severity |
|---|-------|----------|
| 1 | No `returned_qty` column on `invoice_items` — can't track per-item returns, allowing over-returning | 🟡 Medium |
| 2 | Frontend doesn't validate remaining quantity — max is always original qty, not `original - returned` | 🟡 Medium |
| 3 | `returned_amount` not shown in `InvoiceTemplate` (print/PDF) | 🔵 Low |
| 4 | `returned_amount` not shown in `InvoiceViewPage` | 🔵 Low |
| 5 | No invoice return history page (unlike `PurchaseReturnHistory.tsx`) | 🔵 Low |
| 6 | Weak Zod schema — `invoiceReturnItemSchema` only checks `>= 0`, not `> 0` for actual returns | 🟢 Trivial |
| 7 | Return button is visible for cancelled invoices (backend blocks it, but UX is confusing) | 🟢 Trivial |

## Approach

Add a `returned_qty` column to `invoice_items` for proper per-item tracking, wire it through the backend controller/validation, reflect it in the frontend return modal, display `returned_amount` on the invoice template and detail view, and add a dedicated return history page.

## Files to Modify

### Backend
- `server/src/config/database.ts` — idempotent migration for `returned_qty`
- `server/src/models/Invoice.ts` — add `returned_qty` to interfaces + queries
- `server/src/controllers/invoiceController.ts` — per-item validation + update `returned_qty`; add `getInvoiceReturnHistory` controller
- `server/src/routes/invoices.ts` — add `GET /returns` history route

### Frontend
- `client/src/schemas/index.ts` — tighten `invoiceReturnItemSchema`
- `client/src/pages/sales/InvoiceReturn.tsx` — show remaining qty, cap max, show error
- `client/src/pages/sales/InvoiceReturn.css` — styles for remaining-qty display
- `client/src/pages/sales/InvoiceReturnHistory.tsx` — **new file**, return history page
- `client/src/components/invoice/InvoiceTemplate.tsx` — add `returned_amount` to interface + summary
- `client/src/pages/sales/InvoiceViewPage.jsx` — show `returned_amount` in toolbar/header area
- `client/src/pages/sales/SalesPage.jsx` — add navigation link to return history
- Routes config file (if centralized) — add `/sales/returns` route

## Reuse

- **Purchase return tracking pattern**: `server/src/migrations/add-purchase-return-fields.sql` adds `returned_quantity` to `purchase_order_items` and `purchases` — same pattern for `invoice_items`
- **Purchase return history**: `PurchaseReturnHistory.tsx` and `Purchase.getReturnHistory()` in `server/src/models/Purchase.ts:321` — replicate for invoices
- **Existing Invoice model methods**: `InvoiceModel.getItems()` already queries `invoice_items` — just add `returned_qty` to the SELECT

## Steps

### Step 1: Database migration — add `returned_qty` to `invoice_items`

**File:** `server/src/config/database.ts` (near line 1050, alongside existing `returned_amount` migration)

Add idempotent column creation:

```typescript
// Add returned_qty column to invoice_items (per-item return tracking)
try {
  const hasReturnedQty = db.prepare(
    `SELECT COUNT(*) as count FROM pragma_table_info('invoice_items') WHERE name='returned_qty'`
  ).get() as { count: number };
  if (hasReturnedQty.count === 0) {
    db.exec("ALTER TABLE invoice_items ADD COLUMN returned_qty DECIMAL(15,3) NOT NULL DEFAULT 0");
    logger.info('✅ returned_qty column added to invoice_items');
  }
} catch (error: any) {
  logger.error('returned_qty migration error:', error.message);
}
```

### Step 2: Backend — update Invoice model queries

**File:** `server/src/models/Invoice.ts`

| Location | Change |
|---|---|
| `InvoiceItem` interface (~line 24) | Add `returned_qty: number;` |
| `InvoiceModel.getItems()` (lines 902-908) | Add `ii.returned_qty` to SELECT |
| `InvoiceModel.getById()` items subquery (~line 101) | Add `ii.returned_qty` |
| `InvoiceModel.getAll()` items subquery (~line 152) | Add `ii.returned_qty` |
| `InvoiceModel.getByQuotationId()` items subquery (~line 811) | Add `ii.returned_qty` |
| `InvoiceModel.getByStatus()` items subquery (~line 878) | Add `ii.returned_qty` |
| `InvoiceModel.getItemsForStockReverse()` (line 920-921) | Add `returned_qty` to SELECT |

### Step 3: Backend — per-item validation + tracking in return controller

**File:** `server/src/controllers/invoiceController.ts` — `returnInvoiceItems()` function (line 830-920)

In the loop processing each return item:

1. The `invoice.items` now includes `returned_qty` from the model query
2. Replace validation:
   ```typescript
   // OLD:
   if (returnItem.return_quantity > invoiceItem.quantity) { ... }

   // NEW:
   const availableQty = invoiceItem.quantity - (invoiceItem.returned_qty || 0);
   if (returnItem.return_quantity > availableQty) {
     throw new Error(
       `Return quantity (${returnItem.return_quantity}) exceeds available quantity (${availableQty}) for item ${invoiceItem.item_name}`
     );
   }
   ```
3. After `processedItems.push(...)`, add SQL to update `returned_qty`:
   ```typescript
   db.prepare(`UPDATE invoice_items SET returned_qty = returned_qty + ? WHERE id = ?`)
     .run(returnItem.return_quantity, returnItem.invoice_item_id);
   ```

### Step 4: Backend — add return history model method

**File:** `server/src/models/Invoice.ts` — add new static method (model after `Purchase.getReturnHistory()` at `server/src/models/Purchase.ts:321`):

```typescript
static getReturnHistory(
  filters: { start_date?: string; end_date?: string; item_id?: number; limit?: number } = {},
  db: Database.Database
): any[] {
  let query = `
    SELECT
      sm.id, sm.movement_no, sm.item_id, sm.warehouse_id,
      sm.quantity, sm.unit_cost,
      sm.reference_doctype, sm.reference_docno as invoice_no,
      sm.remarks, sm.movement_date as return_date,
      sm.created_at, sm.created_by,
      i.item_code, i.item_name, i.unit_of_measure,
      w.warehouse_code, w.warehouse_name,
      u.username as created_by_username,
      inv.customer_name, inv.customer_id
    FROM stock_movements sm
    JOIN items i ON sm.item_id = i.id
    JOIN warehouses w ON sm.warehouse_id = w.id
    LEFT JOIN users u ON sm.created_by = u.id
    LEFT JOIN invoices inv ON sm.reference_docno = inv.invoice_no
    WHERE sm.reference_doctype = 'RETURN'
      AND sm.quantity > 0
  `;
  // Apply filters, ORDER BY, LIMIT — same pattern as Purchase model
}
```

### Step 5: Backend — add controller + route for return history

**File:** `server/src/controllers/invoiceController.ts`

- Add `getInvoiceReturnHistory()` controller (model after `purchaseController.getReturnHistory()` at `controllers/purchaseController.ts:126`)
- Export it

**File:** `server/src/routes/invoices.ts`

- Add `GET /returns` route **BEFORE** the `GET /:id` route (line 7):
  ```typescript
  router.get('/returns', invoiceController.getInvoiceReturnHistory);
  ```

> [!WARNING]
> Route ordering matters! `GET /returns` must come before `GET /:id` or Express will interpret "returns" as an invoice ID.

### Step 6: Frontend — tighten Zod validation

**File:** `client/src/schemas/index.ts` (line ~103)

```typescript
export const invoiceReturnItemSchema = z.object({
  return_quantity: z.coerce.number()
    .positive('Return quantity must be greater than 0'),
});
```

### Step 7: Frontend — update InvoiceReturn component for per-item tracking

**File:** `client/src/pages/sales/InvoiceReturn.tsx`

| Location | Change |
|---|---|
| `InvoiceItem` interface (line ~12) | Add `returned_qty?: number;` |
| `InvoiceReturnItem` interface (line ~28) | Add `returned_qty: number;` |
| `useEffect` mapping (lines 65-76) | Pass through `item.returned_qty ?? 0` |
| `handleQuantityChange()` (line 81) | Validate against `origQty - returnedQty` instead of just `origQty` |
| Each item row in JSX (~line 160) | Show "Already returned: X | Available: Y" subtitle |
| Error message (line ~88) | Mention remaining quantity in the error |

**File:** `client/src/pages/sales/InvoiceReturn.css`

- Add styles for the per-item returned/available stats indicator

### Step 8: Frontend — show returned_amount in InvoiceTemplate

**File:** `client/src/components/invoice/InvoiceTemplate.tsx`

1. Add `returned_amount?: number | null;` to the `Invoice` interface (line ~32)
2. In the summary section (line ~270), after the Paid line (when `returned_amount > 0`):
   ```tsx
   {safeParseFloat(invoice.returned_amount) > 0 && (
     <div className="summary-row returned">
       <span>Returned</span>
       <span>-{formatCurrency(safeParseFloat(invoice.returned_amount))}</span>
     </div>
   )}
   ```
3. Add `.summary-row.returned { color: #dc2626; }` in `InvoiceTemplate.css`

### Step 9: Frontend — show returned_amount in InvoiceViewPage

**File:** `client/src/pages/sales/InvoiceViewPage.jsx` (toolbar area, line ~190)

Add when `returned_amount > 0`:
```tsx
<span className="returned-amount-badge">
  <RotateCcw size={14} />
  Returned: {formatCurrency(parseFloat(invoice.returned_amount))}
</span>
```

### Step 10: Frontend — create InvoiceReturnHistory page

**New file:** `client/src/pages/sales/InvoiceReturnHistory.tsx`

Model after `client/src/pages/purchases/PurchaseReturnHistory.tsx`:

- API: `GET /api/invoices/returns` with `start_date`, `end_date`, `item_id` params
- AG Grid columns: Return Date, Invoice #, Customer, Item, Qty, Unit Price, Total Value, Reason, Created By
- Filters: date range, item searchable select, clear button
- Stats badge showing total return count

### Step 11: Frontend — add route + navigation link

**File:** `client/src/App.tsx`

- Add lazy import (near line 47):
  ```typescript
  const InvoiceReturnHistory = lazy(() => import('./pages/sales/InvoiceReturnHistory'));
  ```
- Add route (near line 232):
  ```tsx
  <Route path="/sales/returns" element={<InvoiceReturnHistory />} />
  ```

**File:** `client/src/pages/sales/SalesPage.jsx`

- Add a "Returns" quick-action button in the `quick-actions` div (around line 315), navigating to `/sales/returns`

### Step 12: Hide Return button for cancelled invoices

| File | Location | Change |
|---|---|---|
| `SalesPage.jsx` | Cell renderer (~line 253) | Wrap return button in `{params.data?.status !== 'Cancelled' && (...)}` |
| `InvoiceViewPage.jsx` | Toolbar (~line 201) | Wrap Return button in `{invoice?.status !== 'Cancelled' && (...)}` |
| `InvoicePreview.tsx` | line ~280 | Change `{onReturn && (` to `{onReturn && invoice.status !== 'Cancelled' && (` |

## Verification

1. **Per-item tracking**: Open an invoice, return 3 of 10 units. Close modal, reopen — max should show 7 (not 10). Try to return another 8 — should show validation error.
2. **History endpoint**: `GET /api/invoices/returns` returns stock movements for invoice returns.
3. **Return history page**: Navigate to `/sales/returns`, see all invoice returns with filters.
4. **InvoiceTemplate**: Print/PDF an invoice that has returns — "Returned" line appears in summary.
5. **Zod validation**: Try to submit return with 0 qty — validation catches it.
6. **Cancelled invoices**: Return button is hidden or disabled.
7. **Edge case**: Return all items from an invoice — invoice status updates correctly via existing `calculateInvoiceBalance` + `updateInvoiceStatus`.
