# AGENTS.md

# Mini ERP -- Dual Mode AI Agent Specification

Version: 3.0\
Modes Supported: - ASSISTANT MODE (Collaborative) - AUTONOMOUS MODE
(Self-Executing + Self-Auditing)

------------------------------------------------------------------------

# 1. PURPOSE

This document defines operational rules for AI agents working inside the
Mini ERP codebase.

The agent must explicitly operate in one of two modes:

1.  ASSISTANT MODE → advisory + guided execution
2.  AUTONOMOUS MODE → independent execution with mandatory self-audit

If mode is not specified, default = ASSISTANT MODE.

------------------------------------------------------------------------

# 2. SYSTEM ARCHITECTURE (NON-NEGOTIABLE)

Frontend: - React + Vite + TypeScript - TanStack Query - React Context -
AG-Grid (desktop) - Compact Card System (mobile)

Backend: - Node.js + Express + TypeScript - SQLite (better-sqlite3) -
Layered architecture

Architecture must not be replaced or restructured without explicit
approval.

------------------------------------------------------------------------

# 3. GLOBAL ENGINEERING RULES (APPLIES TO BOTH MODES)

## 3.1 Type Safety

-   No `any`
-   No `as any`
-   No `@ts-ignore`
-   No suppressed TypeScript errors
-   All props typed
-   All API responses typed

If types are unclear → define interfaces in `/types`.

------------------------------------------------------------------------

## 3.2 Error Handling

Backend: - All controllers wrapped in try/catch - Structured JSON
response - No stack trace leaks

Frontend: - Async wrapped in try/catch - Toast feedback required -
Loading states required - No empty catch blocks

------------------------------------------------------------------------

## 3.3 Database Rules

-   Prepared statements only
-   No string-interpolated SQL
-   Transactions for multi-step writes
-   Schema changes require migration file
-   No silent DB changes

------------------------------------------------------------------------

## 3.4 Security

-   Validate inputs
-   Protect authenticated routes
-   Never log secrets or passwords
-   Never trust client data

------------------------------------------------------------------------

# 4. MODE DEFINITIONS

==================================== ASSISTANT MODE
====================================

Role: - Provide guidance - Suggest improvements - Generate code upon
request - Ask clarifying questions before major changes

Behavior Rules:

1.  Do NOT modify architecture unless asked.
2.  Explain tradeoffs when proposing structural changes.
3.  Highlight risks before refactors.
4.  Provide implementation plan before large changes.
5.  Prefer minimal-diff changes.

Completion Criteria:

-   Solution compiles
-   Type-safe
-   Follows architecture
-   No breaking changes unless requested

------------------------------------------------------------------------

==================================== AUTONOMOUS MODE
====================================

Role: - Execute tasks independently - Refactor when needed - Enforce
standards - Self-audit before completion

Autonomous Privileges:

-   May refactor for type safety
-   May reorganize internal code (not architecture)
-   May optimize performance
-   May remove dead code

Autonomous Restrictions:

-   Cannot change DB schema without migration
-   Cannot change API contract without explicit approval
-   Cannot replace architectural stack
-   Cannot introduce new frameworks

------------------------------------------------------------------------

# 5. SELF-AUDIT PROTOCOL (AUTONOMOUS MODE ONLY)

Before declaring completion, verify:

1.  Zero TypeScript errors
2.  No console warnings
3.  No unused imports
4.  No duplicated logic introduced
5.  Mobile layout validated (\<768px)
6.  Desktop layout validated
7.  API response structure consistent
8.  Error handling exists everywhere
9.  All DB changes include migration
10. No security rule violated
11. No performance regression introduced

If any check fails → continue refining.

------------------------------------------------------------------------

# 6. FRONTEND EXECUTION RULES

## Desktop vs Mobile

All list pages must:

Desktop: - Use AG-Grid

Mobile (\<768px): - Use Compact Card View - Include search - Include
three-dot menu - Include detail modal - Include mobile action bar

No exceptions.

------------------------------------------------------------------------

# 7. BACKEND LAYER DISCIPLINE

Routes → endpoint definitions only\
Controllers → request/response\
Services → business logic\
Models → database access

Never mix layers.

------------------------------------------------------------------------

# 8. PERFORMANCE STANDARDS

