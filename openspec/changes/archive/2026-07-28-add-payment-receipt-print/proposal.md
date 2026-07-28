## Why

When a customer makes a payment (e.g., ₹1,000 against outstanding invoices), the system records the payment against the customer balance and allocated invoices, but there's no way to generate a payment receipt for the customer. Staff need a quick way to print a receipt at the point of payment — both a full A4 version and a thermal/printer-friendly version — to hand to the customer as proof of payment.

## What Changes

- Add a **Print Receipt** button to the Record Payment flow — after a successful payment, offer to print a receipt
- Add a **Print** action to the Payments list (AG Grid desktop + CompactCard mobile) for existing payments
- Create two receipt print layouts:
  - **A4 Receipt**: Full-page receipt suitable for standard printers
  - **Thermal Receipt**: Narrow-format receipt for thermal/pos printers (matching existing pattern in InvoiceViewPage)
- Backend: Add a `GET /payments/:id/receipt` endpoint that returns enriched payment data for receipt rendering (customer details, allocation details)
- Follow the same pattern as the existing invoice print (InvoiceViewPage handlePrint/handlePrintReceipt) and thermal template (ThermalInvoiceTemplate)

## Capabilities

### New Capabilities
- `payment-receipt-print`: Print payment receipts in A4 and thermal formats from the payment recording flow and payments list

### Modified Capabilities
- *(none — this is a new capability)*

## Impact

- **Frontend**: 
  - New component: `PaymentReceiptA4` (A4 layout, similar to `InvoiceTemplateA4`)
  - New component: `ThermalPaymentReceipt` (thermal layout, similar to `ThermalInvoiceTemplate`)
  - Modify `PaymentModal.tsx`: after successful payment mutation, show a "Print Receipt" action
  - Modify `PaymentsPage.tsx`: add "Print" action to the dropdown menu and mobile card view
- **Backend**:
  - New route: `GET /payments/:id/receipt` under existing payments router
  - New controller function: `getPaymentReceipt` in `paymentsController.ts` — returns payment with customer details and allocations
  - Possibly a new service function or just use existing `PaymentModel.getById` with extra customer info
- **No new dependencies**: uses existing print pattern (window.open + write HTML/css, @media print styles)
