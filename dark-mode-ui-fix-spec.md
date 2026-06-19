# Dark Mode UI Fix — Specification

## Problem Summary

In dark mode, many buttons, labels, top menu dropdowns, and 3-dot action menus have poor contrast:
1. **Buttons** — invisible text (white/light on white/light), due to conflicting `!important` rules at the end of `dark-mode.css`
2. **Labels** — light text on light / dark-green backgrounds, with multiple conflicting `!important` rules on stat card labels, summary card labels, preview stat labels, form labels, and generic `<label>` elements
3. **TopMenu dropdowns** — background and text colors are both dark, making items hard to read
4. **DropdownMenu (3-dot menus)** — trigger hover and menu item hover use `--hover-bg` which falls back to light-mode value (`#F1F5F9`) in dark mode, creating white-on-white hover states

---

## Root Cause Analysis

### 1. `--hover-bg` Not Defined in Dark Mode

`dark-mode.css` defines over 40 CSS variables in its `html.dark {}` block but **does not define `--hover-bg`**. This means `var(--hover-bg)` falls through to the light-mode value `#F1F5F9` when used in dark mode.

**Affected components (all use `var(--hover-bg)` and fall to light-mode `#F1F5F9`):**
- `DropdownMenu.css` — trigger hover, menu item hover
- `TopMenu.css` — dropdown item hover, nav item hover
- `Sidebar.css` — nav item hover
- `SearchModal.css` — close button hover (uses `var(--bg-light)` which is `#0A0F0D` in dark mode — near-invisible)
- All card hover states
- `data-table` row hover
- Item card menu hover
- POS search results hover
- AG Grid editable cell hover
- Compact card hover states
- And many more...

**Side-benefit of Fix 1:** Adding `--hover-bg: #1A2820` will automatically fix ALL of these components in a single line. No individual component CSS changes needed for hover backgrounds (except SearchModal close button which uses `var(--bg-light)` and needs its own fix — see Gap 2).

### 2. Conflicting Button CSS Cascade — 3-Level `!important` Override Collapse

There are **three separate sets** of button `!important` rules in `dark-mode.css`, each partially overriding the previous one. The result is a cascading collapse:

**Level 1 — Early rules (lines ~118-123):** Good contrast, but get overridden later.
```css
html.dark .btn-primary {
  background-color: #22D3EE !important;  /* cyan */
  color: #0F172A !important;             /* dark */
}
html.dark .btn-secondary {
  background-color: #374151 !important;  /* dark gray */
  color: #F9FAFB !important;             /* off-white */
}
```

**Level 2 — "Button overrides" section:** Secondary button becomes invisible (same bg + text color).
```css
html.dark .btn-primary {
  background: var(--primary) !important;  /* #10B981 (green) */
  color: white !important;
}
html.dark .btn-secondary {
  background: var(--neutral-700) !important;  /* #ECFEED */
  color: var(--text-primary) !important;        /* #ECFEED - SAME! */
}
```
`--neutral-700` (`#ECFEED`) and `--text-primary` (`#ECFEED`) are the **exact same light green**. Result: invisible text.

**Level 3 — "All page action buttons" section (end of file):** Broad `html.dark .btn, html.dark .btn-primary, html.dark .btn-secondary { ... }` catch-all.
```css
html.dark .btn,
html.dark .btn-primary,
html.dark .btn-secondary {
  background: var(--neutral-700) !important;  /* #ECFEED again */
  color: var(--text-primary) !important;        /* #ECFEED */
}
```
Then immediately overridden again:
```css
/* .btn-primary fixed */
html.dark .btn-primary {
  background: var(--primary) !important;   /* #10B981 - good */
  color: white !important;
}
/* .btn-secondary STILL BROKEN */
html.dark .btn-secondary {
  background: var(--neutral-600) !important;  /* #D1FAE5 (light green) */
  color: var(--text-primary) !important;        /* #ECFEED (light green) */
}
```
**Result:** Primary buttons go through 3 overrides but eventually land on correct green bg + white text. Secondary buttons land on `#D1FAE5` bg + `#ECFEED` text — both light green tones, nearly invisible.

### 3. TopMenu Dropdown Colors — Background Is Near-White, Not Dark

