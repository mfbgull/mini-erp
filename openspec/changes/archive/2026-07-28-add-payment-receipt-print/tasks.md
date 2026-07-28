## 1. Backend — Receipt data endpoint

- [x] 1.1 Add `getPaymentReceipt` controller function in `paymentsController.ts` — queries payment with customer details (name, address, phone, current_balance), company info (from settings), invoice allocations. Computes `previous_balance = customer.current_balance + payment.amount`, returns `previous_balance`, `current_balance` (from customers table), and all receipt fields.
- [x] 1.2 Add route `GET /payments/:id/receipt` in `routes/payments.ts` with `requirePermission('payments', 'read')` middleware and validation

## 2. Frontend — Receipt components

- [x] 2.1 Create `client/src/components/payment/PaymentReceiptA4.tsx` and `.css` — A4 receipt layout showing receipt number, customer details, payment info, **balance summary section (Previous Balance → Payment → New Balance)**, allocated invoices table, total, notes
- [x] 2.2 Create `client/src/components/payment/ThermalPaymentReceipt.tsx` and `.css` — narrow thermal receipt layout mirroring `ThermalInvoiceTemplate` pattern, with **balance summary line (`Prev Bal: X.XX → Payment: X.XX → New Bal: X.XX`)**
- [x] 2.3 Create `client/src/components/payment/index.ts` — barrel export for the new components

## 3. Frontend — PaymentModal print-after-create flow

- [x] 3.1 In `PaymentModal.tsx`: on successful payment mutation, capture the returned payment ID, show success state with "Print Receipt" and "Print Thermal" buttons instead of immediately closing
- [x] 3.2 Wire the "Print Receipt" button to open A4 print view; wire "Print Thermal" to open thermal popup

## 4. Frontend — Payments page print action

- [x] 4.1 In `PaymentsPage.tsx`: add "Print Receipt" and "Print Thermal" actions to the AG Grid dropdown menu
- [x] 4.2 In `CompactPaymentCard.tsx`: add print actions to the mobile card action menu
- [x] 4.3 Create a reusable `usePaymentPrint` hook
- [x] 4.4 In `CustomerDetailPage.tsx` + `PaymentsTab.tsx`: add print actions to the customer detail payment tab dropdown (or inline function) that fetches receipt data via the new endpoint and opens the appropriate print view

## 5. Verify

- [x] 5.1 `npm run typecheck` — no TypeScript errors
- [x] 5.2 `npm run lint` — no lint errors (pre-existing warnings only, no new errors from this change)
- [ ] 5.3 Manual test: record a payment → print receipt flows work (A4 and thermal)
- [ ] 5.4 Manual test: print receipt from payments list (desktop and mobile)
