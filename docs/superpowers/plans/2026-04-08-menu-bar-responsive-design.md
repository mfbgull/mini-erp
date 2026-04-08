# Menu Bar Responsive Design Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement responsive breakpoints for the top navigation menu so that the most-used items are visible based on screen width, with a "More" dropdown for remaining items. Ensures user menu stays visible at all widths.

**Architecture:** Use CSS media queries to show/hide nav items based on viewport width. Keep the existing dropdown component structure and add a new "More" dropdown for hidden items.

**Tech Stack:** React, TypeScript, CSS (no new dependencies)

---

## Implementation Notes

### Priority Order (defined in spec)
1. Dashboard (index 0)
2. Inventory (index 1)
3. Sales (index 2)
4. Reports (index 3)
5. Purchases (index 4)
6. Expenses (index 5)
7. BOM (index 6)
8. Production (index 7)
9. Forecasts (index 8)
10. Activity (index 9)
11. Integrations (index 10)
12. Settings (index 11)

### Responsive Breakpoints
- **≥1200px**: Show indices 0-5 (Dashboard to Expenses), rest in "More"
- **900px-1199px**: Show indices 0-3 (Dashboard to Reports), rest in "More"
- **<900px**: Show indices 0,2 (Dashboard, Sales), rest in "More"

---

## Chunk 1: Add "More" Dropdown to TopMenu.tsx

**Files:**
- Modify: `client/src/components/layout/TopMenu.tsx`
- Reference: `client/src/components/layout/TopMenu.css` (read for existing styles)

- [ ] **Step 1: Add "More" to NAV_ITEMS array**

After line 84 (after Settings), add:

```typescript
{
  label: 'More',
  icon: <MoreHorizontal size={18} strokeWidth={1.5} />,
  children: [
    { path: '/bom', label: 'BOM' },
    { path: '/production', label: 'Production' },
    { path: '/forecasts', label: 'Forecasts' },
    { path: '/activity-log', label: 'Activity' },
    { path: '/integrations', label: 'Integrations' },
    { path: '/settings', label: 'Settings' }
  ]
}
```

- [ ] **Step 2: Import MoreHorizontal icon**

Update line 4-8 to add `MoreHorizontal`:

```typescript
import { 
  LayoutDashboard, Package, DollarSign, BarChart3, ShoppingCart,
  ClipboardList, Factory, Receipt, FileText, Link2, Settings, Moon, Sun, 
  TrendingUp, ChevronDown, LogOut, MoreHorizontal
} from 'lucide-react';
```

- [ ] **Step 3: Verify the file still compiles**

Run: `cd client && npx tsc --noEmit`
Expected: No errors

---

## Chunk 2: Add CSS Responsive Styles

**Files:**
- Modify: `client/src/components/layout/TopMenu.css`

- [ ] **Step 1: Read existing TopMenu.css to understand current styles**

```bash
cat client/src/components/layout/TopMenu.css
```

- [ ] **Step 2: Add responsive CSS after existing styles**

Add this at the end of the file:

```css
/* Responsive breakpoints */

/* Laptop: 900px - 1199px - show top 4 items */
@media (max-width: 1199px) and (min-width: 900px) {
  .top-menu-item:nth-child(n+5),
  .top-menu-dropdown:nth-child(n+5) {
    display: none;
  }
}

/* Tablet: < 900px - show Dashboard (1) and Sales (3) only */
@media (max-width: 899px) {
  .top-menu-item:nth-child(n+3):not(.more-menu-item),
  .top-menu-dropdown:nth-child(n+3):not(.more-menu-item) {
    display: none;
  }
  
  /* Hide keyboard shortcut hints on mobile */
  .shortcut-hint {
    display: none;
  }
  
  /* Smaller padding for compact fit */
  .top-menu-item,
  .top-menu-dropdown-trigger {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .top-menu-logo-text {
    display: none;
  }
}

/* Ensure "More" dropdown always appears when needed */
@media (max-width: 1199px) {
  .top-menu-dropdown:last-child {
    display: flex !important;
  }
}
```

- [ ] **Step 3: Verify CSS has no syntax errors**

Run: `cd client && npx tsc --noEmit` (CSS won't be checked, but we can verify the component still works)

---

## Chunk 3: Test Responsive Behavior

**Files:**
- Test: `client/src/components/layout/TopMenu.tsx`

- [ ] **Step 1: Build the client to ensure no errors**

Run: `cd client && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Manual testing steps**

1. Start dev server: `cd client && npm run dev`
2. Open http://localhost:5173 in browser
3. Login with admin/admin123
4. **Test 1200px+**: Browser at full width - should see: Dashboard, Inventory, Sales, Reports, Purchases, Expenses, More
5. **Test 900-1199px**: Resize browser to ~1000px wide - should see: Dashboard, Inventory, Sales, Reports, More
6. **Test <900px**: Resize browser to ~800px wide - should see: Dashboard, Sales, More
7. **Verify user menu**: At all widths, theme toggle and user menu should be visible on the right

- [ ] **Step 3: Take screenshots at each breakpoint**

Use dev-browser to capture screenshots at each breakpoint and verify the menu looks correct

---

## Chunk 4: Final Verification & Commit

**Files:**
- Modified: `client/src/components/layout/TopMenu.tsx`
- Modified: `client/src/components/layout/TopMenu.css`

- [ ] **Step 1: Run TypeScript check**

Run: `cd client && npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 2: Commit changes**

```bash
git add client/src/components/layout/TopMenu.tsx client/src/components/layout/TopMenu.css
git commit -m "feat: add responsive menu with breakpoints for 1200px+, 900-1199px, and <900px"
```

---

## Acceptance Criteria Verification

| Criteria | How to Verify |
|----------|---------------|
| At 1200px+ width: 6 nav items + More visible | Browser at full width, count visible items |
| At 900-1199px width: 4 nav items + More visible | Resize to 1000px, count visible items |
| At <900px width: 2 nav items + More visible | Resize to 800px, count visible items |
| "More" dropdown contains all hidden items | Click "More" and verify all 6 items appear |
| Hover dropdowns still work | Hover over Inventory, Sales, Reports - dropdowns should appear |
| Keyboard shortcut still works | Press Alt+1, should navigate to Dashboard |
| Dark/light mode toggle works | Click moon/sun icon, theme should change |
| User menu accessible at all widths | User name and logout button visible on right |