In `TopMenu.css` dark mode:
- Dropdown background: `var(--neutral-800)` = **`#F0FDF4`** (near-white/very light green)
- Dropdown item text: `var(--neutral-300)` = `#3D4F46` (medium-dark green)
- On hover: bg → `var(--neutral-700)` = `#ECFEED` (still light), text → `var(--neutral-100)` = `#111916` (dark)

The dropdown background is **near-white** (`#F0FDF4`), making it look like a bright white panel on the dark page — jarring and out of place. This is because `--neutral-800` was designed as a **text color** (near-white on dark) but is being used as a **background color** here. The hover state fixes contrast locally (dark text on light bg), but the overall look still feels wrong in dark mode.

### 4. DropdownMenu (3-dot) Hover States

`DropdownMenu.css` uses `var(--hover-bg)` which falls back to light-mode value `#F1F5F9` (light gray) on dark backgrounds, making text invisible on hover.

### 5. Stat Card & Summary Card Label Conflicts — 4+ Conflicting `!important` Rules

`.stat-label` has at least **4 separate `!important` overrides** in dark-mode.css, all resolving to light green tones (`#86EFAC`, `#A7F3D0`) that lack sufficient contrast on `--card-bg` (`#111916`).

### 6. Login Page Labels — `var(--neutral-700)` Resolves to Light Green

`Login.css` uses `color: var(--neutral-700)` for `.form-group label` and `.login-footer strong`. In dark mode, `--neutral-700` is `#ECFEED` (light green), creating the same low-contrast issue as other labels.

### 7. Search Modal Close Button — `var(--bg-light)` Hover Is Near-Invisible

The Search Modal close button (`SearchModal.css:93-95`) uses:
```css
.search-modal-close-btn:hover {
  background: var(--bg-light);
  color: var(--text-primary);
}
```
In dark mode, `--bg-light` is `#0A0F0D` (extremely dark, even darker than `--card-bg` `#111916`). This makes the close button's hover background **darker** than its resting state, effectively making it invisible.

The `.search-modal-category-title` and `.search-modal-footer` also use `var(--bg-light)` as background — this is fine for static backgrounds, but the hover transition is problematic.

---

## Page-Level Label Analysis

### 5a. Sales Invoice Page (`SalesInvoicePage.css` + `invoice.css`)

This page uses **16+ distinct label classes**, most of which resolve to light green (`#86EFAC` / `#D1FAE5`) in dark mode:

| Label Class | CSS Source | Dark Mode Override | Current Dark Value | Issue |
|-------------|-----------|-------------------|--------------------|-------|
| `.section-label-modern` | `SalesInvoicePage.css:115` | `dark-mode.css:2060` | `var(--text-secondary)` = `#86EFAC` | Low contrast on `--card-bg` `#111916` |
| `.date-label` | `SalesInvoicePage.css:275` | None explicit | `var(--text-tertiary, #9ca3af)` → falls back to light `#9CA3AF` | Decent but could be better |
| `.footer-label` | `SalesInvoicePage.css:886` | `dark-mode.css:2202` | `var(--text-secondary)` = `#86EFAC` | Low contrast |
| `.meta-label` | `SalesInvoicePage.css:235` | None explicit | `var(--text-secondary, #6b7280)` → `#86EFAC` | Low contrast |
| `.discount-label-modern` | `SalesInvoicePage.css:344` | `dark-mode.css:2098` | `var(--text-secondary)` = `#86EFAC` | Low contrast |
| `.payment-method-field label` | `SalesInvoicePage.css:1219` | None explicit | `var(--text-secondary, #6b7280)` → `#86EFAC` | Low contrast |
| `.payment-summary-item` | `SalesInvoicePage.css:933` | None explicit | `var(--text-secondary, #6b7280)` → `#86EFAC` | Low contrast |
| `.miw-label` | `invoice.css:524` | None explicit | `var(--text-secondary, #6b7280)` → `#86EFAC` | Low contrast |
| `.miw-step-label` | `invoice.css:125` | None explicit | `var(--neutral-600)` = `#D1FAE5` | Very low contrast (light on dark) |
| `.miw-footer-label` | `invoice.css:1151` | None explicit | `var(--neutral-600)` = `#D1FAE5` | Very low contrast |
| `.miw-summary-label` | `invoice.css:1908` | None explicit | `var(--neutral-600)` = `#D1FAE5` | Very low contrast |
| `.miw-sheet-section-title` | `invoice.css` | None explicit | `var(--text-secondary, #6b7280)` → `#86EFAC` | Low contrast |
| `.miw-customer-info-label` | `invoice.css:2375` | None explicit | `#1e40af` (hardcoded blue) | Hardcoded blue, not dark-adapted |
| `.balance-label` | `SalesInvoicePage.css` | None explicit | `#bfdbfe` (hardcoded light blue) | Hardcoded, not dark-adapted |

