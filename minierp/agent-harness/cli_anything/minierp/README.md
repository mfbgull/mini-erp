# Mini ERP CLI

A stateful command-line interface for Mini ERP, built on the REST API.
Designed for AI agents and power users who need to manage ERP operations
without a GUI.

## Prerequisites

- Python 3.10+
- `requests` (HTTP client)
- `click` (CLI framework)
- `prompt_toolkit` (interactive REPL)

Optional:
- Running Mini ERP server (for E2E tests)

## Install Dependencies

```bash
pip install click requests prompt_toolkit
```

## How to Run

All commands are run from the `agent-harness/` directory.

### One-shot commands

```bash
# Show help
python3 -m cli_anything.minierp.minierp_cli --help

# Login
python3 -m cli_anything.minierp.minierp_cli auth login -u admin -p admin123

# List inventory items
python3 -m cli_anything.minierp.minierp_cli inventory items list

# List customers
python3 -m cli_anything.minierp.minierp_cli customers list

# JSON output (for agent consumption)
python3 -m cli_anything.minierp.minierp_cli --json customers list
```

### Interactive REPL

```bash
# Enter REPL mode
python3 -m cli_anything.minierp.minierp_cli

# Login within REPL (default dev credentials — change in production)
auth login -u admin -p admin123

# List items
inventory items list

# Exit
quit
```

## Command Reference

### Users (Admin Only)

```bash
users list [--role TEXT] [--active true|false] [--search TEXT]
users get USER_ID
users create --username USER --email EMAIL --password PASS --full-name NAME --role-id ROLE_ID [--active true|false]
users update USER_ID [--username USER] [--email EMAIL] [--full-name NAME] [--role-id ROLE_ID] [--active true|false]
users delete USER_ID
users reset-password USER_ID --password NEW_PASS
users toggle-status USER_ID --active true|false
```

### Roles (Admin Only)

```bash
roles list
roles permissions
roles get-permissions ROLE_ID
roles create --name NAME [--description DESC] [--permissions "1,2,3"]
roles update ROLE_ID [--name NAME] [--description DESC] [--active true|false]
roles update-permissions ROLE_ID --permissions "1,2,3"
roles delete ROLE_ID
```

### Forecasts

```bash
forecasts dashboard
forecasts demand [--category CAT] [--trend up|down|stable] [--recommendation TEXT]
forecasts trends [--item-id ID]
forecasts generate
```

### Authentication

```bash
auth login --username USER --password PASS
auth logout
auth me
auth change-password --current CURRENT --new NEW
auth status
```

### Inventory

```bash
inventory items list [--search TEXT] [--category TEXT]
inventory items get ITEM_ID
inventory items create --code CODE --name NAME [--category CAT] [--uom UOM] [--stock N] [--reorder N] [--buy-price N] [--sell-price N]
inventory items update ITEM_ID [--name NAME] [--category CAT] [--sell-price N] [--buy-price N] [--reorder N]
inventory items delete ITEM_ID
inventory stock
inventory stock-summary
inventory low-stock
inventory warehouses list
inventory warehouses create --name NAME [--location LOC]
inventory movements list [--item-id ID] [--warehouse-id ID]
inventory movements create --item-id ID --warehouse-id ID --type IN|OUT|TRANSFER --qty N [--ref REF] [--notes NOTES]
```

### Customers

```bash
customers list [--search TEXT] [--status active|inactive|all] [--page N] [--limit N]
customers get CUSTOMER_ID
customers create --code CODE --name NAME [--email EMAIL] [--phone PHONE] [--address ADDR] [--credit-limit N]
customers update CUSTOMER_ID [--name NAME] [--email EMAIL] [--phone PHONE] [--address ADDR] [--credit-limit N]
customers delete CUSTOMER_ID
customers ledger CUSTOMER_ID
customers balance CUSTOMER_ID
```

### Suppliers

```bash
suppliers list [--search TEXT]
suppliers get SUPPLIER_ID
suppliers create --code CODE --name NAME [--email EMAIL] [--phone PHONE] [--address ADDR]
suppliers delete SUPPLIER_ID
```

### Invoices

```bash
invoices list [--search TEXT] [--status STATUS] [--page N] [--limit N]
invoices get INVOICE_ID
invoices create --customer-id ID --date YYYY-MM-DD --due YYYY-MM-DD --items JSON [--notes TEXT]
invoices update INVOICE_ID [--customer-id ID] [--date DATE] [--due DATE] [--notes TEXT] [--status STATUS]
invoices return INVOICE_ID --items '[{"item_id":1,"quantity":1}]'
invoices delete INVOICE_ID
invoices payments INVOICE_ID
```

### Purchases

```bash
purchases list [--page N] [--limit N]
purchases get PURCHASE_ID
purchases create --supplier-id ID --date YYYY-MM-DD --items JSON [--notes TEXT]
purchases delete PURCHASE_ID
purchases summary-by-item ITEM_ID
purchases summary-by-date --start YYYY-MM-DD --end YYYY-MM-DD
purchases top-suppliers [--limit N]
```

### Payments

```bash
payments list [--page N] [--limit N]
payments get PAYMENT_ID
payments create --customer-id ID --amount N --method cash|bank|card|other --date YYYY-MM-DD [--reference REF] [--notes NOTES]
payments update PAYMENT_ID [--amount N] [--method METHOD] [--reference REF] [--notes NOTES] [--date DATE]
payments delete PAYMENT_ID
payments allocate PAYMENT_ID --allocations '[{"invoice_id":1,"amount":100.00}]'
```

