## Context

The invoice form (`/sales/invoice`) and sales order form use shared cell components for the line items grid:

- `GenericEditableCell` — renders numeric/text cells (qty, rate, tax, discount, amount)
- `GenericSearchableCell` — renders searchable description cells with autocomplete dropdown

Both consume a single `editingCell: string | null` state that controls which cell (if any) shows an `<input>`. Navigation (arrow keys, Tab, Enter) calls `onEditingCell(cellId)` to move between cells.

**Root cause**: React 19's automatic batching defers state-triggered re-renders to the next microtask. The `focusTargetCell` function in `GenericEditableCell` calls `onEditingCell(...)` (setState) and `document.querySelector(...)` in the same synchronous block — `querySelector` runs before React commits, finding stale DOM elements that are about to be replaced. Focus either lands on a soon-to-be-removed element (numeric cells) or finds no `<input>` at all (description cells).

## Goals / Non-Goals

**Goals:**
- Arrow left/right moves to adjacent cell and focus lands in the new cell's `<input>` (in edit mode)
- Arrow up/down moves between rows preserving the same column, focus in edit mode
- Tab/Enter cycle through fields and rows with focus in edit mode
- Both `GenericEditableCell` and `GenericSearchableCell` behave consistently
- Fix applies to invoice form, sales order form, purchase order form, and quotations (all use the shared cells)

**Non-Goals:**
- No new navigation features (e.g., Home/End, page up/down, multi-select)
- No change to the cell rendering or data flow
- No performance optimization beyond the fix

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| How to wait for React commit | `requestAnimationFrame` after `setTimeout` | `requestAnimationFrame` fires after the browser paints, guaranteeing React's commit is complete. Nested `setTimeout(0)` works but is less reliable with concurrent React features |
| Where to fix the timing | Both `focusTargetCell` (GenericEditableCell) and inline handlers (GenericSearchableCell) | The pattern is duplicated — fix both to the same approach so they stay consistent |
| Single source of focus logic | Keep `focusTargetCell` in each component, don't extract | Two different components with different DOM structures (description has an autocomplete dropdown, numeric has plain input). A shared focus helper would need to know internals of both |

**Alternatives considered:**
- **`useEffect` with ref + `useImperativeHandle`**: More React-idiomatic but would require refactoring both components from `memo`-wrapped functions to forwarded-ref components, touching every caller signature. The `requestAnimationFrame` approach is a surgical fix.
- **`flushSync`**: Forces synchronous re-render. Fragile with concurrent features and complicates debugging. Only works in specific conditions.
- **Controlled `autoFocus` prop**: Would need each cell to auto-focus when `editingCell` matches — React's `autoFocus` only fires on mount, and with keep-mounted memo this wouldn't re-fire reliably.

## Risks / Trade-offs

- **[Timing flakiness]** `requestAnimationFrame` adds ~16ms latency to navigation. Trade-off: 16ms is imperceptible to users, and `focusTargetCell` already uses 50ms timeouts.
- **[Stale closure]** If `moveToCell` fires during a concurrent render, `items` / `fieldOrder` references from the render might be stale. Mitigation: the existing code already captures these as closure variables, and we're only changing the focus timing, not the navigation logic itself.
- **[Edge: dropdown open during navigation]** If the user presses arrow keys while `GenericSearchableCell`'s autocomplete dropdown is open, the dropdown close logic might interfere. Mitigation: existing code already `e.preventDefault()`s on arrow keys, and we're preserving that.
