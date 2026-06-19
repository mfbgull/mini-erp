# Remove Hardcoded Minus Sign from Paid/Returned Display

> **For Hermes:** Implement this plan directly — it's a 2-line change in 1 file.

**Goal:** Remove the hardcoded `-` prefix displayed before the Paid and Returned amounts on the invoice view page, since the minus sign has no role in calculations and confuses users.

**Current state:** `InvoiceTemplate.tsx` lines 394 and 399 render Paid and Returned with a hardcoded `-` prefix:
```tsx
<span>-{formatCurrency(safeParseFloat(invoice.paid_amount || 0))}</span>
```
This is purely cosmetic — the balance is computed server-side and served as `balance_amount` in the API response. No calculation reads this minus sign.

**Verification target:** After the change, invoice 151 at `/sales/invoice/151/view` should show:
- Paid: `$1,500.00` (was `-$1,500.00`)
- Returned: `$3,000.00` (was `-$3,000.00`)

---

## Task: Remove `-` from Paid and Returned spans

**Objective:** Strip the hardcoded `-` from the formatCurrency call on two lines.

**Files:**
- Modify: `client/src/components/invoice/InvoiceTemplate.tsx:394` (remove `-`)
- Modify: `client/src/components/invoice/InvoiceTemplate.tsx:399` (remove `-`)

**Step 1: Edit line 394**

Current:
```tsx
                <span>-{formatCurrency(safeParseFloat(invoice.paid_amount || 0))}</span>
```
Change to:
```tsx
                <span>{formatCurrency(safeParseFloat(invoice.paid_amount || 0))}</span>
```

**Step 2: Edit line 399**

Current:
```tsx
                  <span>-{formatCurrency(safeParseFloat(invoice.returned_amount))}</span>
```
Change to:
```tsx
                  <span>{formatCurrency(safeParseFloat(invoice.returned_amount))}</span>
```

**Step 3: Build & verify**

Run `npm run build` in the client directory (or the root project build command). Then check the invoice view page for correctness.

Run: `cd /home/fawad/ai/minierp/client && npm run build`
Expected: TypeScript compilation succeeds, no errors.

**Step 4: Visual verification**

Navigate to `http://localhost:3010/sales/invoice/151/view` and confirm:
- Paid shows `$1,500.00` (not `-$1,500.00`)
- Returned shows `$3,000.00` (not `-$3,000.00`)
- Balance Due remains `$0.00`
- All other formatting intact

---

## Validation

- [ ] Lines 394 and 399 changed
- [ ] TypeScript build passes with no errors
- [ ] Paid amount shows without minus sign on invoice view
- [ ] Returned amount shows without minus sign on invoice view
- [ ] Balance, Subtotal, Total, and item rows unaffected

## Risks / Notes

- This is a pure display change. No backend, DB, or calculation logic is touched.
- The minus sign is only in `InvoiceTemplate.tsx`. Other components (`StickyFooter.tsx`, `InvoicePreview.tsx`, `CompactInvoiceCard.tsx`) already show amounts without a minus sign, so this change makes the template consistent with the rest of the app.
- The balance remains zero: the `balance_amount` is computed as `MAX(0, total - paid - returned)` on the server, so removing the display minus has zero impact on correctness.
