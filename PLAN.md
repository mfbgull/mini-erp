# Plan: Return Disposition Options for Invoice Returns

## Context

When a return is processed on a fully paid invoice (e.g., INV-2026-593336: $2,000 paid, then $1,000 return), the current system simply creates a ledger credit and adjusts the invoice balance, leaving the balance negative (-$1,000). There is no user-facing choice about what to do with the returned amount.

This plan adds three disposition options at return time:
1. **Refund to customer** — create a cash refund (negative payment) for the returned amount
2. **Keep as customer credit** — add the amount as a credit on the customer's account for future invoices
3. **Adjust against unpaid invoices** — apply the credit to outstanding unpaid/partially-paid invoices for the same customer

## Approach

The return flow will be extended to:
1. **Backend**: Add a `disposition` field to the return API payload with one of `refund`, `credit`, or `adjust`. Depending on the choice, the backend will:
   - **refund**: Create a refund payment (a payment with negative amount or a new `REFUND` payment type), a ledger entry (credit), and an accounting entry (Dr AR / Cr Cash). Void or reduce the original payment allocation by the returned amount.
   - **credit**: Update the customer's `current_balance` as a positive credit (reducing what they owe or creating a credit balance). Add a ledger entry.
   - **adjust**: Find unpaid/partially-paid invoices for the customer and apply the credit as a payment allocation across them. Create payment allocations, update invoice balances, create ledger entries and accounting entries.

2. **Frontend**: Add a radio/option selector in the return modal asking how to handle the return amount. Conditionally show relevant sub-forms (e.g., invoice selection for "adjust").

## Files to Modify

| File | What Changes |
|---|---|
| `server/src/controllers/invoiceController.ts` | Extend `returnInvoiceItems` to accept `disposition` and branch logic |
| `server/src/models/Invoice.ts` | Add helper methods for refund, credit, and adjust operations |
| `server/src/models/Payment.ts` | Add `createRefundPayment` method |
| `server/src/services/accountingService.ts` | Add `postRefundEntry` for refund GL posting |
| `server/src/utils/ledgerUtils.ts` | May need minor updates for credit/adjust flows |
| `client/src/pages/sales/InvoiceReturn.tsx` | Add disposition option UI |
| `client/src/pages/sales/InvoiceReturn.css` | Style the new disposition options |
| `client/src/pages/sales/InvoiceViewPage.jsx` | Pass disposition data through to API call |
| `server/src/routes/invoices.ts` | No change needed (payload field is optional) |

## Reuse

- `server/src/controllers/invoiceController.ts:returnInvoiceItems` — existing return logic (stock reversal, ledger entries, COGS reversal) stays; we add disposition handling after it.
- `server/src/models/Payment.ts:create` — can be adapted for refunds.
- `server/src/services/accountingService.ts:postPaymentEntry` — pattern for posting refund GL entry.
- `server/src/utils/ledgerUtils.ts:createLedgerEntry` — reused for credit/adjust ledger entries.
- `server/src/models/Invoice.ts:getByStatus` — to find unpaid invoices for the "adjust" option.
- `server/src/models/Payment.ts:getTotalPaidByInvoiceId` — for recalculating balances.
- `client/src/pages/sales/InvoiceReturn.tsx` — existing return quantity UI; new disposition UI section added.

## Steps

- [ ] **1. Add `customers` table migration for `credit_balance` field** — or reuse `current_balance` (which is computed from outstanding invoices) and add a separate `credit_balance` column to track refunds/credits not yet applied.
- [ ] **2. Backend: Extend `returnInvoiceItems` controller** to accept `disposition` and `adjust_invoice_ids` fields in the request body.
- [ ] **3. Backend: Implement refund disposition** — create a negative payment record (or a `REFUND` type), reverse payment allocation proportionally, create ledger entry (Dr AR $0 / Cr Cash), and post GL entry.
- [ ] **4. Backend: Implement credit disposition** — add the returned amount to a `credit_balance` on the customer record, create a ledger entry showing the credit.
- [ ] **5. Backend: Implement adjust disposition** — fetch unpaid/partially-paid invoices for the customer, allocate the credit across selected invoices (or auto-allocate to oldest first), create payment allocations, update invoice balances/statuses, create ledger entries and GL entries.
- [ ] **6. Frontend: Add disposition selector UI** in `InvoiceReturn.tsx` — three radio options below the reason textarea. Show an invoice selection list (checkboxes) when "adjust" is selected, filtered to unpaid/partially-paid invoices for this customer.
- [ ] **7. Frontend: Update API call** in `InvoiceViewPage.jsx` — pass `disposition` and optional `adjust_invoice_ids` to the return endpoint.
- [ ] **8. Frontend: Style the new UI** in `InvoiceReturn.css` — disposition selector, invoice picker for adjust mode.
- [ ] **9. Test end-to-end** — process a return with each disposition option and verify balances, ledger, payments, and stock movements are correct.

## Verification

1. **Refund path**: Create an invoice, pay it in full, then process a return with disposition `refund`. Verify:
   - A refund payment record is created (negative amount or `REFUND` type)
   - Original payment allocation is reduced or voided
   - Customer ledger shows the refund
   - GL entries are balanced
   - Invoice status updates correctly

2. **Credit path**: Same setup, choose disposition `credit`. Verify:
   - Customer `credit_balance` increases
   - No payment record created
   - Ledger shows the credit
   - Invoice balance goes to $0 (not negative)
   - Customer can use credit on a future invoice

3. **Adjust path**: Same setup, with the customer having an unpaid invoice. Choose disposition `adjust`, select the unpaid invoice. Verify:
   - Payment allocation is created on the unpaid invoice
   - Unpaid invoice balance decreases / status may change to Paid
   - Returned invoice balance goes to $0
   - Both invoices' ledger entries are correct
   - GL entries are balanced for both invoice adjustments