Frontend: - Avoid unnecessary re-renders - Memoize heavy components -
Avoid inline functions in large lists

Backend: - Avoid N+1 queries - Use indexes when appropriate - Use
transactions efficiently

------------------------------------------------------------------------

# 9. CHANGE IMPACT ANALYSIS (AUTONOMOUS MODE)

Before major internal refactor:

1.  Identify affected modules
2.  Check cross-layer impact
3.  Evaluate DB implications
4.  Verify no circular dependencies
5.  Preserve API contract

------------------------------------------------------------------------

# 10. FAILURE CONDITIONS

Task automatically fails if:

-   TypeScript errors remain
-   Mobile view broken
-   API contract inconsistent
-   Schema changed without migration
-   Security rule violated
-   Architecture boundary broken

------------------------------------------------------------------------

# 11. DEFINITION OF DONE

Task is complete only when:

-   Fully typed
-   Fully error-handled
-   Architecturally consistent
-   Mobile + Desktop verified
-   Self-audit passed (Autonomous Mode)
-   No suppressed errors

------------------------------------------------------------------------

# 12. MODE SWITCH INSTRUCTION

To activate mode explicitly:

"Operate in ASSISTANT MODE" or "Operate in AUTONOMOUS MODE"

If not specified → ASSISTANT MODE.

------------------------------------------------------------------------

# 13. CLI TOOL INTEGRATION

## cli-anything-minierp

This project includes a CLI tool for interacting with the Mini ERP system. The AI
MUST be aware of this tool and use it when appropriate.

### Tool Details

- **Executable**: `cli-anything-minierp`
- **Location**: `/home/fawad/.local/bin/cli-anything-minierp`
- **Package**: `cli-anything-minierp` (version 1.0.0)
- **Installation**: Installed via pip from agent-harness

### Available Commands

```
Usage: cli-anything-minierp [OPTIONS] COMMAND [ARGS]!

  Mini ERP CLI — agent-native control for the Mini ERP system.

Options:
  --json      Output results as JSON (for agent consumption).
  --url TEXT  Mini ERP server URL (default: http://localhost:3010/api).
  --version   Show the version and exit.
  --help      Show this message and exit.

Commands:
  activity         Activity log and audit trail.
  auth             Authentication — login, logout, user info.
  bom              Bill of Materials management.
  customers        Customer management — CRUD, ledger, balance.
  dashboard        Dashboard and overview.
  expenses         Expense tracking — categories and expense records.
  integrations     Third-party integrations (admin only).
  inventory        Inventory — items, warehouses, stock movements.
  invoices         Invoice management — create, list, view.
  payments         Payment management — CRUD, allocations.
  pos              Point of Sale transactions.
  production       Production management — record manufacturing.
  purchase-orders  Purchase order management.
  purchases        Purchase management — record and query purchases.
  reports          Business reports — sales, inventory, financial (20+ reports).
  sales            Sales analytics, orders, returns, commission, forecast.
  settings         System settings and configuration.
  suppliers        Supplier management — CRUD.
  utils            System utilities — export, backup, restore, import, health-check.
```

### Command Reference by Module

#### Authentication
```bash
cli-anything-minierp auth login -u admin -p admin123
cli-anything-minierp auth logout
cli-anything-minierp auth me
cli-anything-minierp auth change-password --current OLD --new NEW
cli-anything-minierp auth status
```

#### Inventory (14 commands)
```bash
cli-anything-minierp inventory items list/create/get/update/delete
cli-anything-minierp inventory items movements ITEM_ID [--start DATE] [--end DATE]
cli-anything-minierp inventory items valuation ITEM_ID
cli-anything-minierp inventory stock
cli-anything-minierp inventory stock-summary
cli-anything-minierp inventory low-stock
cli-anything-minierp inventory valuation              # Total inventory valuation
cli-anything-minierp inventory turnover               # Turnover analysis
cli-anything-minierp inventory slow-moving [--threshold DAYS]
cli-anything-minierp inventory transfer --item-id ID --from-wh ID --to-wh ID --qty N
cli-anything-minierp inventory adjust --item-id ID --warehouse-id ID --qty N --reason TEXT
cli-anything-minierp inventory warehouses list/create/stock
cli-anything-minierp inventory movements list/create
```

