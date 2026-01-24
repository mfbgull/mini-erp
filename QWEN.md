# Mini ERP - Full-Stack Enterprise Resource Planning System

## Project Overview

Mini ERP is a comprehensive, full-stack Enterprise Resource Planning system built with modern technologies. It provides a complete solution for managing inventory, sales, purchases, manufacturing, and reporting for small to medium businesses. The system is built with a React 18 frontend, Node.js/Express backend, and SQLite database, with Electron integration for desktop deployment.

### Key Features
- **Production-Ready**: Complete ERP functionality with 20+ modules
- **Modern Tech Stack**: React 18, Node.js, TypeScript, SQLite
- **Mobile-First**: Fully responsive design with card-based layouts
- **Desktop Ready**: Electron integration for desktop application
- **Self-Hosted**: Runs locally with zero dependencies
- **Secure**: JWT authentication with role-based access control

### Core Modules
- Authentication (JWT-based login, logout, password management)
- Inventory Management (Items, warehouses, stock tracking, movements)
- Purchase Management (Suppliers, purchase orders, goods receipts)
- Sales & Invoicing (Customers, sales orders, invoices, payments)
- Manufacturing (BOM, work orders, production tracking)
- Expenses (Expense tracking, categories, reporting)
- Reports (20+ comprehensive reports and dashboards)
- Activity Logging (Complete audit trail of all actions)
- Settings (System configuration and preferences)

## Project Structure

```
mini-erp/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── assets/
│   │   │   └── styles/             # CSS design system
│   │   │       ├── variables.css   # Design tokens
│   │   │       ├── global.css      # Global styles
│   │   │       └── mobile-responsive.css  # Mobile styles
│   │   ├── components/
│   │   │   ├── common/             # Reusable components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── FormInput.tsx
│   │   │   │   └── SearchableSelect.tsx
│   │   │   ├── layout/
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── customers/
│   │   │   │   └── PaymentModal.tsx
│   │   │   └── invoice/
│   │   │       └── InvoiceTemplate.tsx
│   │   ├── context/                # React contexts
│   │   │   ├── AuthContext.tsx     # Authentication state
│   │   │   ├── ActivityLogContext.tsx
│   │   │   ├── SettingsContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── pages/                  # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.tsx
│   │   │   ├── ActivityLog.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── inventory/          # Inventory pages
│   │   │   ├── sales/              # Sales pages
│   │   │   ├── purchases/          # Purchase pages
│   │   │   ├── production/         # Manufacturing pages
│   │   │   ├── customers/          # Customer pages
│   │   │   ├── suppliers/          # Supplier pages
│   │   │   ├── bom/                # BOM pages
│   │   │   ├── expenses/           # Expense pages
│   │   │   ├── reports/            # Report pages (20+)
│   │   │   └── pos/                # Point of Sale
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript types
│   │   ├── utils/
│   │   │   ├── api.ts              # Axios API client
│   │   │   ├── format.ts           # Formatting utilities
│   │   │   └── exportUtils.ts      # Export utilities
│   │   ├── App.tsx                 # Main app component
│   │   └── main.tsx                # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts         # SQLite connection & migrations
│   │   ├── controllers/            # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── inventoryController.ts
│   │   │   ├── salesController.ts
│   │   │   ├── purchaseController.ts
│   │   │   ├── productionController.ts
│   │   │   ├── customersController.ts
│   │   │   ├── suppliersController.ts
│   │   │   ├── expenseController.ts
│   │   │   ├── activityLogController.ts
│   │   │   ├── reportsController.ts
│   │   │   └── settingsController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT authentication
│   │   │   ├── errorHandler.ts     # Error handling
│   │   │   └── activityLogger.ts   # Activity logging
│   │   ├── migrations/             # Database migrations
│   │   │   ├── init.sql            # Initial schema
│   │   │   ├── add-activity-log-fields.sql
│   │   │   ├── add-bom-tables.sql
│   │   │   ├── add-expenses-table.sql
│   │   │   ├── create-customer-ledger.sql
│   │   │   └── ... (15+ migration files)
│   │   ├── models/                 # Data models
│   │   │   ├── ActivityLog.ts
│   │   │   ├── Item.ts
│   │   │   ├── Warehouse.ts
│   │   │   ├── StockMovement.ts
│   │   │   ├── Sale.ts
│   │   │   ├── Purchase.ts
│   │   │   ├── Production.ts
│   │   │   └── BOM.ts
│   │   ├── routes/                 # API routes
│   │   │   ├── auth.ts
│   │   │   ├── inventory.ts
│   │   │   ├── sales.ts
│   │   │   ├── purchases.ts
│   │   │   ├── production.ts
│   │   │   ├── customers.ts
│   │   │   ├── suppliers.ts
│   │   │   ├── expenses.ts
│   │   │   ├── activityLog.ts
│   │   │   ├── reports.ts
│   │   │   └── settings.ts
│   │   ├── services/               # Business logic
│   │   │   └── activityLogger.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── documentNumbering.ts
│   │   │   └── ledgerUtils.ts
│   │   └── app.ts                  # Express app
│   ├── server.ts                   # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── electron/                       # Electron Desktop App
│   ├── main.js                     # Main process
│   ├── preload.js                  # Preload script
│   └── package.json
│
├── database/                       # Database files (local only)
│   ├── erp.db                      # SQLite database
│   └── backups/                    # Backup directory
│
├── docs/                           # Documentation
├── README.md                       # This file
├── package.json                    # Root package.json
└── .gitignore                      # Git ignore rules
```

