# Plan: Purchase Return Feature

## Context

The purchase return feature is partially implemented:
- **Server**: `Purchase.returnPurchaseItems()` + `purchaseController.returnPurchaseItems()` + `AccountingService.postPurchaseReturnEntry()` exist and work
- **Client**: `PurchaseReturn.tsx` modal component exists and is wired into `PurchasesPage.jsx`, `CompactPurchaseCard.tsx`, and `PurchasePreview.tsx`

However, the feature needs polishing to be production-ready and should also support returns from **Purchase Order** goods receipts.

## Approach

Follow the same pattern as **Sales Returns** (inline tracking, no separate return table):

1. Add `returned_quantity` column to `purchases` table (like `returned_amount` on invoices)
2. Add `returned_quantity` column to `purchase_order_items` (to track PO returns)
3. Add a new `purchaseOrderModel.returnReceiptItems()` method for PO-based returns
4. Refactor the client `PurchaseReturn.tsx` to have its own CSS (stop importing InvoiceReturn.css)
5. Add a **Return History** page/view that queries stock movements of type ADJUSTMENT with reference_doctype = 'PURCHASE_RETURN' / 'PO_RETURN'
6. Add translation keys in `en.json` and `ur.json`
7. Add Zod validation schema for purchase returns
8. Add a purchase return report in the reports module (reuse PurchaseSummaryReport patterns)
9. Integrate return button into Purchase Order detail page

### Design Decision: Separate Accumulator Pattern (Do Not Mutate Originals)

All return tracking uses **separate accumulator fields** added to existing tables — original values (`quantity`, `received_quantity`, `total_amount`) are **never modified**. Net values are computed on-the-fly:

| Context | Original Field | Accumulator | Net Calc |
|---|---|---|---|
| Purchases (direct) | `quantity` | `returned_quantity` | `quantity - returned_quantity` = returnable |
| PO Items | `received_quantity` | `returned_quantity` | `received_quantity - returned_quantity` = net received |
| Invoices (existing) | `total_amount` | `returned_amount` | `total - paid - returned` = balance |

**Why separate accumulators:**
- Preserves full audit trail (original receipt/delivery is never erased)
- Enables partial returns without losing history
- Matches the existing Invoice Return model (`returned_amount`)
- `received_quantity` on PO items stays as a true record of what was physically received

## Files to modify

### Database
- `server/src/migrations/add-purchases-table.sql` (reference — already run)
- New: `server/src/migrations/add-purchase-return-fields.sql`

### Server
| File | Change |
|------|--------|
| `server/src/config/database.ts` | Run new migration for `returned_quantity` columns |
| `server/src/models/Purchase.ts` | Update `returnPurchaseItems()` to track `returned_quantity`; add `getReturnHistory()` |
| `server/src/models/PurchaseOrder.ts` | Add `returnReceiptItems()` method |
| `server/src/controllers/purchaseController.ts` | Add `getReturnHistory` controller; update `returnPurchaseItems` to handle PO-linked returns |
| `server/src/controllers/purchaseOrderController.ts` | Add `returnReceiptItems` controller |
| `server/src/routes/purchases.ts` | Add `GET /purchases/returns` route |
| `server/src/routes/purchaseOrders.ts` | Add `POST /purchase-orders/:id/return-receipt` route |

### Client
| File | Change |
|------|--------|
| `client/src/pages/purchases/PurchaseReturn.tsx` | Refactor to support both direct purchases and PO returns |
| New: `client/src/pages/purchases/PurchaseReturn.css` | Extract from InvoiceReturn.css, customize for purchase |
| New: `client/src/pages/purchases/PurchaseReturnHistory.tsx` | New page showing all purchase returns |
| `client/src/pages/purchases/PurchasesPage.jsx` | Add "View Returns" quick-action button |
| `client/src/pages/purchase-orders/PurchaseOrderDetailPage.jsx` | Add return button + Return modal |
| `client/src/schemas/index.ts` | Add `purchaseReturnSchema` |
| `client/src/locales/en.json` | Add purchase return translations |
| `client/src/locales/ur.json` | Add purchase return translations |
| `client/src/App.tsx` | Add route for `/purchases/returns` |

