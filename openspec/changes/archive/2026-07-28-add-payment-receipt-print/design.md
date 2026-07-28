## Context

Currently, payments are recorded via `PaymentModal.tsx` (in the customer detail flow and standalone payments page). After a payment is created, the modal simply closes with a success toast — there's no option to print a receipt. The existing invoice print system in `InvoiceViewPage.tsx` provides a proven pattern:

- **A4 printing**: `window.print()` with `@media print` CSS styles
- **Thermal printing**: Opens a new popup window, renders `ThermalInvoiceTemplate` into it, calls `window.print()` then closes

This design follows the same pattern for receipts, keeping things simple and consistent.

## Goals / Non-Goals

**Goals:**
- Print a payment receipt immediately after recording a payment in `PaymentModal`
- Print a receipt for any existing payment from the payments list (desktop AG Grid + mobile CompactCard)
- Two formats: A4 receipt and thermal/printer-friendly receipt (matching existing invoice pattern)
- Backend endpoint to serve enriched receipt data

**Non-Goals:**
- No PDF download (the existing pattern uses print via browser — PDF is a separate concern)
- No email receipt (out of scope — could be added later)
- No receipt template customization UI (static templates are fine)
- No receipt history or re-printing tracking (the payment itself is the record)

## Receipt Data Shape

The receipt MUST show the customer's balance trail:

| Field | Source | Calculation |
|---|---|---|
| **Previous Balance** | Balance before this payment | `customer.current_balance` (after payment) + `payment.amount` — since payment reduces what customer owes |
| **Payment Amount** | The payment itself | `payment.amount` |
| **New Balance** | Balance after this payment | `customer.current_balance` (already updated by the transaction) |
| **Customer Name** | Customer record | `customer.customer_name` |
| **Payment Date** | The payment | `payment.payment_date` |
| **Payment No** | Receipt reference | `payment.payment_no` |
| **Allocated Invoices** | Which invoices this payment covers | From `payment_allocations` joined with `invoices` |

The backend receipt endpoint computes `previous_balance` as `current_balance + amount` since the payment has already been applied when the endpoint is called. This is a simple arithmetic that avoids an extra ledger query.

## Decisions

| Decision | Chosen Approach | Alternatives Considered |
|---|---|---|
| **Print method** | Same as invoices: `window.print()` + `@media print` CSS for A4; popup window for thermal. | Server-side PDF generation (jspdf) — adds complexity, the existing pattern works fine |
| **Receipt data** | Extend existing `GET /payments/:id` to include a `receipt` view, or create a new `GET /payments/:id/receipt` endpoint | Using existing endpoint with `?view=receipt` param — cleaner to have a dedicated endpoint that returns exactly what the receipt needs |
| **Component location** | `client/src/components/payment/` — new folder parallel to `invoice/` | Could put in `invoice/` but payments are distinct domain |
| **Thermal template approach** | Same popup pattern as `InvoiceViewPage.handlePrintReceipt()` — open window, render React into it, print, close | iframe approach — popup is simpler and proven |
| **Receipt number** | Use existing `payment_no` (e.g., `PAY001`) as the receipt reference | No separate receipt numbering needed |

## Risks / Trade-offs

- **[Popup blocker]** Thermal print opens a popup — browsers may block it. Mitigation: trigger from a direct user click (not async after mutation completes), or show a notice if popup is blocked.
- **[Print after mutation]** After recording payment, the mutation success callback needs to trigger print. The payment ID is available in the mutation response. Mitigation: fetch receipt data via `GET /payments/:id/receipt` using `useQuery`, then render.
- **[Balance calculation]** The receipt needs `previous_balance` which must be derived since the payment is already recorded. Mitigation: use `customer.current_balance + payment.amount` — simple and reliable as long as no concurrent payments modify the balance between the payment creation and the receipt fetch. For this app's usage (single-user/SMB), that's fine.
- **[CSS duplication]** Receipt CSS will partly duplicate invoice print CSS. Mitigation: extract shared print styles into a shared CSS file if duplication becomes significant, but accept some duplication for now (YAGNI).
