## Context

Currently every invoice line item computes `Amount = Qty × Rate`. Quantity is always the driver, Amount is read-only display. This works for packed items (soap, rice bags, etc.) but not for loose/open-weight items where the customer says "give me ₹100 worth" and the quantity in kg is derived.

The item master already has `unit_of_measure` and `standard_selling_price` columns. The two invoice grids (v1 wizard `InvoiceItemsTable.tsx`, v2 spreadsheet `InvoiceV2ItemsGrid.tsx`) both use a shared calculation pattern via `calculateItemTotal()`.

Key constraint from the user: **zero UI layout changes** — same table columns, same visual structure, only per-cell editability changes by `sale_type`.

## Goals / Non-Goals

**Goals:**
- Support `loose` sale type on items (rice, sugar, grains — billed by amount, qty in kg is derived)
- Bidirectional calculation per line item: Amount→Qty (primary) or Qty→Amount (secondary)
- Track `lastEditedField` per line to avoid circular recalculation
- Apply `qty_decimal_precision` and `rounding_step` from item master
- Update `calculateItemTotal()` to use stored amount for loose items where amount was the driver
- Migration with safe defaults (existing items become `packed`, unchanged behavior)

**Non-Goals:**
- No new UI elements, checkboxes, toggles, or layout changes
- No changes to inventory deduction logic (always uses Quantity)
- No changes to invoice printing/receipt templates
- No changes to purchase orders, quotations, or sales orders (future scope)
- No server-side API changes (the calculation is entirely front-end driven)

## Decisions

| Decision | Chosen Approach | Alternatives Considered |
|---|---|---|
| **sale_type location** | On `items` table (item master) | On `invoice_items` line level — unnecessary since one item record maps to one sale type |
| **rounding_step vs precision** | Store `qty_decimal_precision` only; derive `rounding_step = 10^(-precision)` in the utility | Storing both is redundant unless non-decimal steps like `0.5` are needed |
| **Amount field storage** | Store explicit `amount` on invoice line for loose items; for packed items it remains computed (`qty × rate`) | Could always compute — breaks when Amount is user-entered and qty × rate ≠ amount due to rounding |
| **calculateItemTotal changes** | Thread `sale_type` and `lastEditedField` — for loose+amount-driven, use `item.amount` directly; else use `qty × rate` | Simplifies to a single branch point |
| **"Last edited" tracking** | Component state per row: `lastEditedField: 'quantity' | 'amount' | null`. Reset to null when both fields zero | Could use a ref, but `useState` with the item data is cleaner |
| **Amount cell editability** | For loose items: Amount cell renders the same `<EditableNumberCell>` as Qty/Rate. For packed: stays as display-only `<td>` | Separate component — over-engineered, reuse existing pattern |
| **No server changes** | Invoice creation already stores qty, rate, tax, discount. Add `amount` to invoice_items schema and POST body | Could compute on server — simpler to store what the user entered |

## Calculation Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                      calcItemLine()                              │
│                                                                  │
│  input: { sale_type, quantity, amount, rate,                     │
│           qty_decimal_precision, lastEditedField }                │
│                                                                  │
│  if sale_type == 'packed':                                       │
│    amount = round(qty × rate, 2)                                 │
│    return { quantity, amount }                                   │
│                                                                  │
│  if sale_type == 'loose':                                        │
│    step = 10^(-qty_decimal_precision)  // e.g., 3 → 0.001       │
│    if lastEditedField == 'amount':                               │
│      if rate == 0 → error                                        │
│      qty = roundToStep(amount / rate, step)                      │
│      return { quantity: qty, amount }                            │
│    if lastEditedField == 'quantity':                             │
│      amount = round(qty × rate, 2)                               │
│      return { quantity, amount }                                 │
│    if lastEditedField == null (fresh row):                       │
│      // no-op, return as-is                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
Item Master (selected in invoice)
│
├── sale_type ──────────────► controls cell editability in grid
├── qty_decimal_precision ──► controls step precision + display decimals
├── unit_of_measure ─────────► display only (already works)
│
└──► Invoice grid line item:
    ┌────────────────────────────────────┐
    │ {                                  │
    │   qty: 0.667,       ← editable    │
    │   rate: 150,        ← editable    │
    │   amount: 100,      ← editable*   │  * only when loose
    │   sale_type: 'loose',             │
    │   lastEditedField: 'amount',      │
    │   qty_decimal_precision: 3,       │
    │ }                                  │
    └────────────────────────────────────┘
```

## Risks / Trade-offs

- **[Amount ≠ qty × rate]** For loose items where Amount was entered, `amount ≠ qty × rate` due to rounding. The invoice total must use the entered amount. → `calculateItemTotal()` branches on `sale_type` and `lastEditedField`.
- **[Rate = 0 division]** If user enters Amount but Rate is 0, division is undefined. → Validate inline: disable Amount editing until Rate > 0, show inline error.
- **[Qty rounds to 0]** If Amount is too small relative to Rate (e.g., ₹1 at ₹150/kg → qty = 0.007 → rounds to 0.000). → Show inline warning.
- **[Two grids to update]** Changes must go into both `InvoiceV2ItemsGrid.tsx` and `InvoiceItemsTable.tsx`. → Risk of drift — the shared `invoiceLineCalc.ts` reduces duplication risk.
- **[Packed item edge case]** Existing packed items work as before because `sale_type` defaults to `'packed'`. No migration data loss.