**Page-specific issue:** The Sales Invoice page is the most complex form in the app. Its labels are split between two CSS files (`SalesInvoicePage.css` and `invoice.css`), and many lack dark mode overrides. The mobile invoice wizard (`miw-*` classes) is especially affected — its labels use `var(--neutral-600)` which resolves to light green `#D1FAE5`.

**Worst offenders:** `.miw-step-label`, `.miw-footer-label`, `.miw-summary-label` — all resolve to `#D1FAE5` (very light green) on `--card-bg` (`#111916`, very dark green). This is barely readable.

### 5b. Customer Detail Page (`CustomerDetailPage.css` + `CustomerPreview.css`)

| Label Class | CSS Source | Dark Mode Override | Current Dark Value | Issue |
|-------------|-----------|-------------------|--------------------|-------|
| `.quick-stat-label` | `CustomerDetailPage.css:126` | **NONE** | Falls to light-mode `var(--text-tertiary, #94a3b8)` = `#94A3B8` | **No dark override** — may be OK but inconsistent |
| `.status-card .status-label` | `CustomerDetailPage.css:333` | **NONE** | `var(--text-secondary, #64748b)` → `#86EFAC` | No dark override |
| `.info-text .info-label` | `CustomerDetailPage.css:452` | **NONE** | `var(--text-tertiary, #94a3b8)` → unchanged | No dark override |
| `.setting-label` | `CustomerDetailPage.css:495` | **NONE** | `var(--text-secondary, #64748b)` → `#86EFAC` | No dark override |
| `.total-label` | `CustomerDetailPage.css:1032` | **NONE** | `var(--text-secondary, #6b7280)` → `#86EFAC` | No dark override |
| `.quick-access-label` | `CustomerDetailPage.css:1174` | **NONE** | `var(--text-secondary, #64748b)` → `#86EFAC` | No dark override |
| `.section-title` | `CustomerDetailPage.css` | `dark-mode.css` | `var(--text-primary)` = `#ECFEED` | OK (this is the main heading) |
| `.detail-label` (preview) | `CustomerPreview.css:166` | `dark-mode.css:1303` | `var(--text-tertiary)` = `#6B7280` | Acceptable gray |
| `.edit-payment-form .form-group label` | `CustomerDetailPage.css:912` | **NONE** | `var(--neutral-700, #374151)` → `#ECFEED` | No dark override, but resolves to light green |

**Page-specific issue:** The Customer Detail page has **6 label classes with NO dark mode override** — `.quick-stat-label`, `.status-card .status-label`, `.info-text .info-label`, `.setting-label`, `.total-label`, and `.quick-access-label`. They all rely on CSS variable fallbacks, which may or may not resolve correctly in dark mode.

**Critical:** `.quick-stat-label` has **no dark mode override at all**. It uses `var(--text-tertiary, #94a3b8)` — in light mode this is `#94A3B8` (muted gray), but in dark mode `--text-tertiary` is `#6B7280` (medium gray) which is readable but wasn't intentionally set for this context. If the CSS variable cascade fails for any reason, it falls back to the light-mode `#94A3B8`.

### 5c. Inventory Pages (`ItemsPage.css`, `ItemPreview.css`, `StockByWarehousePage.css`, `StockMovementPage.css`)

