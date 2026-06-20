# Remaining Tasks — Mini ERP

**Created:** 2026-06-20
**Status:** Post-audit cleanup complete. These tasks remain.

---

## Context

Today's session completed:
- Ponytail audit: 8/10 phases (Type consolidation and UI consolidation deferred)
- Full codebase audit: 45 bugs found, 12 fixed (P0 + P1 + P2)
- Data cleanup: Corrupted stock movements, ledger entries, negative stock fixed
- Smoke test: 137 tests passing, all data integrity checks clean
- 35 commits pushed to origin/main

---

## Phase 7: Consolidate Duplicate Type Files

**Risk:** HIGH | **Effort:** 2+ hours | **Priority:** P3

**Status:** ✅ COMPLETE

**What:** 24 `*Types.ts` files in `client/src/utils/` (~1,847 lines) duplicate type definitions. Consolidate into a single source of truth.

**Approach:**
1. Pick ONE entity type (e.g., `customerTypes.ts` — 13 imports)
2. Read both the local file and `client/src/types/index.ts`
3. Ensure the shared types file has the correct definition
4. Update all 13 imports to point to `client/src/types/index.ts`
5. Delete `client/src/utils/customerTypes.ts`
6. Run typecheck
7. Repeat for each remaining type file (one at a time!)

**Files to touch:**
- Delete: All 24 `client/src/utils/*Types.ts` files
- Consolidate: `client/src/types.ts` + `client/src/types/index.ts` → one file

**Blocked by:** Nothing — just high risk. Do one file at a time with typecheck after each.

---

## Phase 10: Consolidate Duplicate UI Components

**Risk:** HIGH | **Effort:** 3+ hours | **Priority:** P3

**Status:** PARTIAL — EditableCell consolidated (4 files → 1 generic + 4 wrappers). Remaining 3 types deferred.

**What was done:**
- Created `components/shared/GenericEditableCell.tsx` with unified keyboard navigation and editing logic
- Updated InvoiceEditableCell, QuotationEditableCell, PurchaseOrderEditableCell, SalesOrderEditableCell to be thin wrappers (~15 lines each)
- ~700 lines of duplicated logic reduced to ~235 lines

**Why FormHeader, SearchableCell, ItemsTable were NOT consolidated:**
- **FormHeader**: Invoice is completely different (no status, no company info, no warehouse, no total). Quotation/PO/SO share structure but have different prop naming conventions (onBack vs onCancel, soDate vs poDate vs quotationDate) and different child-wrapping patterns. A generic would need 20+ props with conditionals.
- **SearchableCell**: Different filtering logic (invoice filters raw materials, quotation uses imported utility), different prop interfaces, Quotation exports a separate sub-component. Focus behavior differs (direct call vs setTimeout/DOM query).
- **ItemsTable**: Each entity has unique column definitions, calculation functions, and callback signatures. Too many entity-specific differences.

**Recommendation:** Keep the remaining 3 component types as-is. The EditableCell consolidation provides the best ROI. Further consolidation would create components harder to maintain than the current duplicates.

---

## P3 Audit Bugs (Low Priority)

**Risk:** LOW | **Effort:** 2+ hours | **Priority:** P3

**Status:** ✅ ALL FIXED

| # | Bug | Fix |
|---|-----|-----|
| 1 | No input validation on Invoice.create | Added validation for customer_id, invoice_date, items |
| 2 | No input validation on Purchase.recordPurchase | Added validation for item_id, warehouse_id, quantity, unit_cost, purchase_date |
| 3 | No input validation on MobileInvoice.submitInvoice | Added validation for customer_id, invoice_date, items |
| 4 | Activity log outside transaction (Purchase.delete) | Moved inside transaction |
| 5 | Activity log outside transaction (Production.delete) | Moved inside transaction |
| 6 | Dashboard stock value ignores batch costing | Changed to query stock_batches |
| 7 | SQL injection via string interpolation in sequence.ts | Added table/column whitelist |
| 8 | Silent decryption failure in encryption.ts | Added error logging |
| 9 | Invoice number collision in MobileInvoice | Added random suffix |
| 10 | Non-atomic bulk balance recalculation | Wrapped in transaction |

---

## Recommended Order

```
Session 1: P3 audit bugs (#4, #5, #10 — quick wins) ✅
Session 2: P3 audit bugs (#1, #2, #3 — input validation) ✅
Session 3: P3 audit bugs (#6, #7, #8, #9 — misc fixes) ✅
Session 4: Phase 7 — Type consolidation (one file at a time, 2+ hrs) ✅
Session 5: Phase 10 — UI component consolidation (EditableCell done, others deferred) ✅

**Total remaining:** None — all actionable tasks complete.

---

## What NOT to Do

- **Don't refactor the model layer to a BaseModel pattern** — too risky for the benefit
- **Don't remove RBAC** — it's working, comprehensive, and 243 usages
- **Don't remove the i18n system** — app supports English + Urdu
- **Don't touch the AG-Grid setup** — it's working correctly
- **Don't remove the chart libraries** — chart.js is used in 5+ files, recharts was removed

---

## Definition of Done

Each phase is complete when:
- [ ] All typecheck commands pass (`npm run typecheck`)
- [ ] All tests pass (`npm test`)
- [ ] Server builds successfully (`npm run build`)
- [ ] Smoke test passes (all data integrity checks clean)
- [ ] Visual inspection confirms no UI regressions
