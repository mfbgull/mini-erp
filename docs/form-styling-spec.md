# Form Input Visibility & Styling Spec

## Problem Statement

Form input fields in modals and pages across the entire app have the **same background color as their parent container**, making them visually indistinguishable. The user cannot tell where an input field begins or ends because inputs inherit the container's background color instead of having their own distinct background.

### Root Cause

The `form.css` stylesheet defines `.form-input`, `.form-select`, and `.form-textarea` **without an explicit `background-color`**. Since the modal container (`.modal-container`) uses `background: var(--neutral-100)` (#F3F4F6 — light gray), inputs inside the modal inherit this same gray background, becoming invisible against it.

The theme already defines `--input-bg: #FFFFFF` in `variables.css` but this variable was **never applied** to form elements.

---

## Scope

- **Affected components**: ALL form inputs across the entire app (employee forms, invoice forms, purchase forms, expense forms, settings forms, etc.)
- **Affected element types**: `.form-input`, `.form-select`, `.form-textarea` (text, number, email, password, date inputs, dropdowns, text areas)
- **Fix location**: Global fix in `client/src/styles/components/form.css` — single change fixes all forms app-wide

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Background variable | `--input-bg` (#FFFFFF) | Already defined in variables.css, just unused |
| Visual style | White with subtle border | Matches modern SaaS patterns (Supabase, Linear) |
| Focus ring | Keep current emerald ring | Current `box-shadow: 0 0 0 3px var(--primary-100)` looks good |
| Dark mode | Plan for it (use CSS variables) | Inputs should use `var(--input-bg)` so dark mode can override |
| Accessibility | Visual distinction, no formal WCAG compliance | Make inputs visually distinguishable |

---

## Implementation

### Change 1: Global form input styling (primary fix)

**File:** `client/src/styles/components/form.css`

**Before:**
```css
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #DEE2E6;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}
```

**After:**
```css
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #DEE2E6);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: inherit;
  background-color: var(--input-bg, #ffffff);
  color: var(--text-primary, #1f2937);
  transition: border-color 0.2s, box-shadow 0.2s;
}
```

**Key changes:**
- Add `background-color: var(--input-bg, #ffffff)` — makes inputs white and distinct from gray backgrounds
- Add `color: var(--text-primary, #1f2937)` — ensures dark text for readability
- Replace hardcoded `border: 1px solid #DEE2E6` with `border: var(--border-color, #DEE2E6)` for dark mode readiness

### Change 2: Dark mode override (future-proofing)

**File:** `client/src/styles/variables.css` (or a future dark-mode CSS file)

```css
/* Dark mode variable overrides */
[data-theme="dark"] {
  --input-bg: #1a1a2e;
  --card-bg: #16213e;
  --text-primary: #e2e8f0;
  --border-color: #334155;
}
```

---

## Affected Elements Audit

| Element Type | Selector | Current State | After Fix |
|-------------|----------|---------------|-----------|
| Text input | `.form-input` | No background → inherits gray | White background via `--input-bg` |
| Number input | `.form-input` | No background → inherits gray | White background via `--input-bg` |
| Email input | `.form-input` | No background → inherits gray | White background via `--input-bg` |
| Password input | `.form-input` | No background → inherits gray | White background via `--input-bg` |
| Date input | `.form-input` | No background → inherits gray | White background via `--input-bg` |
| Select dropdown | `.form-select` | No background → inherits gray | White background via `--input-bg` |
| Textarea | `.form-textarea` | No background → inherits gray | White background via `--input-bg` |
| Disabled inputs | `.form-input:disabled` | `background: var(--neutral-50)` | Already correct (grayed out) |
| Searchable select | `.searchable-select-input` | `background-color: white` (hardcoded) | Already works (but should use `--input-bg`) |

---

## Focus & Interaction States

| State | Current Styling | Action |
|-------|----------------|--------|
| Default | Gray background, light border | ✅ Fix: White background |
| Focus | `border-color: var(--primary-500); box-shadow: 0 0 0 3px var(--primary-100)` | ✅ Keep as-is |
| Disabled | `background: var(--neutral-50); opacity: 0.6` | ✅ Already correct |
| Error | `border-color: var(--error)` | ✅ Already correct |

---

## Files to Modify

1. **`client/src/styles/components/form.css`** — Primary fix (add `background-color` and `color`)
2. **`client/src/styles/variables.css`** — Dark mode variable overrides (future)
3. **`client/src/pages/employees/EmployeesPage.css`** — Revert any employee-specific overrides added earlier
4. **`client/src/components/common/FormInput.tsx`** — No changes needed (already uses CSS classes)

---

## Testing Checklist

- [ ] Open the employee edit modal — inputs should be white against gray background
- [ ] Open any other modal (create invoice, create purchase, add expense) — same result
- [ ] Tab through input fields — focus ring should still work (emerald ring)
- [ ] Check disabled inputs — should still be grayed out
- [ ] Check select dropdowns — should have white background
- [ ] Check textareas — should have white background
- [ ] Check date inputs — should have white background
- [ ] Check dark mode (if implemented) — inputs should use dark background

---

## Success Criteria

1. All form input fields are visually distinct from their parent container background
2. Inputs have white background with visible border in both modal and page contexts
3. Focus, disabled, and error states continue to work correctly
4. CSS variables are used consistently for dark mode readiness
5. No visual regressions across other forms in the app
