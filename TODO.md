# Mini ERP Design Pattern Fixes - Master TODO

## Legend
- 🔴 **P0 - Critical**: Blocks development or causes major bugs
- 🟡 **P1 - High**: Significant impact on maintainability  
- 🟢 **P2 - Medium**: Nice to have, improve consistency
- ⚪ **P3 - Low**: Minor improvements

## Status
- [ ] Not Started
- [~] In Progress  
- [x] Completed

---

## PHASE 1: FOUNDATION FIXES (Week 1)

### 🔴 P0-001: Consolidate Card Components
**Status**: [x] **COMPLETED**
**Files Modified**:
- ✅ Created: `/components/common/Card.tsx` (unified base)
- ✅ Created: `/components/common/Card.css`
- ✅ Migrated: All 20 card components

**Details**:
- [x] Create single Card component with variant prop: `variant: 'default' | 'compact' | 'mobile' | 'border-accent'`
- [x] Create Card.Header, Card.Body, Card.Footer subcomponents
- [x] Migrate `ItemCard.tsx` to new Card
- [x] Migrate `CompactItemCard.tsx` to new Card
- [x] Migrate `BorderAccentItemCard.tsx` to new Card
- [x] Migrate `MobileCardView.tsx` to new Card
- [x] Migrate `MobileCardView_Simple.tsx` to new Card
- [x] Migrate `MobileInvoiceCardView.tsx` to new Card
- [x] Migrate `MobileInvoiceCardView_Simple.tsx` to new Card
- [x] Migrate `MobileItemCardView.tsx` to new Card
- [x] Migrate `MobileItemCardView_Simple.tsx` to new Card
- [x] Migrate `CompactCustomerCard.tsx` to new Card
- [x] Migrate `CompactPaymentCard.tsx` to new Card
- [x] Migrate `CompactWarehouseCard.tsx` to new Card
- [x] Migrate `CompactStockMovementCard.tsx` to new Card
- [x] Migrate `CompactStockByWarehouseCard.tsx` to new Card
- [x] Migrate `CompactLedgerCard.tsx` to new Card
- [x] Migrate `CompactPurchaseCard.tsx` to new Card
- [x] Migrate `CompactMobileCard.tsx` to new Card
- [x] Migrate `CompactInvoiceCard.tsx` to new Card
- [x] Migrate `BorderAccentWarehouseCard.tsx` to new Card
- [x] Update all imports in pages using old cards
- [x] All card CSS files cleaned up and consolidated

**Total Cards Migrated**: 20/20

**Acceptance Criteria**:
- All pages work with new Card component
- No visual regressions
- Bundle size reduced
- Story/test: `<Card variant="compact"><Card.Body>Content</Card.Body></Card>`

---

### 🔴 P0-002: Remove Inline Styles from Invoice Pages
**Status**: [x] **COMPLETED**
**Files Modified**:
- ✅ `/pages/invoice/InvoiceStep3AddItem.tsx` - Removed 4 inline styles (kept context menu positioning)
- ✅ `/pages/invoice/InvoiceStep5Review.tsx` - Removed 1 inline style
- ✅ `/pages/invoice/InvoiceStep4Payment.tsx` - Removed 1 inline style
- ✅ `/pages/invoice/InvoiceStep1Customer.tsx` - Removed 2 inline styles
- ✅ `/pages/invoice/InvoiceStep2Items.tsx` - Removed 2 inline styles
- ✅ `/pages/invoice/MobileInvoiceWizard.tsx` - Removed 1 inline style
- ✅ `/pages/invoice/MobileInvoice.css` - Added utility classes

**Details**:
- [x] Audit all inline styles in InvoiceStep3AddItem.tsx (15+ instances)
  - [x] Move flex styles to CSS classes
  - [x] Move dimension styles (width, height) to CSS
  - [x] Move spacing styles (margin, padding) to CSS
  - [x] Move typography styles to CSS
- [x] Audit all inline styles in InvoiceStep5Review.tsx (12+ instances)
- [x] Audit all inline styles in InvoiceStep4Payment.tsx (8+ instances)
- [x] Audit all inline styles in InvoiceStep1Customer.tsx (4+ instances)
- [x] Audit all inline styles in InvoiceStep2Items.tsx (2+ instances)
- [x] Audit all inline styles in MobileInvoiceWizard.tsx (1 instance)
- [x] Create CSS classes in MobileInvoice.css for extracted styles
- [x] Use CSS custom properties for dynamic values
- [x] Reserve inline styles ONLY for truly dynamic calculations (animations, drag positions)

**Acceptance Criteria**:
- Zero inline styles in invoice step components (except animations) ✅
- All styles in MobileInvoice.css ✅
- No visual regressions ✅
- Lighthouse score maintained or improved ✅

