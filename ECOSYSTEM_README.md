# Mini ERP Ecosystem

## Overview

MiniERP is a full-stack ERP solution for small-to-medium businesses. It uses a
monorepo structure with separate frontend (React) and backend (Express) packages,
a shared SQLite database, and a Python CLI tool for agent-native operations.

```
mini-erp/
├── client/               # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components (AG-Grid desktop, cards mobile)
│   │   ├── pages/        # Route-level page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── services/     # API client layer (TanStack Query)
│   └── vite.config.ts
├── server/               # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── controllers/  # Request/response handling
│   │   ├── services/     # Business logic layer
│   │   ├── models/       # Database access layer
│   │   ├── routes/       # Route definitions
│   │   ├── migrations/   # SQL migration files
│   │   ├── utils/        # Shared utilities (currency, ledger, logger)
│   │   └── __tests__/    # Jest test suites
│   ├── database/         # SQLite database files
│   └── logs/             # Application logs
├── electron/             # Desktop app wrapper (optional)
├── agent-harness/        # Python CLI tool (cli-anything-minierp)
└── AGENTS.md             # Operational rules for AI agents
```

---

## Architecture Principles

### Layered Backend

Routes → Controllers → Services → Models. Each layer has a single responsibility
and data flows in one direction. Controllers never touch the database directly;
Models never format HTTP responses.

### Dual-Frontend Pattern

Desktop users get AG-Grid (data tables with sorting, filtering, export). Mobile
users (<768px) get compact card views with the same data. Both render from the
same TanStack Query hooks.

### SQLite as Primary Storage

better-sqlite3 provides synchronous, single-writer access. WAL mode enables
concurrent reads. Indexes exist on all foreign keys and frequently-queried columns.

---

## Modules

| Module        | Backend Files                    | Frontend Pages          | Description                           |
|---------------|----------------------------------|-------------------------|---------------------------------------|
| Inventory     | inventoryController, Item, StockMovement, Warehouse | /inventory | Items, warehouses, stock tracking, batch FIFO |
| Sales         | salesController, Invoice, Payment, Customer     | /sales, /invoices      | Quotations, orders, invoices, payments, AR |
| Purchases     | purchasesController, PurchaseOrder, Supplier    | /purchases             | POs, supplier management, AP          |
| Manufacturing | Production, BOM                  | /production             | Bills of Materials, work orders       |
| Expenses      | expensesController, Expense       | /expenses               | Expense tracking by category          |
| Accounting    | accountingService, accountingController, ledgerUtils, journalEntry | — (API only) | Double-entry GL, chart of accounts, periods |
| Reports       | Reports                          | /reports                | 20+ reports (P&L, balance sheet, AR aging, etc.) |
| Admin         | usersController, rolesController  | /admin                  | User & role management                |

---

## Accounting / General Ledger

The GL subsystem was added in Phase 2 and follows standard double-entry
bookkeeping. Every journal entry has at least one debit and one credit posting
to the `journal_lines` table, balanced to 4 decimal places.

### Chart of Accounts (15 accounts)

| Code | Name                | Normal Balance | Type     |
|------|---------------------|----------------|----------|
| 1000 | Cash                | debit          | asset    |
| 1010 | Bank                | debit          | asset    |
| 1100 | Accounts Receivable | debit          | asset    |
| 1200 | Inventory Asset     | debit          | asset    |
| 2000 | Accounts Payable    | credit         | liability|
| 2100 | Tax Payable         | credit         | liability|
| 3000 | Owner's Equity      | credit         | equity   |
| 3100 | Retained Earnings   | credit         | equity   |
| 4000 | Sales Revenue       | credit         | revenue  |
| 5000 | Cost of Goods Sold  | debit          | expense  |
| 6000 | Operating Expenses  | debit          | expense  |
| 6100 | Wages & Salaries    | debit          | expense  |
| 7000 | Production Clearing | debit          | expense  |
| 7100 | Inventory Correction| debit          | expense  |
| 7200 | Inventory Shrinkage | debit          | expense  |

### Posting Flows

- **Invoice creation**: Dr AR (1100), Cr Sales Revenue (4000), Cr Tax Payable (2100)
- **COGS**: Dr COGS (5000), Cr Inventory Asset (1200) — at actual FIFO cost
- **Payment received**: Dr Cash (1000) or Bank (1010), Cr AR (1100)
- **Purchase order**: Dr Inventory Asset (1200), Cr AP (2000) — via `postPurchaseOrderEntry`

### Current Limitations

- No production cost posting (Dr/Cr Production Clearing not wired to work orders)
- No closing entries (revenue/expense → Retained Earnings)
- No sales returns / discounts accounting
- No AP payment posting
- See `AGENTS.md` or `docs/API.md` for REST endpoints

---

## CLI Tool (`cli-anything-minierp`)

A Python CLI at `~/.local/bin/cli-anything-minierp` that provides agent-native
control over every module. Always use `--json` for structured output.

```bash
cli-anything-minierp auth login -u admin -p admin123  # dev default
cli-anything-minierp inventory items list              # list all items
cli-anything-minierp reports profit-loss               # financial reports
cli-anything-minierp utils backup --name "backup"      # database backup
```

The CLI is an editable pip package at `agent-harness/`.

---

## Testing

```bash
cd server

# Unit + integration tests (Jest)
npm test

# Accounting-specific end-to-end tests
bash /tmp/test-accounting.sh

# TypeScript typecheck only
npx tsc --noEmit

# Full build
npm run build
```

25 accounting end-to-end tests exercise the GL endpoints (accounts, periods,
journal entries, trial balance). The Jest test suite covers models, controllers,
and services with shared test helpers in `src/__tests__/helpers/`.

---

## API Conventions

All API responses follow a consistent shape:

```json
{
  "success": true,
  "data": { ... }
}

// Error shape
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Human-readable message"
  }
}
```

Error codes: `INVALID_INPUT`, `RESOURCE_NOT_FOUND`,
`RESOURCE_ALREADY_EXISTS`, `CSRF_FAILED`, `INSUFFICIENT_PERMISSIONS`.

Auth: JWT `Authorization: Bearer <token>` header. CSRF double-submit cookie
(`csrf-token` cookie + `x-csrf-token` header).

---

## Development

```bash
# Backend
cd server && npm install && npm start     # port 3011

# Frontend
cd client && npm install && npm run dev   # port 5173

# Build for production
cd client && npm run build
cd server && npm run build
```

Default login: `admin` / `admin123` (change in production).

---

## Sequence Diagrams

Refer to `docs/architecture.html` for visual architecture diagrams generated
from the codebase structure. Controllers, services, and models are documented
in the `docs/` HTML files.
