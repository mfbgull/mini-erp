## Why

Mini ERP needs to support items sold by loose weight/volume (rice, sugar, grains — sold by kg but billed by rupee amount). Currently every line item computes `Amount = Qty × Rate` with Quantity as the driver. For loose items, the customer often says "give me ₹100 worth of rice" — Amount drives the calculation, and Quantity is derived. This requires a "loose" sale type with bidirectional calculation but zero UI layout changes.

## What Changes

- **New `sale_type` column** on `items` table: `'packed' | 'loose'` (default `'packed'`)
- **New `qty_decimal_precision`** and **`rounding_step`** columns on `items` table for loose item quantity rounding
- **Shared calculation utility** `invoiceLineCalc.ts` with `calcItemLine()` that handles both packed and loose logic
- **Item master form** updated with `sale_type` selector and loose-item fields (precision, rounding)
- **Invoice grids** (v1 wizard + v2 spreadsheet): Amount cell becomes editable for loose items; Quantity and Amount track which field was last edited to drive bidirectional calculation
- **`InvoiceFormItem`/`InvoiceV2FormItem` types** updated with `sale_type`, `lastEditedField`, `qty_decimal_precision`, `rounding_step`
- **`calculateItemTotal()`** updated to use stored amount (not `qty × rate`) for loose items where amount was the driver
- **Migration script** adding columns with safe defaults

## Capabilities

### New Capabilities
- `loose-item-schema`: Database schema changes — new columns on `items` table, migration script
- `loose-item-calculation`: Shared `invoiceLineCalc.ts` utility with `roundToStep`, `calcItemLine` for bidirectional qty/amount computation
- `loose-item-ui`: Invoice grid updates — conditional Amount editability, last-edited-field tracking, decimal precision display
- `loose-item-master`: Item master form — `sale_type` dropdown with conditional precision/rounding fields

### Modified Capabilities
- *(none — no existing specs to modify)*

## Impact

- **Data layer**: `ALTER TABLE items` migration (non-breaking: defaults preserve existing behavior)
- **Types**: `InvoiceFormItem`, `InvoiceV2FormItem` get new optional fields
- **Utilities**: New `invoiceLineCalc.ts`, update `invoiceCalculations.ts` (calculateItemTotal)
- **Frontend grids**: `InvoiceV2ItemsGrid.tsx` (Amount becomes EditableNumberCell for loose items), `InvoiceItemsTable.tsx` (same)
- **Item master**: Item add/edit form needs `sale_type` control
- **Inventory**: No change — deduction always uses Quantity
- **Tests**: New unit tests for `invoiceLineCalc.ts`