| Label Class | CSS Source | Dark Mode Override | Current Dark Value | Issue |
|-------------|-----------|-------------------|--------------------|-------|
| `.preview-stat-label` | `ItemPreview.css:127` | `dark-mode.css:658, 929` | `var(--neutral-400)` = `#86EFAC` (CONFLICTING) | Multiple conflicting `!important` rules |
| `.preview-stat-value` | `ItemPreview.css:137` | `dark-mode.css:662, 933` | `var(--neutral-900)` = `#FAFEF5` | OK (near-white on dark) |
| `.preview-detail-label` | `ItemPreview.css:187` | `dark-mode.css:1139` | `var(--text-tertiary)` = `#6B7280` | Acceptable gray |
| `.preview-detail-value` | `ItemPreview.css:192` | `dark-mode.css:1144` | `var(--text-primary)` = `#ECFEED` | OK (light on dark) |
| `.stock-label` | `StockMovementPage.css` | `dark-mode.css:1160` | `var(--text-tertiary)` = `#6B7280` | Acceptable gray |
| `.warehouse-label` | `StockMovementPage.css` | **NONE** | `var(--neutral-500)` = `#A7F3D0` | Light green, low contrast |
| `.quantity-filter-label` | `StockByWarehousePage.css` | **NONE** | `var(--neutral-700)` → `#ECFEED` | Light green on dark — OK for primary |
| `.available-stock-display .stock-label` | `StockMovementPage.css:2408` | **NONE** | `var(--neutral-500)` = `#A7F3D0` | Light green, low contrast |
| `.form-section h4` | `ItemsPage.css` | `dark-mode.css` | `var(--neutral-700)` = `#ECFEED` | OK (primary text) |
| `.no-results h3` | `ItemsPage.css` | **NONE** | `var(--neutral-700)` → `#ECFEED` | OK (heading) |
| `.no-results p` | `ItemsPage.css` | **NONE** | `var(--neutral-500)` = `#A7F3D0` | Light green, low contrast |

**Page-specific issue:** The Item Preview dialog is one of the most frequently used modals in the app. Its `.preview-stat-label` has **conflicting `!important` rules** at lines 658 and 929 of dark-mode.css, resolved to `var(--neutral-400)` = `#86EFAC`. The `.warehouse-label` and `.no-results p` have no dark overrides and fall to light green `#A7F3D0`.

---

### 5d. Summary of All Label Issues

| Priority | Label Type | Current Color | Background | Contrast | Fix Color |
|----------|-----------|--------------|-----------|----------|-----------|
| 🔴 **CRITICAL** | `.miw-step-label` | `#D1FAE5` (light green) | `#111916` (dark green) | ~2.5:1 | `#9CA3AF` |
| 🔴 **CRITICAL** | `.miw-footer-label` | `#D1FAE5` (light green) | `#111916` (dark green) | ~2.5:1 | `#9CA3AF` |
| 🔴 **CRITICAL** | `.miw-summary-label` | `#D1FAE5` (light green) | `#111916` (dark green) | ~2.5:1 | `#9CA3AF` |
| 🔴 **CRITICAL** | `.section-label-modern` | `#86EFAC` (light green) | `#111916` (dark green) | ~3.5:1 | `#9CA3AF` |
| 🟡 HIGH | `.stat-label` (all) | `#86EFAC` (conflicting) | `#111916` | ~3.5:1 | `#9CA3AF` |
| 🟡 HIGH | `.summary-label` | `#86EFAC` | `#111916` | ~3.5:1 | `#9CA3AF` |
| 🟡 HIGH | `.preview-stat-label` | `#86EFAC` (conflicting) | `#111916` | ~3.5:1 | `#9CA3AF` |
| 🟡 HIGH | `.kpi-label` | `#86EFAC` | `#111916` | ~3.5:1 | `#9CA3AF` |
| 🟡 HIGH | `.quick-stat-label` | `#94A3B8` (fallback, no override) | `#111916` | ~4.5:1 | `#9CA3AF` |
| 🟡 HIGH | `.payment-summary-item` | `#86EFAC` | `#111916` | ~3.5:1 | `#9CA3AF` |
| 🟡 HIGH | `.miw-label` | `#86EFAC` | `#111916` | ~3.5:1 | `#9CA3AF` |
| 🟢 LOW | `.preview-detail-label` | `#6B7280` (gray) | `#111916` | ~4.5:1 | Keep or `#9CA3AF` |
| 🟢 LOW | `.detail-label` | `#6B7280` | `#111916` | ~4.5:1 | Keep |
| 🟢 LOW | `.stock-label` | `#6B7280` | `#111916` | ~4.5:1 | Keep |
| 🟢 LOW | `.date-label` | `#9CA3AF` | `#111916` | ~5.5:1 | Keep (good) |
| 🟢 LOW | `.footer-label` | `#86EFAC` (but already has override) | `#111916` | ~3.5:1 | `#9CA3AF` (update existing override) |
| 🟢 LOW | `.discount-label-modern` | `#86EFAC` | `#111916` | ~3.5:1 | `#9CA3AF` (update existing override) |
| 🟢 LOW | `.balance-label` | `#bfdbfe` (hardcoded blue) | `#1F2937` | ~4:1 | Add dark override |
| 🟢 LOW | `.miw-customer-info-label` | `#1e40af` (hardcoded blue) | `#111916` | ~3:1 | Add dark override |