## Building and Running

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- 2GB RAM minimum
- 500MB disk space

### Installation
1. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

#### Development Mode
1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   The server will start on `http://localhost:3010`

2. **Start the frontend (in a new terminal)**
   ```bash
   cd client
   npm run dev
   ```

3. **Access the application**
   - Open browser to `http://localhost:5173` (Vite dev server)

#### Using Start Scripts
- **Linux/Mac**: Run `./start.sh` to start both backend and frontend
- **Windows**: Run `start.bat` to start both backend and frontend

### Default Credentials
```
Username: admin
Password: admin123
```

### Building for Production
1. **Build frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Build backend**
   ```bash
   cd server
   npm run build
   ```

3. **Start server**
   ```bash
   cd server
   npm start
   ```

### Building Desktop Application
```bash
# Install all dependencies
npm run install-deps

# Build client
npm run build-client

# Build Windows installer
npm run dist-win
```

The installer will be created in the `dist` directory as `Mini ERP Setup 1.0.0.exe`.

## Development Conventions

### Frontend (React + TypeScript)
- Use functional components with hooks
- Follow the import grouping order: React libraries → Third-party → Context/Hooks → Components → Styles
- Use PascalCase for component names and camelCase for variables/functions
- Use CSS variables from `client/src/assets/styles/variables.css`
- Use react-hot-toast for notifications
- Use TanStack Query for server state and caching

### Backend (Node.js + Express + TypeScript)
- Use prepared statements for all database queries
- Implement proper error handling with try/catch blocks
- Follow the file structure: controllers → routes → middleware → services → models → config → migrations → types → utils
- Use camelCase for functions and UPPER_CASE for constants
- Use snake_case for database column names and camelCase for API responses

### Database (SQLite)
- The system uses 20+ tables with a complete relational schema
- Includes tables for users, items, warehouses, stock movements, purchases, sales, manufacturing, expenses, and activity logs
- Migrations are version-controlled and applied automatically on first run

### Security
- JWT-based authentication with role-based access control
- Passwords are hashed using bcrypt
- SQL injection prevention through prepared statements
- CORS configuration for controlled cross-origin access

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Inventory
- `GET /api/inventory/items` - List items
- `POST /api/inventory/items` - Create item
- `GET /api/inventory/items/:id` - Get item
- `PUT /api/inventory/items/:id` - Update item
- `DELETE /api/inventory/items/:id` - Delete item
- `GET /api/inventory/warehouses` - List warehouses
- `GET /api/inventory/stock-movements` - List movements
- `GET /api/inventory/stock-balances` - List stock balances

### Sales
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/invoice` - Create invoice
- `GET /api/sales/invoice/:id` - Get invoice
- `PUT /api/sales/invoice/:id` - Update invoice
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment

### Reports
- `GET /api/reports/sales-summary` - Sales summary
- `GET /api/reports/stock-level` - Stock levels
- `GET /api/reports/profit-loss` - Profit & loss
- `GET /api/reports/accounts-receivable` - A/R aging
- `GET /api/reports/expenses` - Expenses report
- And many more report endpoints

## Business Workflow

The system follows a complete business workflow:
1. **Purchase Raw Materials**: Create purchase orders, receive goods, update stock
2. **Production**: Define bill of materials, record production, consume raw materials, create finished goods
3. **Sell Finished Goods**: Record sales, create invoices, deduct stock, receive payments
4. **Record Operating Expenses**: Track business expenses by category

Profit calculation is based on:
- Revenue = Sum of all invoice sales
- COGS = Sum of (quantity_sold × item.standard_cost)
- Expenses = Sum of all paid expenses
- Net Profit = Revenue - COGS - Expenses

## Key Reports Available

- Profit & Loss Report
- Sales Summary
- Stock Valuation
- Cash Flow Report
- Accounts Receivable Aging
- Sales by Customer
- Sales by Item
- Inventory Movement Report
- Purchase Summary
- Supplier Analysis
- Production Summary
- BOM Usage Report
- Expense Reports

## Desktop Application

The system can run as a standalone desktop application using Electron with features:
- Native window chrome
- Offline capability
- System tray integration
- Native notifications
- File system access

The desktop application stores data in `%APPDATA%\Mini ERP\` on Windows, which includes the SQLite database file and user settings.