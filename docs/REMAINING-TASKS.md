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

**What:** 16 component files (4x4 = EditableCell, SearchableCell, ItemsTable, FormHeader) across 4 entity types (~3,347 lines). Create generic versions.

**Approach:**
1. Start with `FormHeader` (simplest, ~110-164 lines each)
2. Create `client/src/components/shared/GenericFormHeader.tsx` with props for entity-specific config
3. Update one entity (e.g., invoice) to use it
4. Run typecheck + visual test
5. Migrate other 3 entities
6. Repeat for `EditableCell`, `SearchableCell`, `ItemsTable`

**Files to create:**
- `client/src/components/shared/GenericFormHeader.tsx`
- `client/src/components/shared/GenericEditableCell.tsx`
- `client/src/components/shared/GenericSearchableCell.tsx`
- `client/src/components/shared/GenericItemsTable.tsx`

**Files to update:**
- `client/src/components/invoice/*`
- `client/src/components/sales-order/*`
- `client/src/components/purchase-order/*`
- `client/src/components/quotation/*`

**Blocked by:** Nothing — but requires visual testing after each migration.

---

## P3 Audit Bugs (Low Priority)

**Risk:** LOW | **Effort:** 2+ hours | **Priority:** P3

**Remaining bugs from the codebase audit:**

| # | Bug | File | Effort |
|---|-----|------|--------|
| 1 | No input validation on Invoice.create | `Invoice.ts:539` | 30 min |
| 2 | No input validation on Purchase.recordPurchase | `Purchase.ts:58` | 30 min |
| 3 | No input validation on MobileInvoice.submitInvoice | `MobileInvoice.ts:193` | 20 min |
| 4 | Activity log outside transaction (Purchase.delete) | `Purchase.ts:537` | 5 min |
| 5 | Activity log outside transaction (Production.delete) | `Production.ts:568` | 5 min |
| 6 | Dashboard stock value ignores batch costing | `Dashboard.ts:26` | 30 min |
| 7 | SQL injection via string interpolation in sequence.ts | `sequence.ts:37` | 15 min |
| 8 | Silent decryption failure in encryption.ts | `encryption.ts:53` | 10 min |
| 9 | Invoice number collision in MobileInvoice | `MobileInvoice.ts:296` | 10 min |
| 10 | Non-atomic bulk balance recalculation | `customersController.ts:244` | 10 min |

---

## Recommended Order

```
Session 1: P3 audit bugs (#4, #5, #10 — quick wins, ~30 min)
Session 2: P3 audit bugs (#1, #2, #3 — input validation, ~1.5 hrs)
Session 3: P3 audit bugs (#6, #7, #8, #9 — misc fixes, ~1 hr)
Session 4: Phase 7 — Type consolidation (one file at a time, 2+ hrs)
Session 5: Phase 10 — UI component consolidation (one component at a time, 3+ hrs)
```

**Total estimated:** ~8 hours across 5 sessions

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