---

## Fix Plan

### Fix 1: Add `--hover-bg` to dark-mode.css Variables

Add to the `html.dark {}` variables block:
```css
--hover-bg: #1A2820;   /* matches --neutral-50 */
```

### Fix 2: Restructure Button Dark Mode (lines 3027-3051)

Replace the broad catch-all with targeted, non-conflicting rules using hardcoded dark charcoal for secondary buttons.

### Fix 3: Consolidate Label Color Rules

**Remove all existing conflicting label overrides** (at lines ~555, 658, 832, 893, 929, 998, 1348, 1657, 2060, 2098, 2202) and replace with one unified section:

```css
/* ============================================
   LABEL & STAT TEXT DARK MODE — CONSOLIDATED
   All label color overrides in one place
   ============================================ */

/* VALUES — most prominent, off-white */
html.dark .stat-value,
html.dark .summary-value,
html.dark .preview-stat-value,
html.dark .kpi-value {
  color: #F9FAFB !important;
}

/* LABELS — secondary info, medium gray */
html.dark .stat-label,
html.dark .summary-label,
html.dark .preview-stat-label,
html.dark .kpi-label,
html.dark .quick-stat-label,
html.dark .section-label-modern,
html.dark .discount-label-modern,
html.dark .footer-label,
html.dark .payment-summary-item,
html.dark .miw-label,
html.dark .miw-step-label,
html.dark .miw-footer-label,
html.dark .miw-summary-label,
html.dark .miw-sheet-section-title,
html.dark .status-card .status-label,
html.dark .info-text .info-label,
html.dark .setting-label,
html.dark .total-label,
html.dark .quick-access-label {
  color: #9CA3AF !important;  /* medium gray — WCAG AA on #111916 */
}

/* FORM LABELS — lighter gray for readability */
html.dark .form-label,
html.dark .checkbox-label,
html.dark .payment-method-field label,
html.dark .edit-payment-form .form-group label,
html.dark .login-page .form-group label {
  color: #D1D5DB !important;
}

/* LOGIN PAGE SPECIFIC LABELS — same issue as form labels */
html.dark .login-footer strong {
  color: #D1D5DB !important;
}

/* GENERIC label element */
html.dark label {
  color: #D1D5DB !important;
}

/* HARDCODED COLOR OVERRIDES — fix specific page-level hardcoded labels */
html.dark .balance-label {
  color: #93C5FD !important;  /* lighter blue for dark mode */
}

html.dark .miw-customer-info-label {
  color: #93C5FD !important;
}

/* WAREHOUSE & EMPTY STATE LABELS — no override existed */
html.dark .warehouse-label,
html.dark .no-results p {
  color: #9CA3AF !important;
}
```

### Fix 4: Fix TopMenu Dropdown Colors

Update `TopMenu.css` dark mode section:
- Dropdown background: `#1F2937` (card-like dark bg)
- Dropdown item text: `#D1D5DB` (light gray, readable)
- Dropdown item hover: background `#374151`, color `#F9FAFB`

### Fix 5: Fix DropdownMenu (3-dot) + SearchModal Close Button Dark Mode

Add dark mode overrides to `DropdownMenu.css` or `dark-mode.css`.

For the **SearchModal close button hover**, this uses `var(--bg-light)` (not `var(--hover-bg)`), so it needs its own override:
```css
html.dark .search-modal-close-btn:hover {
  background: var(--hover-bg, #1A2820) !important;
  color: var(--text-primary) !important;
}
```
This also applies to any other elements that use `var(--bg-light)` for hover states.

For the **SearchModal category headers** and **footer**, they use `var(--bg-light)` as a static background (not hover). In dark mode `--bg-light = #0A0F0D` is darker than the modal's cards — this is intentional for visual hierarchy and should be kept.

### Fix 6: Remove Wildcard / Duplicate Rules

Remove `[class*="stat-card"]` / `[class*="summary-card"]` wildcard selectors (~lines 3011-3018).

---

## Files to Modify

