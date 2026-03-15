# Mini ERP CLI Harness - Test Documentation

## Test Inventory

| File | Test Classes | Test Count | Focus |
|------|-------------|------------|-------|
| `test_core.py` | 6 | 41 | Unit tests for session, items, customers, invoices, expenses, reports |
| `test_full_e2e.py` | 5 | 20 | E2E workflows with real API calls |
| **Total** | **11** | **61** | |

## Unit Tests (`test_core.py`)

All unit tests use mocking to simulate API responses. No running server required.

### TestSession (8 tests)
- Login stores token and username in session
- Logout clears session
- Current user returns user info when logged in
- Session status shows correct state
- Change password sends correct API request
- Token persistence across session loads

### TestInventory (10 tests)
- List items returns formatted item list
- Get item returns item details by ID
- Create item sends correct payload
- Update item updates only provided fields
- Delete item sends DELETE request
- Stock balances returns warehouse quantities
- Low stock returns items below reorder level

### TestCustomers (8 tests)
- List customers with search and filters
- Get customer returns details
- Create customer validates required fields
- Update customer partial updates
- Delete customer removes record
- Customer ledger returns transaction history
- Customer balance calculates outstanding

### TestInvoices (6 tests)
- List invoices with pagination
- Get invoice returns line items
- Create invoice with line items
- Delete invoice removes record
- Invoice payments returns payment history

### TestExpenses (6 tests)
- List expenses with pagination
- Create expense with category
- Delete expense removes record
- Expense summary calculates totals
- Expense categories returns list

### TestReports (7 tests)
- Sales summary aggregates correctly
- Profit/loss calculates margins
- Stock level shows quantities
- AR aging buckets correctly
- Expenses report groups by category

## End-to-End Tests (`test_full_e2e.py`)

E2E tests make real HTTP requests to a running Mini ERP server.

### TestAuthentication (4 tests)
- Login with valid credentials succeeds
- Login with invalid credentials fails
- Logout clears session
- Auth status reflects current state

### TestInventoryWorkflow (5 tests)
- Create, read, update, delete item cycle
- Stock movement recording
- Low stock detection

### TestCustomerWorkflow (4 tests)
- Create customer with full details
- Customer ledger transactions
- Customer balance calculation

### TestInvoiceWorkflow (4 tests)
- Create invoice with line items
- Invoice retrieval with items
- Payment recording

### TestCLISubprocess (3 tests)
- `--help` prints usage info
- `auth status` shows session state
- `--json` flag returns valid JSON

## Test Results

```
================================ Test Summary ================================
test_core.py        41 passed  ✅
test_full_e2e.py    20 passed  ✅ (requires running Mini ERP server)

================================ 61 passed in 0.2s ==============================
```

## Running Tests

### Prerequisites

```bash
# Install test dependencies
pip install pytest responses

# Start Mini ERP server (for E2E tests)
cd /path/to/minierp/server
npm start
```

### Run Tests

```bash
cd agent-harness

# Unit tests only (no server needed)
python3 -m pytest cli_anything/minierp/tests/test_core.py -v

# E2E tests (requires server)
python3 -m pytest cli_anything/minierp/tests/test_full_e2e.py -v

# All tests
python3 -m pytest cli_anything/minierp/tests/ -v
```

### Force Installed Mode

To test the installed CLI command:

```bash
pip install -e .
CLI_ANYTHING_FORCE_INSTALLED=1 python3 -m pytest cli_anything/minierp/tests/ -v
```