### Production

```bash
production list [--page N] [--limit N]
production get PRODUCTION_ID
production create --item-id ID --quantity N --date YYYY-MM-DD [--notes TEXT]
production delete PRODUCTION_ID
production summary-by-item ITEM_ID
```

### BOM (Bill of Materials)

```bash
bom list [--page N] [--limit N]
bom get BOM_ID
bom by-item ITEM_ID
bom create --finished-item-id ID --qty N --components JSON [--description DESC]
bom update BOM_ID [--description DESC] [--quantity N] [--notes TEXT] [--active true|false]
bom toggle-active BOM_ID
bom delete BOM_ID
```

### Inventory Items Extended

```bash
inventory items ledger ITEM_ID
inventory items uom
```

### Activity

```bash
activity list [--entity-type TYPE] [--action ACTION] [--user-id ID] [--start DATE] [--end DATE] [--page N] [--limit N]
activity stats [--start DATE] [--end DATE]
activity recent [--limit N]
activity entity-types
activity actions
activity user-activity USER_ID [--page N] [--limit N]
activity entity-activity ENTITY_TYPE ENTITY_ID [--page N] [--limit N]
activity export [--start DATE] [--end DATE] [--entity-type TYPE] [--action ACTION]
activity cleanup [--days N]
```

### Settings

```bash
settings list
settings get KEY
settings update KEY VALUE
settings bulk-update --settings '{"key1":"value1","key2":"value2"}'
```

### Sales Orders Extended

```bash
sales orders list [--search TEXT] [--status STATUS] [--page N] [--limit N]
sales orders get ORDER_ID
sales orders create --customer-id ID --date YYYY-MM-DD --items JSON [--notes TEXT]
sales orders update ORDER_ID [--customer-id ID] [--order-date DATE] [--status STATUS] [--notes TEXT]
sales orders delete ORDER_ID
sales orders convert-to-invoice ORDER_ID
sales orders cycle-chain ORDER_ID
```

### Sales Quotations

```bash
sales quotations list [--search TEXT] [--status STATUS] [--page N] [--limit N]
sales quotations get QUOTATION_ID
sales quotations create --customer-id ID --date YYYY-MM-DD --valid-until DATE --items JSON [--notes TEXT]
sales quotations update QUOTATION_ID [--customer-id ID] [--date DATE] [--valid-until DATE] [--status STATUS] [--notes TEXT]
sales quotations delete QUOTATION_ID
sales quotations convert QUOTATION_ID
sales quotations cycle-chain QUOTATION_ID
sales quotations invoices QUOTATION_ID
```

### Expenses

```bash
expenses list [--page N] [--limit N] [--category CAT]
expenses create --date YYYY-MM-DD --category CAT --amount N [--description TEXT] [--method cash|bank|card|other]
expenses delete EXPENSE_ID
expenses summary [--start YYYY-MM-DD] [--end YYYY-MM-DD]
expenses categories
```

### Reports

```bash
reports sales [--start YYYY-MM-DD] [--end YYYY-MM-DD]
reports profit-loss [--start YYYY-MM-DD] [--end YYYY-MM-DD]
reports stock-level
reports low-stock
reports ar-aging
reports ar-summary
reports expenses [--start YYYY-MM-DD] [--end YYYY-MM-DD]
reports purchase-summary [--start YYYY-MM-DD] [--end YYYY-MM-DD]
```

## JSON Mode

Add `--json` before the subcommand for machine-readable output:

```bash
cli-anything-minierp --json customers list
```

Output:
```json
{
  "status": "ok",
  "data": [
    {"id": 1, "customer_code": "C001", "customer_name": "Acme Corp", ...}
  ]
}
```

## Environment Variables

- `MINIERP_URL` - Server URL (default: `http://localhost:3010/api`)

```bash
export MINIERP_URL=http://192.168.1.100:3010/api
cli-anything-minierp auth login -u admin -p admin123
```

## Running Tests

```bash
cd agent-harness

# Install test dependencies
pip install pytest responses

# Unit tests (no server needed)
python3 -m pytest cli_anything/minierp/tests/test_core.py -v

# E2E tests (requires running Mini ERP server)
python3 -m pytest cli_anything/minierp/tests/test_full_e2e.py -v

# All tests
python3 -m pytest cli_anything/minierp/tests/ -v
```

## Example Workflow

```bash
# Login
cli-anything-minierp auth login -u admin -p admin123

# Create an inventory item
cli-anything-minierp inventory items create --code "LAPTOP001" --name "ThinkPad X1" --category "Electronics" --stock 10 --sell-price 1200.00 --buy-price 800.00

# Create a customer
cli-anything-minierp customers create --code "CUST001" --name "Acme Corporation" --email "contact@acme.com" --credit-limit 50000

# Create an invoice
cli-anything-minierp invoices create --customer-id 1 --date 2024-01-15 --due 2024-02-15 --items '[{"item_id":1,"quantity":2,"unit_price":1200.00}]'

# View sales report
cli-anything-minierp reports sales --start 2024-01-01 --end 2024-01-31

# View stock levels
cli-anything-minierp inventory stock-summary
```

## Session Management

The CLI stores session data in `~/.cli-anything-minierp/session.json`:

```json
{
  "base_url": "http://localhost:3010/api",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "username": "admin"
}
```

Logout clears the session:
```bash
cli-anything-minierp auth logout
```