| File | Changes |
|------|---------|
| `client/src/assets/styles/dark-mode.css` | (1) Add `--hover-bg`; (2) Consolidate all label rules (remove ~15 scattered overrides, add unified section); (3) Restructure button section (~lines 3027-3051); (4) Remove wildcard `[class*="stat-card"]`; (5) Add DropdownMenu + warehouse label overrides |
| `client/src/components/layout/TopMenu.css` | Update dropdown background/text/hover colors in dark mode section |
| `client/src/components/common/DropdownMenu.css` | Add dark mode overrides for trigger hover, content bg, menu item hover |

---

## Context Coverage — All Label Types Audited

| Label Class | Source File(s) | Dark Mode Lines | Current Value | Fix Value | Priority |
|-------------|---------------|----------------|---------------|-----------|----------|
| `.stat-label` | `stat-card.css`, `CustomerDetailPage.css`, `reports.css`, `inventory.css` | 555, 832, 998, 1657 | `#86EFAC` (conflicting) | `#9CA3AF` | HIGH |
| `.summary-label` | `summary-card.css`, `SalesPage.css` | 893 | `#86EFAC` | `#9CA3AF` | HIGH |
| `.preview-stat-label` | `ItemPreview.css`, `InvoicePreview.css`, `SalesPreview.css`, 10+ compact cards | 658, 929 | `#86EFAC` (conflicting) | `#9CA3AF` | HIGH |
| `.kpi-label` | `Dashboard.css`, `DemandForecast.css` | 1348 | `#86EFAC` | `#9CA3AF` | HIGH |
| `.quick-stat-label` | `CustomerDetailPage.css` | **MISSING** | Fallback `#94A3B8` | `#9CA3AF` | HIGH |
| `.section-label-modern` | `SalesInvoicePage.css` | 2060 | `#86EFAC` | `#9CA3AF` | HIGH |
| `.discount-label-modern` | `SalesInvoicePage.css` | 2098 | `#86EFAC` | `#9CA3AF` | MEDIUM |
| `.footer-label` | `SalesInvoicePage.css` | 2202 | `#86EFAC` | `#9CA3AF` | MEDIUM |
| `.payment-summary-item` | `SalesInvoicePage.css` | **MISSING** | `#86EFAC` | `#9CA3AF` | MEDIUM |
| `.miw-label` | `invoice.css` | **MISSING** | `#86EFAC` | `#9CA3AF` | MEDIUM |
| `.miw-step-label` | `invoice.css` | **MISSING** | `#D1FAE5` | `#9CA3AF` | CRITICAL |
| `.miw-footer-label` | `invoice.css` | **MISSING** | `#D1FAE5` | `#9CA3AF` | CRITICAL |
| `.miw-summary-label` | `invoice.css` | **MISSING** | `#D1FAE5` | `#9CA3AF` | CRITICAL |
| `.form-label` | `form.css` | **MISSING** | CSS var fallback | `#D1D5DB` | MEDIUM |
| `.checkbox-label` | `form.css` | **MISSING** | CSS var fallback | `#D1D5DB` | MEDIUM |
| `.balance-label` | `SalesInvoicePage.css` | **MISSING** | `#bfdbfe` hardcoded | `#93C5FD` | LOW |
| `.warehouse-label` | `StockMovementPage.css` | **MISSING** | `#A7F3D0` | `#9CA3AF` | MEDIUM |
| `.no-results p` | `ItemsPage.css` | **MISSING** | `#A7F3D0` | `#9CA3AF` | LOW |
| `.setting-label` | `CustomerDetailPage.css` | **MISSING** | `#86EFAC` | `#9CA3AF` | MEDIUM |
| `.total-label` | `CustomerDetailPage.css` | **MISSING** | `#86EFAC` | `#9CA3AF` | MEDIUM |
| `.quick-access-label` | `CustomerDetailPage.css` | **MISSING** | `#86EFAC` | `#9CA3AF` | MEDIUM |
| `.info-text .info-label` | `CustomerDetailPage.css` | **MISSING** | `#94A3B8` | `#9CA3AF` | MEDIUM |
| `.status-card .status-label` | `CustomerDetailPage.css` | **MISSING** | `#86EFAC` | `#9CA3AF` | MEDIUM |
| `.payment-method-field label` | `SalesInvoicePage.css` | **MISSING** | `#86EFAC` | `#D1D5DB` | MEDIUM |
| `.edit-payment-form .form-group label` | `CustomerDetailPage.css` | **MISSING** | `#ECFEED` | `#D1D5DB` | LOW |
| `label` (generic) | — | 86 | `#F9FAFB` | `#D1D5DB` | LOW |

