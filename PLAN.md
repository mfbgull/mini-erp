# Return-Time Deduction (Restocking Fee) for Partially Paid Invoices

## Context

When a customer returns an item from a **partially paid** invoice, the shop owner needs to apply a **deduction** (restocking fee) — either a percentage or flat amount — before crediting the customer. The deduction stays with the shop as income; the customer's balance decreases only by the **net** amount.

### Design Decisions (confirmed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Balance change | Decreases by **NET** (gross − deduction) | Customer owes the deducted portion because the shop keeps it as fee |
| Deduction nature | **Restocking fee income** (separate GL account 4150) | Explicit tracking in financial reports |
| Disposition for partial invoices | **Auto credit note** (reduce balance, no store credit / cash) | Simplest — the customer owes less, no money moves |

---

## How It Works — Example

- Invoice total: $5,000 · Paid: $2,000 · Balance: $3,000
- Item returned: $1,000 · Deduction: 10% ($100) · Net: $900

| After return | Value |
|---|---|
| `returned_amount` (gross cumulative) | $1,000 |
| `return_fee` (cumulative deductions) | $100 |
| `balance_amount = total - paid - returned + return_fee` | $2,100 (was $3,000, down $900 ✓) |
| GL: Cr AR $900, Dr Sales Returns $1,000, Cr Restocking Fee Income $100 | ✓ |
| Status | `Partially Returned` |

`returned_amount` stores **gross** so the status logic (`returned >= total → Returned`) works correctly when all items are returned even with a deduction.

---

## Files to Modify

### Database
| File | Change |
|------|--------|
| `server/src/migrations/add-gl-foundation.sql` | Add `'4150'` account (Restocking Fee Income) via `INSERT OR IGNORE` |
| `server/src/config/database.ts` | Add idempotent `ALTER TABLE invoices ADD COLUMN return_fee` in `runGLFoundationMigration()` |

### Backend
| File | Change |
|------|--------|
| `server/src/controllers/invoiceController.ts` | Parse deduction from request, split return into gross/net, update `returned_amount` + `return_fee`, modify GL/customer ledger calls |
| `server/src/services/accountingService.ts` | Extend `postInvoiceReturnEntry` to accept deduction and add a `Restocking Fee Income` credit line |
| `server/src/utils/ledgerUtils.ts` | Update `calculateInvoiceBalance()` to include `return_fee` |

### Frontend
| File | Change |
|------|--------|
| `client/src/pages/sales/InvoiceReturn.tsx` | Add deduction input (type + value), show net in summary, include in payload |
| `client/src/pages/sales/SalesPage.tsx` | Update the `onSubmit` handler to pass deduction to the API |

### Types
| File | Change |
|------|--------|
| `client/src/types/index.ts` (or relevant) | Add `deduction_type` / `deduction_value` to the return payload type |

---

## Implementation Steps

### 1. Database — Add Restocking Fee Account

**`server/src/migrations/add-gl-foundation.sql`** — Append one line to the `INSERT OR IGNORE INTO chart_of_accounts` seed:

```sql
('4150', 'Restocking Fee Income', 'revenue', 'credit', 'restocking_fee_income', 'Fees charged on returned items'),
```

Also add a new `ALTER TABLE` in **`server/src/config/database.ts`** inside `runGLFoundationMigration()`:

```sql
ALTER TABLE invoices ADD COLUMN return_fee DECIMAL(15,2) NOT NULL DEFAULT 0
```

Idempotent — check `pragma_table_info` first (same pattern as existing `returned_amount` column).

### 2. Backend — Parse Deduction in Controller

**`server/src/controllers/invoiceController.ts`** — `returnInvoiceItems()`:

- **Parse** new fields from `req.body`:
  ```ts
  const deductionType = body.deduction_type;  // 'percentage' | 'flat' | undefined
  const deductionValue = Number(body.deduction_value) || 0;
  ```

- **Compute deduction** after the existing `returnAmount` (gross) calculation:
  ```ts
  let deduction = 0;
  if (deductionValue > 0) {
    if (deductionType === 'percentage') {
      deduction = returnAmount * (deductionValue / 100);
    } else { // flat
      deduction = Math.min(deductionValue, returnAmount); // cap at gross
    }
  }
  const netReturn = returnAmount - deduction;
  ```

- **Update `returned_amount`** with **gross**:
  ```ts
  db.prepare(`UPDATE invoices SET returned_amount = returned_amount + ?, return_fee = return_fee + ? WHERE id = ?`)
    .run(returnAmount.toFixed(2), deduction.toFixed(2), invoiceId);
  ```

- **Modify the over-return guard** to check against remaining gross (`total_amount - currentReturned`):
  ```ts
  const remainingReturnable = Number(invoice.total_amount) - currentReturned;
  if (returnAmount > remainingReturnable) {
    throw new Error(`Cannot return more than invoice total...`);
  }
  ```

- **Modify `postInvoiceReturnEntry` call** — pass `grossReturn`, `netReturn`, and `deduction`.

