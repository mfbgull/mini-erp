# CLI TOOL INTEGRATION

## Overview

The CLI tool `cli-anything-minierp` provides agent-native control for Mini ERP. Located at `/home/fawad/.local/bin/cli-anything-minierp`.

**Always use `--json` flag** for machine-readable output.

### Users (Admin Only)
```bash
cli-anything-minierp users list/get/create/update/delete
cli-anything-minierp users reset-password USER_ID --password NEW
cli-anything-minierp users toggle-status USER_ID --active true/false
```

### Roles (Admin Only)
```bash
cli-anything-minierp roles list/permissions/get-permissions/create/update/update-permissions/delete
```

### Forecasts
```bash
cli-anything-minierp forecasts dashboard/demand/trends/generate
```

### Authentication
```bash
cli-anything-minierp auth login -u USERNAME -p PASSWORD
cli-anything-minierp auth logout
cli-anything-minierp auth me
cli-anything-minierp auth change-password --current OLD --new NEW
cli-anything-minierp auth status
```

> **Security note:** Replace USERNAME/PASSWORD with actual credentials. Do not hardcode secrets. The default development credentials are `admin`/`admin123` — these must be changed in production.

### Inventory
```bash
cli-anything-minierp inventory items list/create/get/update/delete
cli-anything-minierp inventory items movements ITEM_ID
cli-anything-minierp inventory items valuation ITEM_ID
cli-anything-minierp inventory items ledger ITEM_ID
cli-anything-minierp inventory items uom
cli-anything-minierp inventory items categories
cli-anything-minierp inventory stock
cli-anything-minierp inventory stock-summary
cli-anything-minierp inventory low-stock
cli-anything-minierp inventory valuation
cli-anything-minierp inventory turnover
cli-anything-minierp inventory slow-moving
cli-anything-minierp inventory transfer/-adjust
cli-anything-minierp inventory warehouses list/create/stock
```

### Sales
```bash
cli-anything-minierp sales orders list/create/get/delete/update/convert-to-invoice/cycle-chain
cli-anything-minierp sales quotations list/get/create/update/delete/convert/cycle-chain/invoices
cli-anything-minierp sales summary-by-date/item
cli-anything-minierp sales top-customers
cli-anything-minierp sales returns
cli-anything-minierp sales create-return
cli-anything-minierp sales commission
cli-anything-minierp sales forecast
```

### Customers
```bash
cli-anything-minierp customers list/create/get/update/delete
cli-anything-minierp customers ledger BALANCE CUSTOMER_ID
```

### Invoices & Payments
```bash
cli-anything-minierp invoices list/create/get/update/delete/payments/return
cli-anything-minierp payments list/create/get/update/delete/allocate
```

### Purchases
```bash
cli-anything-minierp purchases list/create/get/delete/summary-by-item/summary-by-date/top-suppliers
cli-anything-minierp purchase-orders list/create/get/delete/pending
```

### Production & BOM
```bash
cli-anything-minierp production list/create/get/delete/summary-by-item
cli-anything-minierp bom list/create/get/by-item/update/toggle-active/delete
```

### Expenses
```bash
cli-anything-minierp expenses list/create/delete/summary/categories
```

### Reports
```bash
# Financial
cli-anything-minierp reports profit-loss/balance-sheet/income-statement
cli-anything-minierp reports trial-balance/general-ledger/cash-flow/tax-summary

# Sales
cli-anything-minierp reports sales/daily-sales/monthly-sales/gross-profit

# Inventory
cli-anything-minierp reports stock-level/low-stock/batch-traceability

# AR/AP
cli-anything-minierp reports ar-aging/ar-summary/customer-outstanding/supplier-outstanding

# Operations
cli-anything-minierp reports expenses/purchase-summary/production-efficiency/bom-usage
```

### Utilities
```bash
cli-anything-minierp utils export/import
cli-anything-minierp utils backup/backups/restore/delete-backup
cli-anything-minierp utils system-info/health-check/db-stats
cli-anything-minierp utils clear-cache/optimize-db/data-dictionary/audit-log
```

### Other
```bash
cli-anything-minierp pos sale/transactions
cli-anything-minierp suppliers list/create/get/delete
cli-anything-minierp activity list/stats/recent/entity-types/actions/user-activity/entity-activity/export/cleanup
cli-anything-minierp dashboard summary
cli-anything-minierp users list/get/create/update/delete
cli-anything-minierp roles list/permissions/create/delete
cli-anything-minierp forecasts dashboard/demand/trends/generate
cli-anything-minierp integrations settings/update/test-email/weather/exchange-rates
```

---

# 14. QUICK REFERENCE

| Task | Command |
|------|---------|
| Login | `cli-anything-minierp auth login -u USERNAME -p PASSWORD` (development default: `admin`/`admin123` — change in production) |
| List items | `cli-anything-minierp inventory items list` |
| Stock valuation | `cli-anything-minierp inventory valuation` |
| Low stock | `cli-anything-minierp inventory low-stock` |
| P&L report | `cli-anything-minierp reports profit-loss --start YYYY-MM-DD --end YYYY-MM-DD` |
| Balance sheet | `cli-anything-minierp reports balance-sheet --as-of YYYY-MM-DD` |
| Create backup | `cli-anything-minierp utils backup --name "backup-name"` |
| Health check | `cli-anything-minierp utils health-check` |
| Default dev credentials | `admin` / `admin123` (for http://localhost:3011/api) |

---

