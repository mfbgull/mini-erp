# Employee Salary Payment Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add salary payment processing to the Employee module — pay an employee's salary with a single click, posting double-entry GL entries (Dr Wages & Salaries 6100, Cr Cash/Bank).

**Architecture:** The app already has a chart of accounts (6100 = Wages & Salaries expense, 1000/1010 = Cash/Bank) and a double-entry accounting service (`AccountingService.postEntry`). The employee record stores a `salary` amount. We add a `salary_payments` table to track payment history, a backend endpoint to process a payment (with GL posting), and a frontend "Pay Salary" button + modal in the employee card/preview.

**Tech Stack:** Node.js + Express + TypeScript (backend), React + TypeScript + TanStack Query (frontend), SQLite via better-sqlite3, existing AccountingService for GL postings.

---

## Task 1: Create salary_payments database migration

**Objective:** Add a table to track salary payments with GL posting reference.

**Files:**
- Create: `server/src/migrations/add-salary-payments.sql`

**Step 1: Create migration SQL**

```sql
-- Salary Payments Migration
CREATE TABLE IF NOT EXISTS salary_payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id     INTEGER NOT NULL REFERENCES employees(id),
    amount          DECIMAL(15,2) NOT NULL,
    payment_date    DATE NOT NULL,
    payment_method  TEXT DEFAULT 'bank',     -- 'cash' | 'bank'
    reference_no    TEXT,
    notes           TEXT,
    journal_entry_id INTEGER,                -- links to journal_lines grouping
    status          TEXT DEFAULT 'paid' CHECK (status IN ('paid','cancelled')),
    paid_by         INTEGER REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salary_payments_employee ON salary_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_date ON salary_payments(payment_date);
```

**Step 2: Wire the migration into the server startup**

The server auto-runs migrations on start. Check `server/src/index.ts` or `server/src/config/database.ts` for the migration-loading mechanism. Likely it reads `.sql` files from `server/src/migrations/`. If so, just placing the file there is sufficient. Verify by grepping `migration` or `readFileSync.*sql` in the server entry point.

---

## Task 2: Add paySalary to AccountingService

**Objective:** Add a helper method that posts the double-entry GL lines for a salary payment.

**Files:**
- Modify: `server/src/services/accountingService.ts` (after the existing `postPaymentEntry` method, around line 441)

**Step 1: Write the postSalaryEntry method**

Add this after `postPaymentEntry` (or after `_cashOrBankAccountCode`):

```typescript
/**
 * Post a salary payment. Dr Wages & Salaries (6100), Cr Cash/Bank (1000/1010).
 */
static postSalaryEntry(
  db: Database.Database,
  args: {
    salaryPaymentId: number;
    employeeName: string;
    employeeCode: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    userId?: number;
  }
): PostedEntry | null {
  if (!args.amount || args.amount <= 0) return null;

  const wageAcct = AccountingService.getAccountByCode(db, '6100');
  const cashCode = AccountingService._cashOrBankAccountCode(args.paymentMethod);
  const cashAcct = AccountingService.getAccountByCode(db, cashCode);
  if (!wageAcct || !cashAcct) {
    throw new Error(
      `Chart of accounts is missing: 6100 (Wages & Salaries) or ${cashCode}`
    );
  }

  return AccountingService.postEntry(db, {
    entry_date: args.paymentDate,
    description: `Salary payment to ${args.employeeName} (${args.employeeCode}) — ${args.amount.toFixed(2)}`,
    reference_type: 'SALARY_PAYMENT',
    reference_id: args.salaryPaymentId,
    created_by: args.userId,
    lines: [
      { account_id: wageAcct.id, debit: args.amount, description: `Salary for ${args.employeeCode}` },
      { account_id: cashAcct.id, credit: args.amount, description: `Salary paid to ${args.employeeCode}` },
    ],
  });
}
```

---

## Task 3: Add salary payment backend route + controller + model

**Objective:** Create the server-side endpoint `POST /employees/:id/salary/pay` and `GET /employees/:id/salary/history`.

**Files:**
- Modify: `server/src/models/Employee.ts` — add `getSalaryHistory()` and `addSalaryPayment()` static methods
- Modify: `server/src/controllers/employeeController.ts` — add `paySalary()` and `getSalaryHistory()` controller functions
- Modify: `server/src/routes/employees.ts` — add the new routes

