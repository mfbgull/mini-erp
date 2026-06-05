# Mini ERP: Project-Specific Analysis & SOP

## Architecture Summary

Mini ERP is a full-stack Enterprise Resource Planning system with:

- **Frontend**: React 18 + Vite + TypeScript + TanStack Query
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (better-sqlite3)
- **Desktop**: Electron integration

```
┌─────────────────────────────────────────────────────────────┐
│                      Mini ERP System                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │◄───│   Backend    │◄───│   Database   │  │
│  │   (React)    │    │  (Express)   │    │   (SQLite)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │           │
│         ▼                   ▼                   ▼           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Mobile     │    │  REST API    │    │   Migrations │  │
│  │   Responsive │    │  Endpoints   │    │   & Schema   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Electron Desktop                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## CLI Strategy: REST API via HTTP Client

The CLI communicates with Mini ERP through its REST API:

1. **requests** — Python HTTP client for API calls
2. **Session management** — JWT token persistence in `~/.cli-anything-minierp/`
3. **Interactive REPL** — prompt_toolkit-based shell

### Why REST API?

- Mini ERP already provides a complete REST API
- No need to parse binary formats or manipulate project files
- Direct database access via authenticated endpoints
- Full CRUD operations for all entities

## API Endpoints Coverage

| Module | Endpoints | CLI Commands |
|--------|-----------|--------------|
| **Auth** | login, logout, me, change-password | `auth login/logout/me/change-password/status` |
| **Inventory** | items, warehouses, stock-movements, transfers, adjustments | `inventory items/stock/warehouses/movements/valuation/turnover/slow-moving/transfer/adjust` |
| **Customers** | customers, customer-ledger, balance | `customers list/create/update/delete/get/ledger/balance` |
| **Suppliers** | suppliers | `suppliers list/create/get/delete` |
| **Sales** | sales, orders, returns, commission, forecast | `sales summary-by-item/date/top-customers/orders/returns/commission/forecast` |
| **Invoices** | invoices, payments | `invoices list/create/get/delete/payments` |
| **Purchases** | purchases | `purchases list/create/get/delete` |
| **Purchase Orders** | purchase-orders, pending | `purchase-orders list/create/get/delete/pending` |
| **Expenses** | expenses, categories, summary | `expenses list/create/delete/summary/categories` |
| **Production** | production, BOM | `production list/create/get/delete`, `bom list/create/get/by-item/delete` |
| **Payments** | payments, allocations | `payments list/create/get/delete` |
| **POS** | pos-sale, transactions | `pos sale/transactions` |
| **Reports** | 20+ report types | `reports sales/profit-loss/stock-level/balance-sheet/income-statement/trial-balance/general-ledger/tax-summary/etc` |
| **Activity** | activity-logs, stats | `activity list/stats/recent` |
| **Dashboard** | summary | `dashboard summary` |
| **Settings** | settings | `settings list/get/update` |
| **Integrations** | integrations, email, weather, currency | `integrations settings/update/test-email/weather/exchange-rates` |
| **Utilities** | export, backup, restore, import, audit-log, health-check | `utils export/backup/backups/restore/delete-backup/system-info/clear-cache/optimize-db/db-stats/import/audit-log/data-dictionary/health-check` |

## Command Map: GUI Action -> CLI Command

### Authentication
| GUI Action | CLI Command |
|-----------|-------------|
| Login | `cli-anything-minierp auth login -u USERNAME -p PASSWORD` (dev default: `admin`/`admin123` — change in production) |
| Logout | `cli-anything-minierp auth logout` |
| Check session | `cli-anything-minierp auth status` |
| Change password | `cli-anything-minierp auth change-password --current old --new new` |

### Inventory Management
| GUI Action | CLI Command |
|-----------|-------------|
| List items | `cli-anything-minierp inventory items list` |
| Create item | `cli-anything-minierp inventory items create --code "ITEM001" --name "Test Item"` |
| Get item | `cli-anything-minierp inventory items get 1` |
| Update item | `cli-anything-minierp inventory items update 1 --sell-price 25.0` |
| Stock valuation | `cli-anything-minierp inventory valuation` |
| Transfer stock | `cli-anything-minierp inventory transfer --item-id 1 --from-wh 1 --to-wh 2 --qty 10` |
| Adjust stock | `cli-anything-minierp inventory adjust --item-id 1 --warehouse-id 1 --qty -5 --reason "Damaged"` |
| Low stock items | `cli-anything-minierp inventory low-stock` |
| Slow moving items | `cli-anything-minierp inventory slow-moving --threshold 90` |

### Customers & Sales
| GUI Action | CLI Command |
|-----------|-------------|
| List customers | `cli-anything-minierp customers list` |
| Create customer | `cli-anything-minierp customers create --code "CUST001" --name "Acme Corp"` |
| Customer ledger | `cli-anything-minierp customers ledger --id 1` |
| Create sales order | `cli-anything-minierp sales orders create --customer-id 1 --date 2024-01-15 --items '[{"item_id":1,"quantity":2}]'` |
| Sales by item | `cli-anything-minierp sales summary-by-item 1` |
| Top customers | `cli-anything-minierp sales top-customers --limit 10` |
| Sales forecast | `cli-anything-minierp sales forecast --months 3` |

### Invoices & Payments
| GUI Action | CLI Command |
|-----------|-------------|
| Create invoice | `cli-anything-minierp invoices create --customer-id 1 --date 2024-01-15 --due 2024-02-15 --items '[{"item_id":1,"quantity":2,"unit_price":10.0}]'` |
| List invoices | `cli-anything-minierp invoices list` |
| Create payment | `cli-anything-minierp payments create --customer-id 1 --amount 100 --date 2024-01-20` |

### Purchases
| GUI Action | CLI Command |
|-----------|-------------|
| List purchases | `cli-anything-minierp purchases list` |
| Create purchase order | `cli-anything-minierp purchase-orders create --supplier-id 1 --order-date 2024-01-15 --expected-delivery 2024-01-30 --items '[{"item_id":1,"quantity":10}]'` |
| Pending orders | `cli-anything-minierp purchase-orders pending` |

### Production & BOM
| GUI Action | CLI Command |
|-----------|-------------|
| Record production | `cli-anything-minierp production create --item-id 1 --quantity 50 --date 2024-01-15` |
| List BOMs | `cli-anything-minierp bom list` |
| Create BOM | `cli-anything-minierp bom create --finished-item-id 1 --quantity 1 --items '[{"item_id":2,"quantity":3}]'` |

### Reports (20+ Available)
| GUI Action | CLI Command |
|-----------|-------------|
| Sales summary | `cli-anything-minierp reports sales --start 2024-01-01 --end 2024-01-31` |
| Profit & Loss | `cli-anything-minierp reports profit-loss --start 2024-01-01 --end 2024-01-31` |
| Balance Sheet | `cli-anything-minierp reports balance-sheet --as-of 2024-01-31` |
| Trial Balance | `cli-anything-minierp reports trial-balance --as-of 2024-01-31` |
| General Ledger | `cli-anything-minierp reports general-ledger --start 2024-01-01 --end 2024-01-31` |
| Income Statement | `cli-anything-minierp reports income-statement --start 2024-01-01 --end 2024-01-31` |
| Customer Outstanding | `cli-anything-minierp reports customer-outstanding` |
| Tax Summary | `cli-anything-minierp reports tax-summary --start 2024-01-01 --end 2024-01-31` |

### Utilities
| GUI Action | CLI Command |
|-----------|-------------|
| Export data | `cli-anything-minierp utils export items --format csv` |
| Create backup | `cli-anything-minierp utils backup --name "before-update"` |
| List backups | `cli-anything-minierp utils backups` |
| Restore backup | `cli-anything-minierp utils restore 1` |
| System info | `cli-anything-minierp utils system-info` |
| Health check | `cli-anything-minierp utils health-check` |
| Optimize DB | `cli-anything-minierp utils optimize-db` |

## Session Management

The CLI maintains session state in `~/.cli-anything-minierp/session.json`:

```json
{
  "base_url": "http://localhost:3010/api",
  // Port note: Backend serves on 3011 in run.sh. Vite proxies /api from 3010→3011.
  // Direct backend access uses 3011; frontend dev mode uses 3010 (via proxy).
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "username": "admin",
  "context": null
}
```

### Session Commands

```bash
# Login saves token (replace with actual credentials)
cli-anything-minierp auth login -u admin -p admin123
# ⚠️ Default credentials above are for development only — change in production

