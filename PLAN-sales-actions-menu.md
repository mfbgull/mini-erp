# Plan: Replace AG Grid Action Buttons with 3-Dot Menu

## Context

The **SalesPage** (`client/src/pages/sales/SalesPage.jsx`) has an AG Grid that displays invoices. The last column ("Actions") currently renders 4 individual icon buttons (View, Edit, Return, Cancel) in a row. The user wants these consolidated into a single "3-dot" (kebab menu) dropdown for a cleaner, more compact UI.

A reusable `DropdownMenu` component already exists at `client/src/components/common/DropdownMenu.tsx` — we'll use it instead of building a new menu from scratch.

## Approach

1. Replace the 4 `<button>` elements in the `cellRenderer` of the `actions` column definition with a single `DropdownMenu` component triggered by a `MoreVertical` icon (3 dots).
2. Conditionally include/exclude menu items based on invoice status (same logic as current buttons).
3. Remove the old `action-buttons` / `action-btn` CSS since they'll no longer be used in the grid. The `DropdownMenu` already has its own styles.
4. The column width can be reduced from 160px to ~70px since it only needs to fit the trigger icon.

## Files to Modify

| File | Change |
|---|---|
| `client/src/pages/sales/SalesPage.jsx` | Replace the actions `cellRenderer` with `DropdownMenu` + `MoreVertical` trigger; update imports; reduce column width |
| `client/src/pages/sales/SalesPage.css` | Remove `.action-buttons`, `.action-btn`, `.action-btn.*` CSS rules (no longer needed in grid) |

## Reuse

- **`DropdownMenu`** component — `client/src/components/common/DropdownMenu.tsx` — fully reusable, handles portal rendering, click-outside, positioning, animation.
- **`MoreVertical`** icon from `lucide-react` — already used throughout the codebase for kebab menus (e.g., BOMCard, CompactInvoiceCard).

## Steps

- [ ] **1. Update imports in `SalesPage.jsx`**
  - Add `DropdownMenu` from `'../../components/common/DropdownMenu'`
  - Add `MoreVertical` from `'lucide-react'` (replace unused icons if needed, though the others are used elsewhere in the file)
  - Remove unused icon imports if any (keep those needed for other parts of the page)

- [ ] **2. Rewrite the actions column `cellRenderer`**
  Replace the current `<div class="action-buttons">` buttons with:
  ```jsx
  <DropdownMenu
    trigger={
      <button className="action-menu-trigger" title={t('common.actions')}>
        <MoreVertical size={16} />
      </button>
    }
    items={[
      { label: 'View', icon: <Eye size={16} />, onClick: () => navigate(`/sales/invoice/${params.data.id}/view`) },
      { label: 'Edit', icon: <Edit2 size={16} />, onClick: () => navigate(`/sales/invoice/${params.data.id}?mode=edit`) },
      ...(params.data?.status !== 'Cancelled'
        ? [
            { label: 'Return', icon: <RotateCcw size={16} />, onClick: () => handleOpenReturn(params.data) },
            { label: 'Cancel', icon: <Ban size={16} />, onClick: () => handleCancelInvoice(params.data), destructive: true }
          ]
        : [])
    ]}
    align="end"
  />
  ```

- [ ] **3. Reduce column width**
  Change `width: 160` to `width: 70` (or similar — enough for the 32px trigger with some padding).

- [ ] **4. Clean up CSS in `SalesPage.css`**
  Remove these no-longer-needed rules:
  - `.action-buttons { ... }`
  - `.action-btn { ... }`
  - `.action-btn:hover { ... }`
  - `.action-btn.view-btn { ... }`
  - `.action-btn.view-btn:hover { ... }`
  - `.action-btn.edit-btn { ... }`
  - `.action-btn.edit-btn:hover { ... }`

- [ ] **5. Verify**
  - Load the sales page at `http://localhost:3010/sales`
  - Check that the 3-dot menu appears in the Actions column
  - Click the menu — dropdown opens with correct items
  - For cancelled invoices: only View and Edit should show (no Return/Cancel)
  - For non-cancelled invoices: View, Edit, Return, Cancel should show
  - Each item triggers the correct action
  - Clicking outside the menu closes it
  - Mobile layout is unaffected (the mobile view uses `CompactInvoiceCardView` which is separate)

## Verification

1. Start the dev server and navigate to `http://localhost:3010/sales`
2. Verify the AG Grid loads with the new 3-dot menu in the Actions column
3. Click each menu item and confirm the correct action fires
4. Check a cancelled invoice (if available) — menu should only show View and Edit
5. Confirm the dropdown positions correctly and closes on outside click
