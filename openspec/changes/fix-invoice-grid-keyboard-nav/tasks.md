## 1. Fix GenericEditableCell focusTargetCell timing

- [x] 1.1 Nest `requestAnimationFrame` after the `onEditingCell()` call so DOM query waits for React commit
- [x] 1.2 Keep the `description` field special case (find `<input>` inside container) — it still works, just deferred to after commit
- [x] 1.3 Remove the unused `Escape` key handling branch in `handleKeyDown` if suspicious — leave it, not part of this fix

## 2. Fix GenericSearchableCell inline arrow handlers

- [x] 2.1 Replace direct `onEditingCell(...)` calls in ArrowRight/ArrowUp/ArrowDown handlers with calls to `focusTargetCell` (already exists in this component with correct nested-timeout pattern)
- [x] 2.2 Ensure `handleSave()` is called before navigation in all paths (ArrowDown already has it, ArrowRight and ArrowUp do not)
- [x] 2.3 Verify the dropdown-close logic doesn't interfere with navigation (dropdown should close on navigation + target cell dropdown should open if target is description)

## 3. Smoke-test all navigation paths

- [x] 3.1 Start with empty invoice, add items, verify all arrow key combos on each field
- [x] 3.2 Test both discount scopes (`item` with discountValue field, `invoice` without)
- [x] 3.3 Test loose items (amount field visible) — verify left/right navigation through amount cell
- [x] 3.4 Test Tab/Enter cycling through fields and rows
- [x] 3.5 Run `npm run lint` and `npm run build`