# Status shows current session
cli-anything-minierp auth status

# Logout clears token
cli-anything-minierp auth logout
```

## Error Handling

| Error Type | Cause | Resolution |
|------------|-------|-------------|
| `ServerNotRunningError` | Mini ERP server not running | Start server: `cd server && npm start` |
| `AuthenticationError` | Invalid credentials or not logged in | Run `auth login` |
| `APIError` | Server returned error | Check server logs |

## Test Coverage Plan

1. **Unit tests** (`test_core.py`): Mock API responses, test business logic
   - Session management (login, logout, token storage)
   - Item CRUD operations
   - Customer CRUD operations
   - Report data formatting

2. **E2E tests** (`test_full_e2e.py`): Requires running Mini ERP server
   - Full authentication flow
   - Create items, customers, invoices
   - Report generation
   - CLI subprocess invocation

## Server Requirements

The CLI requires a running Mini ERP server:

```bash
# Start the backend
cd /path/to/minierp/server
npm start

# Server runs at http://localhost:3011 (direct backend port)
# CLI connects via proxy at http://localhost:3010/api (Vite dev server proxies to 3011)
```

### Default Credentials (Development Only)

> **Security note:** These are development defaults. In production, change credentials immediately via `users reset-password` or environment variables.

- Username: `admin`
- Password: `admin123`

## Output Formats

### Human-Readable (default)
```
✓ Logged in as admin
```

### JSON (--json flag)
```json
{
  "status": "ok",
  "message": "Logged in as admin",
  "data": {
    "username": "admin",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```