#### Sales & Orders (10 commands)
```bash
cli-anything-minierp sales summary-by-item/item_id
cli-anything-minierp sales summary-by-date [--start DATE] [--end DATE]
cli-anything-minierp sales top-customers [--limit N]
cli-anything-minierp sales orders list/create/get/delete
cli-anything-minierp sales returns [--start DATE] [--end DATE]
cli-anything-minierp sales create-return --sale-id ID --items JSON --reason TEXT
cli-anything-minierp sales commission [--salesperson-id ID]
cli-anything-minierp sales forecast [--months N]
```

#### Customers (7 commands)
```bash
cli-anything-minierp customers list/create/get/update/delete
cli-anything-minierp customers ledger CUSTOMER_ID
cli-anything-minierp customers balance CUSTOMER_ID
```

#### Invoices & Payments
```bash
cli-anything-minierp invoices list/create/get/delete
cli-anything-minierp invoices payments INVOICE_ID
cli-anything-minierp payments list/create/get/delete
```

#### Purchases & Purchase Orders
```bash
cli-anything-minierp purchases list/create/get/delete
cli-anything-minierp purchase-orders list/create/get/delete/pending
```

#### Production & BOM
```bash
cli-anything-minierp production list/create/get/delete
cli-anything-minierp bom list/create/get/by-item/delete
```

#### Expenses
```bash
cli-anything-minierp expenses list/create/delete/summary/categories
```

#### Reports (20+ reports)
```bash
# Financial Reports
cli-anything-minierp reports profit-loss [--start DATE] [--end DATE]
cli-anything-minierp reports balance-sheet [--as-of DATE]
cli-anything-minierp reports income-statement [--start DATE] [--end DATE]
cli-anything-minierp reports trial-balance [--as-of DATE]
cli-anything-minierp reports general-ledger [--account-id ID] [--start DATE] [--end DATE]
cli-anything-minierp reports cash-flow [--start DATE] [--end DATE]
cli-anything-minierp reports tax-summary [--start DATE] [--end DATE]

# Sales Reports
cli-anything-minierp reports sales [--start DATE] [--end DATE]
cli-anything-minierp reports daily-sales [--start DATE] [--end DATE]
cli-anything-minierp reports monthly-sales YEAR
cli-anything-minierp reports gross-profit [--start DATE] [--end DATE]

# Inventory Reports
cli-anything-minierp reports stock-level
cli-anything-minierp reports low-stock
cli-anything-minierp reports batch-traceability ITEM_ID

# AR/AP Reports
cli-anything-minierp reports ar-aging
cli-anything-minierp reports ar-summary
cli-anything-minierp reports customer-outstanding
cli-anything-minierp reports supplier-outstanding

# Operations Reports
cli-anything-minierp reports expenses [--start DATE] [--end DATE]
cli-anything-minierp reports purchase-summary [--start DATE] [--end DATE]
cli-anything-minierp reports production-efficiency [--start DATE] [--end DATE]
cli-anything-minierp reports bom-usage BOM_ID
```

#### Utilities (13 commands)
```bash
cli-anything-minierp utils export ENTITY_TYPE [--format csv|json] [--start DATE] [--end DATE]
cli-anything-minierp utils backup [--name NAME]
cli-anything-minierp utils backups                    # List available backups
cli-anything-minierp utils restore BACKUP_ID
cli-anything-minierp utils delete-backup BACKUP_ID
cli-anything-minierp utils system-info
cli-anything-minierp utils clear-cache
cli-anything-minierp utils optimize-db
cli-anything-minierp utils db-stats
cli-anything-minierp utils import ENTITY_TYPE --file PATH [--format csv|json]
cli-anything-minierp utils audit-log [--entity-type TYPE] [--limit N]
cli-anything-minierp utils data-dictionary
cli-anything-minierp utils health-check
```

#### Other Modules
```bash
cli-anything-minierp pos sale/transactions
cli-anything-minierp suppliers list/create/get/delete
cli-anything-minierp activity list/stats/recent
cli-anything-minierp dashboard summary
cli-anything-minierp settings list/get/update
cli-anything-minierp integrations settings/update/test-email/weather/exchange-rates
```

### Usage Guidelines

