# Menu Bar Responsive Design Spec

**Date:** 2026-04-08
**Status:** Approved

## Problem

The top menu bar has 12 top-level navigation items that overflow horizontally, pushing the user menu (theme toggle + user profile) off-screen. This makes it difficult to access Settings, Integrations, and the user menu.

## Solution

Implement responsive breakpoints that show the most-used items based on screen width, with a "More" dropdown for remaining items.

## Breakpoint Strategy

| Screen Width | Visible Items | Goes into "More" |
|--------------|---------------|------------------|
| ≥1200px (Desktop) | Dashboard, Inventory, Sales, Reports, Purchases, Expenses | BOM, Production, Forecasts, Activity, Integrations, Settings |
| 900px-1199px (Laptop) | Dashboard, Inventory, Sales, Reports | Purchases, Expenses, BOM, Production, Forecasts, Activity, Integrations, Settings |
| <900px (Tablet) | Dashboard, Sales | Inventory, Reports, Purchases, Expenses, BOM, Production, Forecasts, Activity, Integrations, Settings |

## Item Priority Order

1. Dashboard
2. Inventory
3. Sales
4. Reports
5. Purchases
6. Expenses
7. BOM
8. Production
9. Forecasts
10. Activity
11. Integrations
12. Settings

## UI/UX Requirements

1. **"More" dropdown** - A dropdown button at the end of the nav that shows all hidden items
2. **Smooth transitions** - Menu should not jump when resizing
3. **Fixed right section** - Theme toggle and user menu stay on the right, always visible
4. **Preserve existing behavior** - Dropdowns on hover still work, keyboard shortcuts still work
5. **Dark mode support** - All styles work in both light and dark modes

## Implementation Details

- Use CSS media queries for breakpoints
- Use CSS `display: none` or visibility to hide items that don't fit
- Keep the existing dropdown component structure for "More"
- No JavaScript required for responsive behavior
- Use existing TopMenu.css for all styling

## Files to Modify

- `client/src/components/layout/TopMenu.tsx` - Add responsive logic
- `client/src/components/layout/TopMenu.css` - Add responsive styles

## Acceptance Criteria

1. ✅ At 1200px+ width: 6 nav items + More visible, user menu visible
2. ✅ At 900-1199px width: 4 nav items + More visible, user menu visible
3. ✅ At <900px width: 2 nav items + More visible, user menu visible
4. ✅ "More" dropdown contains all hidden items
5. ✅ Hover dropdowns still work for Inventory, Sales, Reports, More
6. ✅ Keyboard shortcut (Alt+1) still works for Dashboard
7. ✅ Dark/light mode toggle still works
8. ✅ User menu/logout still accessible at all widths