---

## Testing / Verification

### Per-Page Checklist

1. **Sales Invoice Page** (full page + mobile wizard):
   - [ ] `.section-label-modern` → `#9CA3AF` (medium gray)
   - [ ] `.date-label` → `#9CA3AF` (medium gray)
   - [ ] `.footer-label` → `#9CA3AF` (medium gray)
   - [ ] `.discount-label-modern` → `#9CA3AF` (medium gray)
   - [ ] `.payment-summary-item` → `#9CA3AF` (medium gray)
   - [ ] `.miw-step-label` → `#9CA3AF` (was `#D1FAE5` — CRITICAL FIX)
   - [ ] `.miw-footer-label` → `#9CA3AF` (was `#D1FAE5` — CRITICAL FIX)
   - [ ] `.miw-summary-label` → `#9CA3AF` (was `#D1FAE5` — CRITICAL FIX)
   - [ ] `.payment-method-field label` → `#D1D5DB`

2. **Customer Detail Page**:
   - [ ] `.quick-stat-label` → `#9CA3AF` (was missing — NEW)
   - [ ] `.status-card .status-label` → `#9CA3AF` (was missing)
   - [ ] `.info-text .info-label` → `#9CA3AF` (was missing)
   - [ ] `.setting-label` → `#9CA3AF` (was missing)
   - [ ] `.total-label` → `#9CA3AF` (was missing)
   - [ ] `.quick-access-label` → `#9CA3AF` (was missing)

3. **Inventory Pages**:
   - [ ] `.preview-stat-label` → `#9CA3AF` (was `#86EFAC` conflicting)
   - [ ] `.preview-stat-value` → `#F9FAFB` (should keep near-white)
   - [ ] `.warehouse-label` → `#9CA3AF` (was missing)
   - [ ] `.no-results p` → `#9CA3AF` (was missing)

4. **Login Page**:
   - [ ] `.form-group label` → `#D1D5DB` (was `#ECFEED` — light green)
   - [ ] `.login-footer strong` → `#D1D5DB` (was `#ECFEED` — light green)
   - [ ] `.login-card` background — should be dark-mode card color, not light

5. **Search Modal**:
   - [ ] Close button hover background → `#1A2820` (was `#0A0F0D` — near-invisible)
   - [ ] Item hover uses `var(--primary)` (green background + white text) — should remain readable
   - [ ] Category header background (`var(--bg-light)`) — OK as-is (intentionally darker separator)

6. **Sidebar (side-benefit)**:
   - [ ] Nav item hover → `#1A2820` (automatically fixed by `--hover-bg`)
   - [ ] User avatar background — `var(--primary)` with `color: white` — OK

7. **General**:
   - [ ] All labels visually distinct from values
   - [ ] No remaining light-green labels (except semantic colors like success)
   - [ ] Light mode unaffected

---

## Color Palette Reference (Dark Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `--hover-bg` | `#1A2820` | (new) All hover states |
| `--primary` | `#10B981` | Primary buttons, accents |
| `--card-bg` | `#111916` | Card/dropdown backgrounds |
| **Values** | `#F9FAFB` | `.stat-value`, `.summary-value`, `.preview-stat-value` |
| **Labels** | `#9CA3AF` | All stat/section/meta labels (was light green) |
| **Form labels** | `#D1D5DB` | `.form-label`, `<label>`, payment form labels |
| **Secondary btn** | `#374151` bg / `#F9FAFB` text | `.btn-secondary` |
| **Dropdown text** | `#D1D5DB` | Dropdown item text |
| **Dropdown bg** | `#1F2937` / `#374151` border | TopMenu + DropdownMenu |

---

## Implementation Order

1. Add `--hover-bg` variable to `html.dark {}` block (~line 13)
2. Consolidate label rules — remove conflicting duplicates and add unified set (currently scattered across lines 530-2200, consolidate at end)
3. Restructure button dark mode (~lines 3027-3051)
4. Remove wildcard `[class*="stat-card"]` / `[class*="summary-card"]` rule (~lines 3011-3018)
5. Add DropdownMenu dark mode overrides to dark-mode.css
6. Update `TopMenu.css` dark mode dropdown colors (~lines 339-350)
7. Verify all priority labels on Sales Invoice, Customer Detail, and Inventory pages
8. Run type checks and test in browser