1. **Always use `--json` flag** (via `cli-anything-minierp --json ...`) when you need
   to parse structured data from the CLI output.

2. **Authentication**: Use `cli-anything-minierp auth login --username admin --password admin123`
   before making authenticated requests. Session is persisted in `~/.cli-anything-minierp/session.json`.

3. **Quick queries**: Prefer CLI over direct database access for common operations:
   - Listing items: `cli-anything-minierp inventory items list`
   - Viewing reports: `cli-anything-minierp reports profit-loss --start 2026-01-01 --end 2026-01-31`
   - Creating records: `cli-anything-minierp inventory items create --code "ITEM001" --name "Test"`
   - Stock operations: `cli-anything-minierp inventory transfer --item-id 1 --from-wh 1 --to-wh 2 --qty 50`

4. **Financial Analysis**:
   ```bash
   # Profit & Loss
   cli-anything-minierp reports profit-loss --start 2026-01-01 --end 2026-01-31
   
   # Balance Sheet
   cli-anything-minierp reports balance-sheet --as-of 2026-01-31
   
   # Trial Balance
   cli-anything-minierp reports trial-balance --as-of 2026-01-31
   
   # Customer Outstanding
   cli-anything-minierp reports customer-outstanding
   ```

5. **Inventory Management**:
   ```bash
   # Check low stock
   cli-anything-minierp inventory low-stock
   
   # Stock valuation
   cli-anything-minierp inventory valuation
   
   # Transfer between warehouses
   cli-anything-minierp inventory transfer --item-id 1 --from-wh 1 --to-wh 2 --qty 50
   
   # Adjust stock
   cli-anything-minierp inventory adjust --item-id 1 --warehouse-id 1 --qty -5 --reason "Damaged"
   ```

6. **Data Operations**:
   ```bash
   # Export data
   cli-anything-minierp utils export items --format csv
   
   # Create backup
   cli-anything-minierp utils backup --name "before-update"
   
   # Health check
   cli-anything-minierp utils health-check
   ```

7. **Automation & Scripting**:
   - Use in bash scripts for automated workflows
   - Chain commands with pipes for complex operations
   - Schedule with cron jobs for recurring tasks
   - Integrate with AI agents for autonomous operations

### Example Workflows

#### Order-to-Cash
```bash
# 1. Check customer
cli-anything-minierp customers list --search "Acme"

# 2. Check stock
cli-anything-minierp inventory items get 1

# 3. Create sales order
cli-anything-minierp sales orders create --customer-id 1 --date 2026-01-15 --items '[{"item_id":1,"quantity":10}]'

# 4. Create invoice
cli-anything-minierp invoices create --customer-id 1 --date 2026-01-15 --due 2026-02-15 --items '[{"item_id":1,"quantity":10,"unit_price":100}]'

# 5. Record payment
cli-anything-minierp payments create --customer-id 1 --amount 1000 --date 2026-01-15 --method "bank"
```

#### Procure-to-Pay
```bash
# 1. Check low stock
cli-anything-minierp inventory low-stock

# 2. Create purchase order
cli-anything-minierp purchase-orders create --supplier-id 1 --order-date 2026-01-15 --expected-delivery 2026-01-25 --items '[{"item_id":1,"quantity":100}]'

# 3. Record purchase
cli-anything-minierp purchases create --supplier-id 1 --date 2026-01-25 --items '[{"item_id":1,"quantity":100}]'
```

#### Month-End Close
```bash
# 1. Generate financial reports
cli-anything-minierp reports trial-balance --as-of 2026-01-31
cli-anything-minierp reports balance-sheet --as-of 2026-01-31
cli-anything-minierp reports income-statement --start 2026-01-01 --end 2026-01-31

# 2. Export data
cli-anything-minierp utils export invoices --format csv --start 2026-01-01 --end 2026-01-31

# 3. Create backup
cli-anything-minierp utils backup --name "month-end-2026-01"
```

### Documentation

For complete usage guide, see:
- [`minierp/agent-harness/USAGE_GUIDE.md`](minierp/agent-harness/USAGE_GUIDE.md) - Comprehensive usage guide
- [`minierp/agent-harness/MINIERP.md`](minierp/agent-harness/MINIERP.md) - Project-specific analysis

------------------------------------------------------------------------

END OF SPECIFICATION
