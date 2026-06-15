# Plan: Convert All AG Grid Action Buttons to 3-Dot Menus

## Context

The user liked the 3-dot menu conversion on the SalesPage and wants the same pattern applied to **all** AG Grid tables across the app. There are **13 files** (with **14 action columns**) that still use inline action buttons.

## Approach

Replace each AG Grid actions column's `cellRenderer` (which renders `<button>`/`<Button>` elements) with a `DropdownMenu` triggered by `MoreVertical` (⋮) icon, matching the pattern already applied to `SalesPage.jsx`.

No new components needed — reuse existing `DropdownMenu` from `client/src/components/common/DropdownMenu.tsx`.

## Files to Modify (13 files)

| # | File | Current Buttons | Menu Items |
|---|---|---|---|
| 1 | `pages/bom/BOMPage.jsx` | Activate/Deactivate, Edit, Delete | Toggle Status, Edit, Delete |
| 2 | `pages/customers/CustomersPage.jsx` | View (Eye), Edit (Edit2), Delete (Trash2) | View, Edit, Delete |
| 3 | `pages/customers/CustomerDetailPage.jsx` (grid 1 - invoices) | View, Edit, Delete (conditional), Cancel (conditional) | View, Edit, Delete, Cancel |
| 4 | `pages/customers/CustomerDetailPage.jsx` (grid 2 - payments) | Edit, Delete | Edit, Delete |
| 5 | `pages/expenses/ExpensesPage.jsx` | Edit, Delete | Edit, Delete |
| 6 | `pages/inventory/ItemsPage.jsx` | Edit, Delete | Edit, Delete |
| 7 | `pages/inventory/WarehousesPage.jsx` | Edit, Delete | Edit, Delete |
| 8 | `pages/payments/PaymentsPage.tsx` | Delete | Delete |
| 9 | `pages/production/ProductionPage.jsx` | Delete | Delete |
| 10 | `pages/purchases/PurchasesPage.jsx` | Return to Supplier | Return |
| 11 | `pages/quotations/QuotationsPage.jsx` | View, Edit, Convert to SO (conditional), Delete | View, Edit, Convert, Delete |
| 12 | `pages/roles/RolesPage.jsx` | Edit Permissions, Edit (conditional), Delete (conditional) | Edit Permissions, Edit, Delete |
| 13 | `pages/sales-orders/SalesOrdersPage.jsx` | View, Edit, Convert to Invoice (conditional), Delete | View, Edit, Convert, Delete |
| 14 | `pages/users/UsersPage.jsx` | Toggle Active/Inactive, Reset Password, Edit, Delete | Activate/Deactivate, Reset Password, Edit, Delete |

SalesPage.jsx is already done ✅

## Implementation Pattern

Each conversion follows the same template:

### Step pattern per file:

1. **Add imports**: `DropdownMenu` from `'../../components/common/DropdownMenu'`, `MoreVertical` from `'lucide-react'`
2. **Replace the actions column's `cellRenderer`**: swap the button group for:
   ```jsx
   <DropdownMenu
     trigger={<button className="action-menu-trigger"><MoreVertical size={16} /></button>}
     items={[
       { label: 'View', icon: <Eye size={16} />, onClick: ... },
       { label: 'Edit', icon: <Edit2 size={16} />, onClick: ... },
       ...(condition ? [{ label: 'Delete', icon: <Trash2 size={16} />, onClick: ..., destructive: true }] : [])
     ]}
     align="end"
   />
   ```
3. **Reduce column width** (typically from 120-160 to ~70)
4. **Clean up CSS**: remove old `.action-buttons`, `.action-btn` rules from corresponding CSS files
5. **Remove unused icon imports** where appropriate

### Notes on specific files:

- **BOMPage / ItemsPage / WarehousesPage / PaymentsPage / ProductionPage**: These use `<Button>` instead of raw `<button>`. They still get replaced with `DropdownMenu`/`MoreVertical`.
- **PaymentsPage.tsx / ProductionPage.jsx**: Only have a single "Delete" button. This will look cleaner as a 3-dot with "Delete" item.
- **RolesPage.jsx**: Edit Permissions and Edit buttons use icons (Key, Edit). System roles hide Edit/Delete — preserve this logic.
- **UserPage.jsx**: Status toggle uses UserCheck/UserX icons conditionally. Menu label should say "Activate" or "Deactivate" based on current state.
- **PurchasesPage.jsx**: Just one "Return to Supplier" button (RotateCcw icon). Odd case but still fits as a menu item.

## Steps

- [ ] **1. BOMPage.jsx** — Activate/Deactivate, Edit, Delete → 3-dot menu
- [ ] **2. CustomersPage.jsx** — View, Edit, Delete → 3-dot menu
- [ ] **3. CustomerDetailPage.jsx (Invoice grid)** — View, Edit, Delete, Cancel → 3-dot menu
- [ ] **4. CustomerDetailPage.jsx (Payment grid)** — Edit, Delete → 3-dot menu
- [ ] **5. ExpensesPage.jsx** — Edit, Delete → 3-dot menu
- [ ] **6. ItemsPage.jsx** — Edit, Delete → 3-dot menu
- [ ] **7. WarehousesPage.jsx** — Edit, Delete → 3-dot menu
- [ ] **8. PaymentsPage.tsx** — Delete → 3-dot menu
- [ ] **9. ProductionPage.jsx** — Delete → 3-dot menu
- [ ] **10. PurchasesPage.jsx** — Return → 3-dot menu
- [ ] **11. QuotationsPage.jsx** — View, Edit, Convert, Delete → 3-dot menu
- [ ] **12. RolesPage.jsx** — Permissions, Edit, Delete → 3-dot menu
- [ ] **13. SalesOrdersPage.jsx** — View, Edit, Convert, Delete → 3-dot menu
- [ ] **14. UsersPage.jsx** — Toggle, Password, Edit, Delete → 3-dot menu
- [ ] **15. CSS cleanup** — Remove old `.action-btn`, `.action-buttons`, `.icon-btn`, `.table-actions` CSS from all affected page CSS files
- [ ] **16. Verify build** — Check for compilation errors

## Reuse

- **`DropdownMenu`** — `client/src/components/common/DropdownMenu.tsx` (reusable, already handles portal, positioning, click-outside)
- **`MoreVertical`** — from `lucide-react` (already used in multiple places)

## Verification

1. Navigate to each page and confirm the 3-dot menu appears instead of buttons
2. Click each menu item and verify correct action fires
3. Check conditional items (e.g., Convert only shows for non-Invoiced/Completed orders)
4. Confirm dropdown positions correctly and closes on outside click
5. Mobile views should be unaffected (they use CompactCard components)
