# Mini ERP

A complete, production-ready ERP solution for small to medium businesses.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Vite, TanStack Query, AG-Grid |
| Backend | Node.js, Express, TypeScript, better-sqlite3 |
| Desktop | Electron (optional) |

## Quick Start

```bash
# Install dependencies
cd server && npm install && cd ../client && npm install

# Start backend (port 3011)
cd server && npm start

# Start frontend (port 5173)
cd client && npm run dev
```

**Login:** `admin` / `admin123` _(development default — change in production)_

## Features

| Module | Description |
|--------|-------------|
| Inventory | Items, warehouses, stock tracking |
| Sales | Orders, invoices, payments, customers |
| Purchases | Purchase orders, suppliers |
| Manufacturing | BOM, work orders, production |
| Expenses | Categories, expense tracking |
| Reports | 20+ reports (P&L, balance sheet, AR/AP, etc.) |

## CLI Usage

```bash
# Always use --json for structured output
cli-anything-minierp --json inventory items list

# Common commands
cli-anything-minierp auth login -u admin -p admin123  # dev default — change in production
cli-anything-minierp inventory low-stock
cli-anything-minierp reports profit-loss --start 2026-01-01 --end 2026-01-31
cli-anything-minierp utils backup --name "backup"
```

## Project Structure

```
mini-erp/
├── client/           # React frontend
├── server/           # Express backend
├── electron/         # Desktop app (optional)
├── database/         # SQLite database
└── AGENTS.md        # Agent operational rules
```

## API Base

`http://localhost:3011/api`

## Security

- JWT authentication
- bcrypt password hashing
- Role-based access (admin/user)
- Prepared statements (SQL injection prevention)

---

MIT License