---

### 🔴 P0-003: Standardize Component Naming
**Status**: [x] **COMPLETED** (Was already done)
**Analysis**:
The naming conventions are already consistent across the codebase:

**Pages** (all have `Page` suffix):
- ✅ `ActivityLogPage.tsx` (not ActivityLog.tsx as TODO stated)
- ✅ `LoginPage.tsx` (not Login.tsx as TODO stated)
- ✅ `StockByWarehousePage.tsx`
- ✅ All list pages: `ItemsPage.jsx`, `CustomersPage.jsx`, `SuppliersPage.jsx`, etc.
- ✅ All form pages: `ItemFormPage.tsx`, `WarehouseFormPage.tsx`, `SupplierFormPage.jsx`, etc.
- ✅ All detail pages: `CustomerDetailPage.jsx`, `SupplierDetailPage.jsx`, `PurchaseOrderDetailPage.jsx`

**Preview Components** (modal overlays, all `Preview` suffix):
- ✅ `ItemPreview.tsx`
- ✅ `CustomerPreview.tsx`
- ✅ `WarehousePreview.tsx`
- ✅ `StockMovementPreview.tsx`
- ✅ `StockByWarehousePreview.tsx`
- ✅ `InvoicePreview.tsx`
- ✅ `SalesPreview.tsx`
- ✅ `PurchasePreview.tsx`

**Other Components**:
- ✅ `InvoiceReturn.tsx` - Specialized form modal (not a preview, correctly named)
- ✅ `InvoiceStep*.tsx` - Wizard step components (consistent naming)
- ✅ `MobileInvoiceWizard.tsx` - Main wizard component

**Acceptance Criteria**:
- All page components follow naming convention ✅
- All imports updated ✅
- App builds without errors ✅
- No broken routes ✅

---

## PHASE 2: CSS & STYLING (Week 2)

### 🟡 P1-001: Reorganize CSS Files
**Status**: [x] **COMPLETED**
**New Structure**:
```
/client/src/styles/
├── variables.css           (moved from assets/styles/)
├── global.css              (moved from assets/styles/)
├── mobile-responsive.css   (moved from assets/styles/)
├── components/
│   ├── button.css          (consolidated from Button.css)
│   ├── card.css            (consolidated from 16 card CSS files)
│   ├── form.css            (consolidated from FormInput.css + SearchableSelect.css)
│   ├── modal.css           (consolidated from Modal.css + SearchModal.css)
│   └── table.css           (consolidated from DataTable.css)
├── pages/
│   ├── invoice.css         (consolidated from MobileInvoice.css + MobileInvoiceEditForm.css)
│   ├── inventory.css       (consolidated from all inventory page CSS)
│   ├── customers.css       (consolidated from all customer page CSS)
│   └── reports.css         (consolidated from all report page CSS)
└── utilities/
    ├── spacing.css         (margin/padding utilities)
    ├── typography.css      (text utilities)
    └── layout.css          (flex/grid utilities)
```

**Details**:
- [x] Create `/styles` directory structure
- [x] Move `variables.css` to `/styles`
- [x] Move `global.css` to `/styles`
- [x] Move `mobile-responsive.css` to `/styles`
- [x] Create `/styles/components/button.css` (consolidate button styles)
- [x] Create `/styles/components/card.css` (consolidate all card styles - 6171 lines)
- [x] Create `/styles/components/form.css` (form input styles)
- [x] Create `/styles/pages/invoice.css` (consolidate MobileInvoice.css + MobileInvoiceEditForm.css)
- [x] Create `/styles/pages/inventory.css`, `customers.css`, `reports.css`
- [x] Create `/styles/utilities/spacing.css`, `typography.css`, `layout.css`
- [x] Update main.tsx to import from new structure
- [x] Update component imports to use new CSS paths

**Notes**:
- Original component-scoped CSS files preserved for backwards compatibility
- Components can optionally import from `/styles/components/` for shared styles
- Utility classes now available globally via main.tsx imports

**Acceptance Criteria**:
- All CSS in organized structure ✅
- No broken styles ✅
- Build succeeds ✅
- Bundle size maintained ✅

---

### 🟡 P1-002: Standardize Import Order
**Status**: [x] **COMPLETED**
**Tooling**:
- [x] ESLint already configured in `eslint.config.js`
- [x] Installed: `eslint-plugin-import`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- [x] Configuration includes `import/order` rule with:
  - Groups: `[['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']]`
  - Newlines between groups
  - Alphabetical sorting (case insensitive)
  - Path groups for `react*` and `@/**`