## Reuse

| Existing Code | Path | How to reuse |
|--------------|------|-------------|
| `Invoice.returnInvoiceItems()` | `server/src/controllers/invoiceController.ts:776` | Pattern reference for multi-item return flow |
| `InvoiceReturn.tsx` | `client/src/pages/sales/InvoiceReturn.tsx` | UI pattern reference for multi-item return modal |
| `InvoiceReturn.css` | `client/src/pages/sales/InvoiceReturn.css` | Extract styles from here into `PurchaseReturn.css` |
| `AccountingService.postPurchaseReturnEntry()` | `server/src/services/accountingService.ts` | Already called — no changes needed |
| `StockMovementModel.recordMovement()` | `server/src/models/StockMovement.ts` | Already used by return logic |
| `CompactPurchaseCard.tsx` | `client/src/components/common/CompactPurchaseCard.tsx` | Already has `onReturn` prop — reuse as-is |
| `purchaseSchema` | `client/src/schemas/index.ts` | Pattern for purchaseReturnSchema |
| `invoiceReturnItemSchema` | `client/src/schemas/index.ts` | Direct pattern reference |

## Steps

### Step 1: Database migration
- [ ] Create `server/src/migrations/add-purchase-return-fields.sql`:
  - `ALTER TABLE purchases ADD COLUMN returned_quantity DECIMAL(15,3) NOT NULL DEFAULT 0`
  - `ALTER TABLE purchase_order_items ADD COLUMN returned_quantity DECIMAL(15,3) NOT NULL DEFAULT 0`
  - Index: `CREATE INDEX IF NOT EXISTS idx_purchases_returned ON purchases(returned_quantity)`
- [ ] Register the migration in `server/src/config/database.ts` (add a `runPurchaseReturnMigration()` call near `runPurchasesMigration`)

### Step 2: Update Purchase model
- [ ] In `Purchase.returnPurchaseItems()`:
  - Track `returned_quantity` on the purchase (add to the return transaction)
  - Validate that total returned quantity doesn't exceed original purchase quantity
  - Add a `getReturnHistory()` static method that queries stock_movements WHERE reference_doctype = 'PURCHASE_RETURN'

### Step 3: Add Purchase Order return support
- [ ] Add `PurchaseOrderModel.returnReceiptItems()` method:
  - Validates the PO/Receipt exists
  - **Increments** `returned_quantity` on `purchase_order_items` — does NOT reduce `received_quantity`
  - Validates that `return_quantity <= (received_quantity - returned_quantity)` i.e., cannot return more than net received
  - Creates ADJUSTMENT stock movement with reference_doctype = 'PO_RETURN'
  - Updates stock_balances and recalculates PO status via `updatePOStatus()`
  - Posts GL reversal via AccountingService.postPurchaseReturnEntry()
- [ ] Add controller `purchaseOrderController.returnReceiptItems()`

**PO Status Recalculation (update `calculateStatus()` or `updatePOStatus()`):**
```sql
-- Conceptually, replace:
--   received_quantity >= quantity  → 'Completed'
-- With:
--   (received_quantity - COALESCE(returned_quantity, 0)) >= quantity  → 'Completed'
--   (received_quantity - COALESCE(returned_quantity, 0)) > 0  → 'Partially Received'
--   ELSE  → 'Submitted'
```
This handles:
- **Partial return on a Completed PO**: status drops to "Partially Received"
- **Full return of all received qty**: status resets to "Submitted"
- **Partial return on an already partial PO**: net received decreases but stays partial