**Step 1: Add model methods to Employee.ts**

After `removeDocument`:

```typescript
static getSalaryHistory(employeeId: number, db: Database.Database): any[] {
  return db.prepare(
    `SELECT * FROM salary_payments WHERE employee_id = ? ORDER BY payment_date DESC`
  ).all(employeeId);
}

static addSalaryPayment(data: {
  employee_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_no?: string;
  notes?: string;
  journal_entry_id?: number;
  paid_by?: number;
}, db: Database.Database): number {
  const result = db.prepare(`
    INSERT INTO salary_payments (
      employee_id, amount, payment_date, payment_method,
      reference_no, notes, journal_entry_id, paid_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.employee_id,
    data.amount,
    data.payment_date,
    data.payment_method || 'bank',
    data.reference_no || null,
    data.notes || null,
    data.journal_entry_id || null,
    data.paid_by || null
  );
  return result.lastInsertRowid as number;
}
```

**Step 2: Add controller functions to employeeController.ts**

At the top, import AccountingService:
```typescript
import { AccountingService } from '../services/accountingService';
```

Add `paySalary` function:
```typescript
function paySalary(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const employeeId = parseInt(id, 10);
    const authReq = req as AuthRequest;

    const employee = EmployeeModel.getById(employeeId, db);
    if (!employee) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }

    const { amount, payment_date, payment_method, reference_no, notes } = req.body;
    if (!amount || amount <= 0) {
      res.status(422).json({ success: false, error: 'Valid amount is required' });
      return;
    }
    if (!payment_date) {
      res.status(422).json({ success: false, error: 'Payment date is required' });
      return;
    }

    const trx = db.transaction(() => {
      // 1. Insert salary payment record
      const paymentId = EmployeeModel.addSalaryPayment({
        employee_id: employeeId,
        amount,
        payment_date,
        payment_method: payment_method || 'bank',
        reference_no,
        notes,
        paid_by: authReq.user?.id,
      }, db);

      // 2. Post GL entry (Dr Wages & Salaries, Cr Cash/Bank)
      let journalEntryId: number | null = null;
      try {
        const result = AccountingService.postSalaryEntry(db, {
          salaryPaymentId: paymentId,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          employeeCode: employee.employee_code,
          amount,
          paymentDate: payment_date,
          paymentMethod: payment_method,
          userId: authReq.user?.id,
        });
        if (result) journalEntryId = result.journal_entry_id;
      } catch (glError: any) {
        // Log and return the GL error — the transaction auto-rolls back
        throw new Error(`GL posting failed: ${glError.message}`);
      }

      // 3. Update salary_payment with journal_entry_id
      if (journalEntryId) {
        db.prepare(`UPDATE salary_payments SET journal_entry_id = ? WHERE id = ?`)
          .run(journalEntryId, paymentId);
      }

      logCRUD(ActionType.EMPLOYEE_UPDATE, 'Employee', employeeId,
        `Salary paid: ${employee.first_name} ${employee.last_name} (amount: ${amount})`, authReq.user?.id);
      req.activityLogged = true;

      return { paymentId, journalEntryId };
    });

    const result = trx();

    res.status(201).json({
      success: true,
      data: { id: result.paymentId, journal_entry_id: result.journalEntryId },
    });
  } catch (error: any) {
    logger.error('Error paying salary:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to process salary payment' });
  }
}
```

Add `getSalaryHistory` function:
```typescript
function getSalaryHistory(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const employeeId = parseInt(id, 10);

    const employee = EmployeeModel.getById(employeeId, db);
    if (!employee) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }

    const history = EmployeeModel.getSalaryHistory(employeeId, db);
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Error fetching salary history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch salary history' });
  }
}
```

Export both:
```typescript
export default {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getNextEmployeeCode,
  getEmployeeDocuments,
  addEmployeeDocument,
  removeEmployeeDocument,
  paySalary,          // ADD
  getSalaryHistory,   // ADD
};
```

**Step 3: Add routes to employees.ts**

```typescript
// Salary payment routes
router.post('/:id/salary/pay', employeeController.paySalary);
router.get('/:id/salary/history', employeeController.getSalaryHistory);
```

Add these before the document sub-routes (or after, doesn't matter).

---

## Task 4: Add Pay Salary button + modal to employee card

**Objective:** Add a "Pay Salary" button in each employee card and in the EmployeePreview, plus a payment modal form.

**Files:**
- Create: `client/src/pages/employees/SalaryPayModal.tsx` — payment form modal
- Create: `client/src/pages/employees/SalaryPayModal.css` — modal styling
- Modify: `client/src/pages/employees/EmployeesPage.tsx` — wire the pay modal
- Modify: `client/src/pages/employees/EmployeesPage.css` — pay button style

**Step 1: Create SalaryPayModal component**

```tsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { X, DollarSign } from 'lucide-react';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';
import type { Employee } from '../../types';
import './SalaryPayModal.css';