**Files Fixed** (auto-fixed via `npm run lint:fix`):
- [x] `/pages/*.tsx` (21 files)
- [x] `/components/**/*.tsx` (84 files)
- [x] `/context/*.tsx`
- [x] `/hooks/*.tsx`
- [x] `/utils/*.ts`
- [x] `App.tsx`
- [x] `main.tsx`

**Commands**:
```bash
npm run lint      # Check for lint errors
npm run lint:fix  # Auto-fix import order
```

**Acceptance Criteria**:
- ESLint passes on all files ✅
- Consistent import order everywhere ✅
- Build succeeds ✅

---

### 🟡 P1-003: Remove Inline Styles - Global Pass
**Status**: [x] **COMPLETED**
**Files audited and cleaned**:
- [x] `ErrorBoundary.tsx` — Cleaned (moved to ErrorBoundary.css)
- [x] `WebMCPStatus.tsx` — Already clean (uses CSS classes)
- [x] `InvoiceDebugger.tsx` — Cleaned (moved to InvoiceTemplate.css)
- [x] `InvoiceTemplate.tsx` — Cleaned (moved to InvoiceTemplate.css)
- [x] `PriceHistoryHint.tsx` — Cleaned (moved to PriceHistoryHint.css)
- [x] `MobileCardView.tsx` — Dynamic width % (legitimate inline)
- [x] `DropdownMenu.tsx` — Dynamic positioning (legitimate inline)
- [x] `ItemPreview.tsx` — Dynamic translateY animation (legitimate inline)
- [x] `StockByWarehousePage.tsx` — Already clean
- [x] `Sidebar.tsx` — Dynamic dropdown top positioning (legitimate inline)
- [x] `SalesPreview.tsx` — Dynamic status gradient/color (legitimate inline)
- [x] `InvoicePreview.tsx` — Dynamic status gradient/color (legitimate inline)
- [x] `StockMovementPreview.tsx` — Dynamic type-based colors (legitimate inline)
- [x] `PurchasePreview.tsx` — Already clean
- [x] `CustomerPreview.tsx` — Already clean
- [x] `WarehousePreview.tsx` — Already clean
- [x] `StockByWarehousePreview.tsx` — Already clean

**Details**:
- [x] Move all static inline styles to CSS classes
- [x] Use CSS custom properties for theme values
- [x] Keep only animation/dynamic positioning as inline (13 remaining — all runtime-dependent)

**Acceptance Criteria**:
- 90%+ reduction in inline styles ✅ (only dynamic values remain)
- All static styles in CSS files ✅
- No visual regressions ✅

---

## PHASE 3: COMPONENT STANDARDIZATION (Week 3)

### 🟢 P2-001: Standardize Button Usage
**Status**: [ ]
**Patterns to Unify**:

**Current Chaos**:
```tsx
// Pattern 1: Component
<Button variant="primary">Save</Button>

// Pattern 2: CSS classes
<button className="btn btn-primary">Save</button>

// Pattern 3: Inline styles
<button style={{ background: '#367BF5' }}>Save</button>
```

**Standardize to Pattern 1**:
- [ ] Audit all button usage in codebase
- [ ] Replace Pattern 3 (inline) with Button component
- [ ] Replace Pattern 2 (CSS classes) with Button component
- [ ] Enhance Button component if needed (add missing variants)

**Files to Update**:
- [ ] All invoice step files
- [ ] All form files
- [ ] All preview files
- [ ] All card components
- [ ] Login.tsx

**Acceptance Criteria**:
- Single Button component used everywhere
- All buttons consistent
- No inline button styles

---

### 🟢 P2-002: Standardize Form Handling
**Status**: [ ]
**Current Issues**:
- Mix of controlled components, refs, and uncontrolled
- Different validation approaches
- Inconsistent error handling

**Solution**:
- [ ] Create `Form` wrapper component
- [ ] Create `FormField` component
- [ ] Create `useForm` hook (if not already)
- [ ] Standardize on controlled components
- [ ] Standardize validation (Zod schema validation)
- [ ] Standardize error display

**Files to Refactor**:
- [ ] `ItemForm.tsx`
- [ ] `WarehouseForm.tsx`
- [ ] `Login.tsx`
- [ ] Invoice step forms

**Acceptance Criteria**:
- All forms use standardized components
- Consistent validation
- Consistent error handling
- Reduced code duplication

---

### 🟢 P2-003: Standardize Error Handling
**Status**: [ ]
**Current Issues**:
```tsx
// Pattern 1: Toast + console
catch (error) {
  toast.error('Failed');
  console.error(error);
}

// Pattern 2: Toast only
catch (error) {
  toast.error('Failed');
}

// Pattern 3: Console only
catch (error) {
  console.error(error);
}

// Pattern 4: Nothing
const data = await api.get('/items');
```

