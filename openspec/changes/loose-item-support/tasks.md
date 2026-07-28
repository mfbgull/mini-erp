## 1. Migration — Database schema

- [x] 1.1 Create migration SQL file `server/src/migrations/add-loose-item-support.sql` with `ALTER TABLE items ADD COLUMN sale_type TEXT DEFAULT 'packed' NOT NULL CHECK(sale_type IN ('packed','loose'))`, `qty_decimal_precision INTEGER DEFAULT 0 NOT NULL`, `rounding_step REAL DEFAULT NULL`
- [x] 1.2 Register migration in the server's migration runner or document how to apply it manually

## 2. Shared utility — invoiceLineCalc.ts

- [x] 2.1 Create `client/src/utils/invoiceLineCalc.ts` with `roundToStep(value, step)` function
- [x] 2.2 Implement `calcItemLine()` — dispatches between packed (qty × rate) and loose (bidirectional) logic
- [x] 2.3 Export types: `SaleType`, `CalcItemLineInput`, `CalcItemLineResult`, `CalcItemLineError`
- [x] 2.4 Write unit tests in `client/src/utils/__tests__/invoiceLineCalc.test.ts` covering all scenarios from the spec

## 3. Types — Update InvoiceFormItem and InvoiceV2FormItem

- [x] 3.1 Add `sale_type?: 'packed' | 'loose'`, `lastEditedField?: 'quantity' | 'amount' | null`, `qty_decimal_precision?: number`, `rounding_step?: number` to `InvoiceFormItem` in `types/index.ts`
- [x] 3.2 Add the same fields to `InvoiceV2FormItem` in `types/invoiceV2.ts`
- [x] 3.3 Update `createEmptyItemRow()` in `invoiceCalculations.ts` to include new fields
- [x] 3.4 Update `createEmptyInvoiceV2Item()` equivalent to include new fields

## 4. Frontend — InvoiceV2ItemsGrid (spreadsheet)

- [x] 4.1 Import `calcItemLine` into `InvoiceV2ItemsGrid.tsx`
- [x] 4.2 When a loose item is selected via searchable cell, set `sale_type`, `qty_decimal_precision`, `rounding_step` from the item master response
- [x] 4.3 Make Amount cell render as `<EditableNumberCell>` when `item.sale_type === 'loose'` (same visual as Qty/Rate); keep as display `<td>` for packed
- [x] 4.4 Add `onUpdateAmount` handler that sets `lastEditedField = 'amount'` and calls `calcItemLine`
- [x] 4.5 Add `onUpdateQuantity` handler that sets `lastEditedField = 'quantity'` and calls `calcItemLine`
- [x] 4.6 Add `onUpdateRate` handler that recalculates based on existing `lastEditedField`
- [x] 4.7 Add zero-rate validation and qty-rounds-to-zero warning inline in the grid

## 5. Frontend — InvoiceItemsTable (v1 wizard)

- [x] 5.1 Same changes as tasks 4.1–4.7 but applied to the v1 wizard `InvoiceItemsTable.tsx` (Amount cell becomes editable for loose items)

## 6. Frontend — Calculation functions

- [x] 6.1 Update `calculateItemTotal()` in `invoiceCalculations.ts` to check `sale_type` and `lastEditedField` — for loose+amount-driven, use `item.amount` directly instead of `qty × rate`
- [x] 6.2 Verify all other calculation functions (`calculateSubtotal`, `calculateTax`, `calculateDiscount`, `calculateTotal`) work correctly with the updated `calculateItemTotal`

## 7. Frontend — Item master form

- [x] 7.1 Locate the item add/edit form component (likely `client/src/components/items/ItemForm.tsx` or similar)
- [x] 7.2 Add `sale_type` dropdown selector with "Packed" / "Loose" options
- [x] 7.3 Add conditional `qty_decimal_precision` and `rounding_step` fields shown only when `sale_type === 'loose'`
- [x] 7.4 Ensure form saves new columns via the items API

## 8. Verify

- [x] 8.1 `npm run typecheck` — no TypeScript errors
- [x] 8.2 Run unit tests for `invoiceLineCalc.ts` — all pass
- [ ] 8.3 Manual test: create a loose item, create invoice with that item, verify Amount→Qty and Qty→Amount flows
- [ ] 8.4 Manual test: existing packed items work exactly as before (no regression)