### Step 4: Server routes
- [ ] Add `GET /purchases/returns` → `purchaseController.getReturnHistory`
- [ ] Add `POST /purchase-orders/:id/return-receipt` → `purchaseOrderController.returnReceiptItems`

### Step 5: Client — PurchaseReturn component polish
- [ ] Create `PurchaseReturn.css` (extract relevant styles from `InvoiceReturn.css`, customize colors/icons)
- [ ] Update `PurchaseReturn.tsx` to import its own CSS instead of InvoiceReturn.css
- [ ] Add Zod schema `purchaseReturnSchema` to `client/src/schemas/index.ts`

### Step 6: Client — Return History page
- [ ] Create `PurchaseReturnHistory.tsx` page showing:
  - AG-Grid listing all return transactions from stock movements
  - Columns: Date, Return Type (Purchase/PO), Reference #, Item, Quantity, Value, Reason, Created By
  - Filterable by date range, item, type
- [ ] Add route `/purchases/returns` in `App.tsx`
- [ ] Add "View Returns" quick-action button in `PurchasesPage.jsx`

### Step 7: Client — PO Detail integration
- [ ] Add return mutation + modal to `PurchaseOrderDetailPage.jsx`
- [ ] Show a "Return" button on received items

### Step 8: Translations
- [ ] Add to `client/src/locales/en.json`:
  - `purchases.return`, `purchases.returnTitle`, `purchases.returnSubtitle`, `purchases.returnQuantity`, `purchases.returnReason`, `purchases.returnReasonPlaceholder`, `purchases.processReturn`, `purchases.returnProcessed`, `purchases.returnFailed`, `purchases.returnHistory`, `purchases.returnNoItems`, `purchases.returnValue`, `purchases.originalQty`, `purchases.returnQty`
  - `purchaseOrders.returnReceipt`, `purchaseOrders.returnReceiptTitle`
- [ ] Add Urdu equivalents to `ur.json` (or at least English fallback)

### Step 9: Purchase Return Report
- [ ] Add return metrics to existing `PurchaseSummaryReport` component or create a mini return summary section
- [ ] Alternatively add a `GET /reports/purchase-returns` endpoint

## Verification

1. **Direct Purchase Return**:
   - Go to `/purchases`
   - Click the return button on a purchase row
   - Enter quantity and reason → Process Return
   - Verify: stock movement created (ADJUSTMENT, -qty), stock_balance reduced, items.current_stock reduced, journal entry posted (Dr AP, Cr Inventory), activity logged
   - Verify: purchase's returned_quantity is updated
   - Verify: cannot return more than original qty

2. **Purchase Order Return — Partial**:
   - Go to PO detail page for a Completed PO (received 100 of 100)
   - Return 30 units
   - Verify: stock reversed by 30, `purchase_order_items.returned_quantity = 30`, `received_quantity` still shows 100
   - Verify: PO status recalculated from "Completed" → "Partially Received"
   - Verify: cannot return more than 70 next time (100 - 30 = 70 net remaining)

3. **Purchase Order Return — Full**:
   - Return remaining 70 units to fully reverse the receipt
   - Verify: `returned_quantity = received_quantity`, net received = 0
   - Verify: PO status resets to "Submitted"

4. **Purchase Order Return — Over-return blocked**:
   - Try to return more than `received_quantity - returned_quantity`
   - Verify: error returned, no stock movement created

5. **Return History Page**:
   - Navigate to `/purchases/returns`
   - Verify all return transactions are listed with correct data

6. **Edge cases**:
   - Return exactly the original quantity → purchase becomes fully returned
   - Return more than available → error
   - Return from a deleted purchase → error
   - Return with negative quantity → error
   - Return zero quantity → error
   - PO with mixed items: return some items fully, others partially, some not at all → PO status reflects each item's net state
   - Return from a PO that never had a goods receipt → error (no received_quantity to return against)
   - Multiple sequential returns on same PO item → accumulative tracking works correctly