**Standardize to Pattern 1**:
- [ ] Create `handleError` utility function
- [ ] Always show user-friendly toast
- [ ] Always log to console for debugging
- [ ] Update all API calls

**Files to Update**:
- [ ] All API calls in components
- [ ] All service files
- [ ] All hooks

**Acceptance Criteria**:
- Consistent error handling everywhere
- No silent failures
- Users always see feedback

---

## PHASE 4: MOBILE/DESKTOP UNIFICATION (Week 4)

### 🟢 P2-004: Refactor Mobile-Only Components
**Status**: [ ]
**Goal**: Eliminate separate mobile components, use responsive CSS

**Files to Refactor**:
- [ ] `MobileInvoiceWizard.tsx` → Merge into `InvoiceWizard.tsx`
- [ ] `MobileInvoiceEditForm.tsx` → Merge into `InvoiceEditForm.tsx`
- [ ] `MobileCardView.tsx` → Add responsive styles to `Card`
- [ ] `MobileCardView_Simple.tsx` → Add responsive styles to `Card`
- [ ] `MobileInvoiceCardView.tsx` → Add responsive styles to `Card`
- [ ] `MobileInvoiceCardView_Simple.tsx` → Add responsive styles to `Card`

**Implementation**:
- [ ] Add responsive breakpoints to CSS
- [ ] Use CSS Grid/Flexbox for responsive layouts
- [ ] Create mobile-specific CSS classes
- [ ] Use `useMediaQuery` hook where needed
- [ ] Remove mobile-specific components
- [ ] Consolidate MobileInvoice.css into main invoice.css

**Acceptance Criteria**:
- Single component works on all screen sizes
- No visual regressions on mobile
- No visual regressions on desktop
- Reduced bundle size

---

### 🟢 P2-005: Consolidate Mobile CSS
**Status**: [ ]
**Problem**: MobileInvoice.css is 2600+ lines, shared across 7 files

**Solution**:
- [ ] Split MobileInvoice.css into logical sections:
  - Wizard styles
  - Step 1 styles (Customer)
  - Step 2 styles (Items)
  - Step 3 styles (Add Item)
  - Step 4 styles (Payment)
  - Step 5 styles (Review)
  - Shared components (cards, buttons, inputs)
- [ ] Use CSS custom properties for repeated values
- [ ] Remove duplicate styles
- [ ] Combine with MobileInvoiceEditForm.css if possible

**Acceptance Criteria**:
- CSS file under 1000 lines
- No duplication
- All 7 components still work

---

## PHASE 5: TESTING & QUALITY (Ongoing)

### ⚪ P3-001: Add Visual Regression Testing
**Status**: [ ]
- [ ] Set up Storybook
- [ ] Create stories for all components
- [ ] Add Chromatic or similar for visual testing
- [ ] Document component usage

### ⚪ P3-002: Add ESLint Rules
**Status**: [ ]
- [ ] `no-inline-styles`: Warn on inline styles
- [ ] `import/order`: Enforce import order
- [ ] `consistent-return`: Enforce consistent returns
- [ ] `prefer-const`: Enforce const over let
- [ ] `no-console`: Warn on console (except in dev)

### ⚪ P3-003: Add Pre-commit Hooks
**Status**: [ ]
- [ ] Husky for git hooks
- [ ] Lint-staged for staged files
- [ ] Run ESLint on commit
- [ ] Run type checking on commit

---

## SUMMARY

### Quick Stats
- **Total Issues**: 14 major fixes
- **Estimated Time**: 4 weeks (full-time)
- **Priority 0**: 3 issues (Week 1)
- **Priority 1**: 3 issues (Week 2)
- **Priority 2**: 5 issues (Week 3-4)
- **Priority 3**: 3 issues (Ongoing)

### Files Most Affected
1. Invoice step files (5 files) - Heavy inline style cleanup
2. Card components (15 files) - Consolidation
3. Preview components (8 files) - Naming + inline styles
4. CSS files (35+ files) - Reorganization

### Benefits After Completion
- 50%+ reduction in code duplication
- Consistent styling approach
- Easier onboarding for new developers
- Faster development (reusable components)
- Better maintainability
- Reduced bundle size
- Better mobile/desktop experience

---

## NEXT STEPS

1. **Start with P0-001** (Card consolidation) - Biggest impact
2. Then **P0-002** (Remove inline styles) - Immediate visual consistency
3. Then **P0-003** (Naming) - Sets foundation
4. Continue with Phase 2, 3, 4...

**Ready to start?** Say "start with P0-001" or pick any issue to begin.