interface SalaryPayModalProps {
  employee: Employee;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SalaryPayModal({ employee, onClose, onSuccess }: SalaryPayModalProps) {
  const [amount, setAmount] = useState(String(employee.salary || 0));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/employees/${employee.id}/salary/pay`, {
        amount: parseFloat(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_no: referenceNo || undefined,
        notes: notes || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(`Salary paid to ${employee.first_name} ${employee.last_name}`);
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to process salary payment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    mutation.mutate();
  };

  const fullName = `${employee.first_name} ${employee.last_name}`;

  return (
    <Modal isOpen={true} onClose={onClose} title={`Pay Salary — ${fullName}`} size="medium">
      <form onSubmit={handleSubmit} className="salary-pay-form">
        <div className="salary-pay-summary">
          <div className="pay-employee-info">
            <span className="pay-employee-name">{fullName}</span>
            <span className="pay-employee-code">{employee.employee_code}</span>
          </div>
        </div>

        <div className="form-row">
          <FormInput
            label="Amount *"
            name="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <FormInput
            label="Payment Date *"
            name="payment_date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Payment Method"
            name="payment_method"
            type="select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'bank', label: 'Bank Transfer' },
              { value: 'cash', label: 'Cash' },
            ]}
          />
          <FormInput
            label="Reference No"
            name="reference_no"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
          />
        </div>

        <FormInput
          label="Notes"
          name="notes"
          type="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            <DollarSign size={16} />
            Pay Salary
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

**Step 2: Create SalaryPayModal.css**

```css
.salary-pay-form {
  padding: var(--space-lg);
}

.salary-pay-summary {
  background: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.pay-employee-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pay-employee-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.pay-employee-code {
  font-size: 0.85rem;
  color: var(--neutral-500);
}
```

**Step 3: Wire into EmployeesPage.tsx**

Add state:
```typescript
const [payingEmployee, setPayingEmployee] = useState<Employee | null>(null);
```

Add the "Pay" button after the Edit button in each card, or use a contextual action. For the card:
```tsx
<button className="action-btn pay-btn" onClick={() => setPayingEmployee(employee)} title="Pay Salary">
  <DollarSign size={16} />
</button>
```

Add `DollarSign` import from lucide-react if not already imported.

Also add a "Pay Salary" action in `EmployeePreview.tsx` in the actions bar (right before or after the Edit button):
```tsx
if (onPay) {
  <button className="preview-action-btn success" onClick={onPay}>
    <DollarSign size={18} />
    <span>Pay Salary</span>
  </button>
}
```

And pass `onPay={() => { onClose(); setPayingEmployee(employee); }}` from the parent.

Add the modal rendering at the bottom of the JSX:
```tsx
{payingEmployee && (
  <SalaryPayModal
    employee={payingEmployee}
    onClose={() => setPayingEmployee(null)}
    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['employees'] })}
  />
)}
```

**Step 4: Add CSS for pay button**

In `EmployeesPage.css`, add:
```css
.action-btn.pay-btn {
  color: var(--success, #10b981);
}

.action-btn.pay-btn:hover {
  background: color-mix(in srgb, var(--success, #10b981), transparent 95%);
}
```

---

## Task 5: Add salary history section to EmployeePreview

**Objective:** Show recent salary payments in the EmployeePreview dialog so users can see past payments.

**Files:**
- Modify: `client/src/pages/employees/EmployeePreview.tsx` — add salary history section

**Step 1: Fetch salary history**

In EmployeePreview, import `useQuery` and `api`, then fetch history when the component mounts:

```tsx
const { data: salaryHistory = [] } = useQuery({
  queryKey: ['salaryHistory', employee.id],
  queryFn: async () => {
    const response = await api.get(`/employees/${employee.id}/salary/history`);
    return response.data.data || [];
  },
});
```

**Step 2: Add salary history section in the preview content**

After the Emergency Contact section (or before the Notes section):

```tsx
{salaryHistory.length > 0 && (
  <div className="preview-section">
    <h3 className="preview-section-title">
      <DollarSign size={14} />
      Salary Payments
    </h3>
    <div className="preview-salary-history">
      {salaryHistory.map((payment: any) => (
        <div key={payment.id} className="preview-salary-item">
          <div className="salary-item-left">
            <span className="salary-item-date">{formatDate(payment.payment_date)}</span>
            {payment.reference_no && (
              <span className="salary-item-ref">Ref: {payment.reference_no}</span>
            )}
          </div>
          <div className="salary-item-right">
            <span className="salary-item-amount">{formatCurrency(payment.amount)}</span>
            <span className="salary-item-method">{payment.payment_method}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## Task 6: TypeScript type updates

**Objective:** Add SalaryPayment type to the shared types file.

**Files:**
- Modify: `client/src/types.ts`

Add after `EmployeeDocument`:

```typescript
export interface SalaryPayment {
  id: number;
  employee_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_no?: string;
  notes?: string;
  journal_entry_id?: number;
  status: string;
  paid_by?: number;
  created_at?: string;
}
```

---

## Task 7: Verification

**Backend tests:**
1. Start server: `npm run dev:server`
2. Test salary payment endpoint:
```bash
curl -X POST http://localhost:3011/api/employees/1/salary/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 30000, "payment_date": "2026-06-15", "payment_method": "bank"}'
```
Expected: 201 with `{ success: true, data: { id: 1, journal_entry_id: 1 } }`

3. Verify GL posting:
```bash
curl -X GET "http://localhost:3011/api/accounting/balances" \
  -H "Authorization: Bearer $TOKEN"
```
Expected: account 6100 (Wages & Salaries) shows debit balance of 30000.

4. Verify salary history:
```bash
curl -X GET http://localhost:3011/api/employees/1/salary/history \
  -H "Authorization: Bearer $TOKEN"
```
Expected: array with one payment entry.

**Frontend verification:**
1. Navigate to `/employees` — verify each card has a green "Pay" button (DollarSign icon)
2. Click "Pay" on an employee — verify the payment modal opens with pre-filled amount
3. Submit the payment — verify success toast, modal closes
4. Open the EmployeePreview dialog and verify salary history section (if any payments exist)
5. Check console for zero errors

---

## Risks, tradeoffs, and open questions

- **No accounting period check:** The `AccountingService.postEntry` already validates open periods — no extra work needed.
- **No payslip/breakdown:** This plan pays the full salary amount as a single line. Future enhancements could add salary components (basic, allowance, deductions, tax).
- **No payslip generation:** No PDF/print output in this scope — that would be a separate feature.
- **No salary adjustment tracking:** The `salary` field on the employee record is static. Changing it doesn't affect historical payments.
- **Database constraint:** Requires GL accounts 6100 and 1000/1010 to exist (they're seeded by `add-gl-foundation.sql`). If a user deleted those, the post would fail with a clear error.
- **Decimal precision:** `amount` uses DECIMAL(15,2) which is consistent with invoice amounts in the app.
- **The `formatCurrency` function may need to be imported** into EmployeePreview if not already there (it uses `../../utils/formatters` which already exports `formatCurrency`).

---

## Summary of file changes

| Action | File |
|--------|------|
| Create | `server/src/migrations/add-salary-payments.sql` |
| Modify | `server/src/services/accountingService.ts` |
| Modify | `server/src/models/Employee.ts` |
| Modify | `server/src/controllers/employeeController.ts` |
| Modify | `server/src/routes/employees.ts` |
| Create | `client/src/pages/employees/SalaryPayModal.tsx` |
| Create | `client/src/pages/employees/SalaryPayModal.css` |
| Modify | `client/src/pages/employees/EmployeesPage.tsx` |
| Modify | `client/src/pages/employees/EmployeesPage.css` |
| Modify | `client/src/pages/employees/EmployeePreview.tsx` |
| Modify | `client/src/types.ts` |

**Total: 11 files (3 new, 8 modified)**
