# AGENTS.md

# Mini ERP -- Dual Mode AI Agent Specification

Version: 3.1\
Modes: ASSISTANT MODE (Collaborative) | AUTONOMOUS MODE (Self-Executing + Self-Auditing)

Default: ASSISTANT MODE if the user has not explicitly specified a mode (e.g., by saying "Operate in AUTONOMOUS MODE"). The agent should assume ASSISTANT MODE until told otherwise.

---

# 1. PURPOSE

This document defines operational rules for AI agents (including but not limited to Claude Code, Sisyphus, Opencode, and any LLM-based coding agent) working in the Mini ERP codebase. The agent reading this document should apply the rules that match its current operating mode (see §12).

**Modes:**
1. ASSISTANT MODE → advisory + guided execution
2. AUTONOMOUS MODE → independent execution + mandatory self-audit

---

# 2. SYSTEM ARCHITECTURE (NON-NEGOTIABLE)

**Frontend:** React + Vite + TypeScript + TanStack Query + AG-Grid (desktop) + Compact Card System (mobile)

**Backend:** Node.js + Express + TypeScript + SQLite (better-sqlite3) + Layered architecture

Architecture must not be changed without explicit approval.

---

# 3. GLOBAL ENGINEERING RULES

## 3.1 Type Safety
- No `any`, `as any`, `@ts-ignore`, or suppressed TypeScript errors
- All props and API responses must be typed
- Define interfaces in `/types` if unclear

## 3.2 Error Handling
**Backend:** All controllers wrapped in try/catch, structured JSON response, no stack trace leaks

**Frontend:** Async wrapped in try/catch, toast feedback required, loading states required, no empty catch blocks

## 3.3 Database Rules
- Prepared statements only (no string-interpolated SQL)
- Transactions for multi-step writes
- Schema changes require migration files
- No silent DB changes

## 3.4 Security
- Validate all inputs
- Protect authenticated routes
- Never log secrets or passwords
- Never trust client data

---

# 4. MODE DEFINITIONS

## ASSISTANT MODE

**Role:** Provide guidance, suggest improvements, generate code on request, ask clarifying questions before major changes

**Rules:**
1. Do NOT modify architecture unless asked
2. Explain tradeoffs when proposing structural changes
3. Highlight risks before refactors
4. Provide implementation plan before large changes
5. Prefer minimal-diff changes

**Completion:** Solution compiles, type-safe, follows architecture, no breaking changes

## AUTONOMOUS MODE

**Role:** Execute independently, refactor when needed, enforce standards, self-audit before completion

**Privileges:** May refactor for type safety, reorganize internal code, optimize performance, remove dead code

**Restrictions:** Cannot change DB schema without migration, cannot change API contract without approval, cannot replace architectural stack, cannot introduce new frameworks

---

# 5. SELF-AUDIT PROTOCOL (AUTONOMOUS MODE)

Before declaring completion, verify:
1. Zero TypeScript errors
2. No console warnings
3. No unused imports
4. No duplicated logic introduced
5. Mobile layout validated (<768px)
6. Desktop layout validated
7. API response structure consistent
8. Error handling exists everywhere
9. All DB changes include migration
10. No security rule violated
11. No performance regression

If any check fails → continue refining.

---

# 6. FRONTEND EXECUTION RULES

## Desktop vs Mobile

All list pages must:
- **Desktop:** Use AG-Grid
- **Mobile (<768px):** Use Compact Card View with search, three-dot menu, detail modal, mobile action bar

No exceptions.

---

# 7. BACKEND LAYER DISCIPLINE

Routes → endpoint definitions only\
Controllers → request/response\
Services → business logic\
Models → database access

Never mix layers.

---

# 8. PERFORMANCE STANDARDS

**Frontend:** Avoid unnecessary re-renders, memoize heavy components, avoid inline functions in large lists

**Backend:** Avoid N+1 queries, use indexes appropriately, use transactions efficiently

---

# 9. CHANGE IMPACT ANALYSIS (AUTONOMOUS MODE)

Before major refactor:
1. Identify affected modules
2. Check cross-layer impact
3. Evaluate DB implications
4. Verify no circular dependencies
5. Preserve API contract

---

# 10. FAILURE CONDITIONS

The following conditions indicate the task is incomplete and must be remediated before declaring done:
- TypeScript errors remain
- Mobile view broken
- API contract inconsistent
- Schema changed without migration
- Security rule violated
- Architecture boundary broken

The agent should flag these to the user and continue refining — not self-terminate.

---

# 11. DEFINITION OF DONE

Task complete only when:
- Fully typed
- Fully error-handled
- Architecturally consistent
- Mobile + Desktop verified
- Self-audit passed (Autonomous Mode)
- No suppressed errors

---

# 12. MODE SWITCH INSTRUCTION

The user can switch modes by saying "Operate in ASSISTANT MODE" or "Operate in AUTONOMOUS MODE". The agent should not self-activate AUTONOMOUS MODE unless the user has explicitly requested it. If in doubt, stay in ASSISTANT MODE.

---

# 13. CLI TOOL INTEGRATION

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

## Knowledge Graph (Optional)

For architectural questions, see:
- **Visualization**: `graphify-out/graph.html`
- **Data**: `graphify-out/graph.json`

Shows: 1199 nodes, 1411 edges, communities (AR/AP Reports, Core ERP, Activity Logging, etc.)

**NOT for**: day-to-day queries. Use grep/explore agents instead.

---

END OF SPECIFICATION

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
