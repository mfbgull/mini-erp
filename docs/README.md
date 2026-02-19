# MiniERP Documentation

MiniERP is a full-stack Enterprise Resource Planning system for small businesses. It covers inventory management, purchasing, sales, manufacturing, invoicing, payments, expenses, and financial reporting.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, TypeScript, React Router 7, TanStack Query |
| Backend | Node.js, Express 5, TypeScript |
| Database | SQLite (better-sqlite3, WAL mode) |
| Auth | JWT (httpOnly cookies, HS256, 24h expiry) |
| UI | AG Grid, Chart.js, Lucide icons, react-hot-toast |
| PDF | jsPDF + jspdf-autotable + html2canvas |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd minierp

# Create environment file
cp server/.env.example .env
# Edit .env and set a strong JWT_SECRET

# Install server dependencies
cd server
npm install
npm run build

# Install client dependencies
cd ../client
npm install
```

### Running in Development

```bash
# Terminal 1 - Start the server
cd server
npm start
# Server runs at http://localhost:3011

# Terminal 2 - Start the client
cd client
npm run dev
# Client runs at http://localhost:5173
```

### Default Credentials

- **Username:** `admin`
- **Password:** `admin123`

Change the password after first login via Settings.

### Production Build

```bash
# Build client
cd client
npm run build

# Build server
cd ../server
npm run build

# Start production server (serves client from dist/)
NODE_ENV=production npm start
```

## Documentation Index

| Document | Description |
|---|---|
| [Architecture](./ARCHITECTURE.md) | System architecture, modules, directory structure |
| [API Reference](./API.md) | All REST API endpoints with request/response details |
| [Database Schema](./DATABASE.md) | All tables, columns, relationships, and migrations |
| [Configuration](./CONFIGURATION.md) | Environment variables, settings, and integrations |
| [Deployment](./DEPLOYMENT.md) | Production deployment, security checklist, Electron packaging |

## Modules

| Module | Description |
|---|---|
| **Inventory** | Items, warehouses, stock movements, stock balances |
| **Purchasing** | Purchase orders, goods receipts, direct purchases, supplier management |
| **Sales** | Invoices, payments, payment allocations, POS, customer management |
| **Manufacturing** | Bill of Materials (BOM), production recording, material consumption |
| **Expenses** | Expense tracking with categories, approval, reporting |
| **Reports** | 19 financial and operational reports (P&L, AR aging, cash flow, stock valuation, etc.) |
| **Integrations** | SendGrid (email), Twilio (SMS), Weatherstack, Numverify, Fixer (currency), TaxJar |

## License

MIT
