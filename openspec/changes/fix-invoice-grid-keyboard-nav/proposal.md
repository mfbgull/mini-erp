## Why

Arrow key navigation in the invoice/sales-order line items grid is broken. When pressing left/right arrows to move between cells, the target cell's input is rendered but never receives focus — the cursor doesn't land, and the user must click again to type. This is a regression: React 19's automatic batching defers DOM updates, so `document.querySelector` in `focusTargetCell` finds stale DOM before React commits the new edit state. Up/down and Tab navigation are affected by the same root cause.

## What Changes

- Fix `GenericEditableCell.focusTargetCell` to wait for React commit before querying DOM for focus
- Fix `GenericSearchableCell` inline arrow-key handlers to route through `focusTargetCell` instead of calling `onEditingCell` directly (same focus issue)
- No new components, no API changes, no schema changes — purely a focus-timing fix in shared cell components

## Capabilities

### New Capabilities
- `grid-keyboard-nav`: Keyboard navigation (arrow keys, Tab, Enter) across editable grid cells — focus lands in the target cell's input

### Modified Capabilities

*(none — this is a bug fix in existing behavior, not a spec-level requirement change)*

## Impact

- **Files changed**: 2 files — `client/src/components/shared/GenericEditableCell.tsx`, `client/src/components/shared/GenericSearchableCell.tsx`
- **Callers affected**: All usages of `GenericEditableCell` and `GenericSearchableCell` (invoice form, sales order form, purchase order form, quotations)
- **No API changes**, no database changes, no new dependencies