- **Modify the credit disposition** — for partial invoices (balance > 0), **don't add to `credit_balance`**. Just let the balance reduction via `returned_amount` do the work. Keep the RETURN ledger entry but for `netReturn`:
  ```ts
  if (resolvedDisposition === 'credit' && invoice.balance_amount > 0) {
    // Credit note: reduce balance, no store credit. Only for partial invoices.
    createLedgerEntry(invoice.customer_id, 'RETURN', invoice.invoice_no, 0, netReturn,
      `Return on ${invoice.invoice_no} (net after $${deduction.toFixed(2)} deduction)`);
    // Do NOT update credit_balance — just reducing what customer owes on this invoice
  }
  ```

  Wait — the current "credit" disposition logic runs for ALL invoices where balance > 0. But the user wants "auto reduce balance" for partial invoices. The existing `returned_amount` + `calculateInvoiceBalance()` already reduces the balance. The `credit_balance` update is a separate thing that gives the customer store credit. For partial invoices, we should skip it.

  However, there's a subtlety: what if the customer has overpaid? After the return (gross - fee), the balance might go negative. In that case, we'd want a refund, not just a balance reduction. But the user chose "auto: reduce balance" for simplicity. I'll implement it as: for partial invoices, the return just reduces the balance. If it goes negative, `calculateInvoiceBalance` will handle it and status will reflect it.

  Actually, let me keep it even simpler: don't modify the credit disposition behavior for now. The current code adds to `credit_balance`. The user wants to reduce balance. But `returned_amount` already does that. The `credit_balance` is extra. The balance change via `returned_amount` is what matters, and `credit_balance` is just additional store credit.

  Hmm, but the user chose "auto: reduce balance (credit note)" — this means they DON'T want store credit. So I should modify the credit disposition to NOT update `credit_balance` when the deduction feature is used, or better, when it's a partial invoice scenario.

  Actually, I think the cleanest approach: since the user specifically chose "Auto: reduce balance (credit note)" for the disposition, I'll modify the "credit" disposition to be a pure balance reduction (credit note) when the invoice is partially paid (balance > 0), without adding to `credit_balance`. The RETURN ledger entry still records the credit.

### 3. Backend — Modify GL Entry

**`server/src/services/accountingService.ts`** — `postInvoiceReturnEntry()`:

Add a new parameter `deduction` to the args and add a line for Restocking Fee Income:

```ts
static postInvoiceReturnEntry(db, args: {
  invoiceId: number; invoiceNo: string;
  grossReturn: number;     // was returnAmount — the gross returned value
  netReturn: number;       // new — the net amount customer gets credit for
  deduction: number;       // new — the restocking fee
  invoiceDate: string; userId?: number; taxAmount?: number;
}): PostedEntry | null {
  if (!args.grossReturn || args.grossReturn <= 0) return null;

  const ar = AccountingService.getAccountByCode(db, '1100');
  const salesReturns = AccountingService.getAccountByCode(db, '4100');
  let restockingFeeAcct: Account | undefined;

  if (args.deduction > 0) {
    restockingFeeAcct = AccountingService.getAccountByCode(db, '4150');
  }

  // journal_entry_id...
  const lines: Array<{ account_id: number; debit: number; credit: number; description: string }> = [];

  // Credit AR by netReturn (what customer's receivable is actually reduced by)
  lines.push({
    account_id: ar.id,
    debit: 0,
    credit: args.netReturn,
    description: `Return on invoice ${args.invoiceNo}`
  });

  // Debit Sales Returns by grossReturn (full reversal of revenue)
  lines.push({
    account_id: salesReturns.id,
    debit: args.grossReturn,
    credit: 0,
    description: `Return on invoice ${args.invoiceNo}`
  });

  // Credit Restocking Fee Income (the deduction the shop keeps)
  if (restockingFeeAcct && args.deduction > 0) {
    lines.push({
      account_id: restockingFeeAcct.id,
      debit: 0,
      credit: args.deduction,
      description: `Restocking fee on return — invoice ${args.invoiceNo}`
    });
  }

  // Handle tax...
  // Post the journal entry with these lines
}
```

### 4. Backend — Fix Balance Calculation

**`server/src/utils/ledgerUtils.ts`** — `calculateInvoiceBalance()`:

```ts
const returnedAmount = parseCurrency(invoice.returned_amount || 0);
const returnFee = parseCurrency(invoice.return_fee || 0);
const newBalance = subtractCurrency(
  subtractCurrency(totalAmount, totalPaid),
  subtractCurrency(returnedAmount, returnFee)  // gross minus fee = net reduction
);
// Which simplifies to:
const newBalance = addCurrency(
  subtractCurrency(subtractCurrency(totalAmount, totalPaid), returnedAmount),
  returnFee
);
```

### 5. Frontend — Add Deduction UI

**`client/src/pages/sales/InvoiceReturn.tsx`**:

- Add state: `deductionType` ('percentage' | 'flat'), `deductionValue`
- Add UI inputs below the item list / in the summary section:

```
  Return Amount (gross):     $1,000.00
  Deduction:         [▼ % | $ ] [  100  ] 
  Net Return:                $900.00
```

- Modify `calculateReturnTotal()` to return both gross and net
- Modify `onSubmit` payload:
  ```ts
  onSubmit({
    items: [...],
    disposition,
    adjust_invoice_ids: [...],
    deduction_type: deductionType,
    deduction_value: deductionValue,
  })
  ```

- Show the net amount to the user, not just gross

### 6. Frontend — Update SalesPage onSubmit

**`client/src/pages/sales/SalesPage.tsx`**: Find where the return modal's `onSubmit` sends the API request and include the new deduction fields.

---

## Verification

### Backend
1. Create an invoice with items, record a partial payment
2. Return an item with a deduction (try both percentage and flat)
3. Verify:
   - `returned_amount` increased by gross
   - `return_fee` increased by deduction
   - `balance_amount` decreased by net (gross - deduction)
   - `customer_ledger` has RETURN entry for net amount
   - `journal_lines` has 3 lines: Cr AR (net), Dr Sales Returns (gross), Cr Restocking Fee Income (fee)
   - Invoice status is `Partially Returned`
4. Return remaining items with deduction → status becomes `Returned`

### Frontend
5. Open return modal on a partially paid invoice — deduction inputs appear
6. Enter deduction, verify summary shows gross / deduction / net correctly
7. Submit, verify server receives the deduction fields

