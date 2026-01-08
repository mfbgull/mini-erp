# Mini ERP - Full-Stack Enterprise Resource Planning System

<div align="center">

![Mini ERP Logo](https://img.shields.io/badge/Mini%20ERP-Full--Stack-brightgreen)
![React 18](https://img.shields.io/badge/React-18-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![SQLite](https://img.shields.io/badge/SQLite-3.44-purple)
![Electron](https://img.shields.io/badge/Electron-Ready-yellow)
![Mobile Responsive](https://img.shields.io/badge/Mobile-Responsive-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

**A complete, production-ready ERP solution for small to medium businesses**

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Support](#support)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Mobile Features](#mobile-features)
- [Desktop App](#desktop-app)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 About

Mini ERP is a comprehensive, full-stack Enterprise Resource Planning system built with modern technologies. It provides a complete solution for managing inventory, sales, purchases, manufacturing, and reporting for small to medium businesses.

### Key Highlights

- ✅ **Production-Ready**: Complete ERP functionality with 20+ modules
- ✅ **Modern Tech Stack**: React 18, Node.js, TypeScript, SQLite
- ✅ **Mobile-First**: Fully responsive design with card-based layouts
- ✅ **Desktop Ready**: Electron integration for desktop application
- ✅ **Self-Hosted**: Runs locally with zero dependencies
- ✅ **Secure**: JWT authentication with role-based access control

---

## ✨ Features

### Core Modules

| Module | Description | Status |
|--------|-------------|--------|
| 🔐 **Authentication** | JWT-based login, logout, password management | ✅ Complete |
| 📦 **Inventory Management** | Items, warehouses, stock tracking, movements | ✅ Complete |
| 🛒 **Purchase Management** | Suppliers, purchase orders, goods receipts | ✅ Complete |
| 💰 **Sales & Invoicing** | Customers, sales orders, invoices, payments | ✅ Complete |
| 🏭 **Manufacturing** | BOM, work orders, production tracking | ✅ Complete |
| 💸 **Expenses** | Expense tracking, categories, reporting | ✅ Complete |
| 📊 **Reports** | 20+ comprehensive reports and dashboards | ✅ Complete |
| 📝 **Activity Logging** | Complete audit trail of all actions | ✅ Complete |
| ⚙️ **Settings** | System configuration and preferences | ✅ Complete |

### Key Capabilities

- **Full CRUD Operations**: Create, read, update, delete for all entities
- **Search & Filter**: Advanced filtering and search capabilities
- **Export to CSV**: Download data for external analysis
- **Real-time Updates**: Live data synchronization
- **Role-Based Access**: Admin and user roles with permissions
- **Activity Tracking**: Complete audit log of all user actions

---

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI library with hooks and functional components
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation build tool
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **React Hot Toast** - Notifications
- **Lucide React** - Beautiful icons
- **Custom CSS** - Responsive design system with CSS variables

### Backend

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe server code
- **better-sqlite3** - Fast, simple SQLite wrapper
- **JWT** - Secure token-based authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### Database

- **SQLite** - File-based, zero-configuration database
- **20+ tables** - Complete relational schema
- **Migrations** - Version-controlled schema changes
- **Indexes** - Optimized query performance

### Desktop

- **Electron** - Cross-platform desktop app framework
- **Main Process** - Native OS integration
- **Renderer Process** - Full React app
- **Preload Scripts** - Secure bridge between processes

---

## 🏗️ Architecture

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
│  │  (Optional - Runs as standalone desktop application) │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- 2GB RAM minimum
- 500MB disk space

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mfbgull/mini-erp.git
   cd mini-erp
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Start the backend server**
   ```bash
   cd server
   npm start
   ```

   The server will start on `http://localhost:3010`
   
   On first run, it will:
   - Create the SQLite database (`server/database/erp.db`)
   - Create all 20+ tables
   - Create default admin user
   - Create default warehouse

5. **Start the frontend (in a new terminal)**
   ```bash
   cd client
   npm run dev
   ```

6. **Access the application**
   - Open browser to `http://localhost:5173` (Vite dev server)
   - Or `http://localhost:3010` (Production build)

### Default Credentials

```
Username: admin
Password: admin123
```

> ⚠️ **IMPORTANT**: Change the default password after first login!

---

## 📁 Project Structure

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

---

## 🗄️ Database Schema

### Core Tables (20+ tables)

#### User Management
- `users` - User accounts with roles (admin/user)
- `settings` - System configuration

#### Inventory Module
- `items` - Product/item master
- `warehouses` - Storage locations
- `stock_movements` - Stock transactions
- `stock_balances` - Current stock levels

#### Purchasing Module
- `suppliers` - Supplier master
- `purchase_orders` - Purchase order headers
- `purchase_order_items` - PO line items
- `goods_receipts` - Receipt records
- `goods_receipt_items` - Receipt details

#### Sales Module
- `customers` - Customer master
- `sales_orders` - Sales order headers
- `sales_order_items` - SO line items
- `invoices` - Invoice headers
- `invoice_items` - Invoice details
- `payments` - Payment records
- `customer_ledger` - Customer ledger entries
- `payment_allocations` - Payment allocations

#### Manufacturing Module
- `bom` - Bill of Materials
- `bom_items` - BOM line items
- `work_orders` - Production work orders
- `material_consumption` - Material usage tracking

#### Additional Modules
- `expenses` - Expense records
- `expense_categories` - Expense categories
- `activity_log` - User activity audit trail
- `supplier_ledger` - Supplier ledger entries

---

## 🌐 API Endpoints

### Authentication
```
POST /api/auth/login              - User login
POST /api/auth/logout             - User logout
GET  /api/auth/me                 - Get current user
POST /api/auth/change-password    - Change password
```

### Inventory
```
GET  /api/inventory/items         - List items
POST /api/inventory/items         - Create item
GET  /api/inventory/items/:id     - Get item
PUT  /api/inventory/items/:id     - Update item
DELETE /api/inventory/items/:id   - Delete item
GET  /api/inventory/warehouses    - List warehouses
GET  /api/inventory/stock-movements - List movements
GET  /api/inventory/stock-balances - List stock balances
```

### Sales
```
GET  /api/sales                   - List sales
POST /api/sales                   - Create sale
GET  /api/sales/invoice           - Create invoice
GET  /api/sales/invoice/:id       - Get invoice
PUT  /api/sales/invoice/:id       - Update invoice
GET  /api/customers               - List customers
POST /api/customers               - Create customer
GET  /api/customers/:id           - Get customer
GET  /api/payments                - List payments
POST /api/payments                - Create payment
```

### Purchases
```
GET  /api/purchases               - List purchases
POST /api/purchases               - Create purchase
GET  /api/purchase-orders          - List purchase orders
POST /api/purchase-orders          - Create PO
GET  /api/purchase-orders/:id      - Get PO
GET  /api/suppliers                - List suppliers
POST /api/suppliers                - Create supplier
```

### Manufacturing
```
GET  /api/boms                    - List BOMs
POST /api/boms                    - Create BOM
GET  /api/boms/:id                - Get BOM
GET  /api/productions             - List productions
POST /api/productions             - Create production
GET  /api/productions/:id         - Get production
```

### Reports
```
GET  /api/reports/sales-summary           - Sales summary
GET  /api/reports/sales-by-customer       - Sales by customer
GET  /api/reports/sales-by-item           - Sales by item
GET  /api/reports/stock-level             - Stock levels
GET  /api/reports/stock-valuation         - Stock valuation
GET  /api/reports/inventory-movement      - Inventory movements
GET  /api/reports/low-stock               - Low stock alert
GET  /api/reports/profit-loss             - Profit & loss
GET  /api/reports/cash-flow               - Cash flow
GET  /api/reports/accounts-receivable     - A/R aging
GET  /api/reports/expenses                - Expenses report
```

### Activity Logs
```
GET  /api/activity-logs          - List activity logs
GET  /api/activity-logs/stats    - Activity statistics
GET  /api/activity-logs/recent   - Recent activity
GET  /api/activity-logs/users    - List users for filter
```

### Settings
```
GET  /api/settings               - Get settings
PUT  /api/settings               - Update settings
```

---

## 📱 Mobile Features

Mini ERP features a complete mobile-first responsive design:

### Responsive Design
- **Mobile-first approach**: Optimized for 320px - 768px screens
- **Touch-friendly**: 44px+ minimum touch targets
- **Readable typography**: Proper font sizes and spacing
- **No horizontal scroll**: Vertical scrolling only

### Mobile Transformations
- **Tables → Cards**: All data tables transform to card layouts on mobile
- **Sidebar → Hamburger menu**: Collapsible navigation
- **Forms → Stacked layout**: Vertical form inputs
- **Buttons → Full-width**: Easy tap targets

### Accessibility
- **WCAG compliant**: Proper contrast and font sizes
- **Keyboard navigation**: Full keyboard support
- **Screen reader friendly**: Semantic HTML
- **Focus indicators**: Visible focus states

---

## 🖥️ Desktop App

Mini ERP can run as a standalone desktop application using Electron:

### Features
- Native window chrome
- Offline capability
- System tray integration
- Native notifications
- File system access

### Building the Desktop App

```bash
# Install Electron dependencies
cd electron
npm install

# Package for current platform
npm run build

# Or use the build script
cd ..
npm run build:electron
```

---

## 💻 Development

### Backend Development

```bash
cd server
npm run dev    # Start with nodemon (auto-reload)
npm start      # Start production server
npm run build  # Compile TypeScript
```

### Frontend Development

```bash
cd client
npm run dev    # Start Vite dev server
npm run build  # Build for production
npm run preview  # Preview production build
```

### Running Tests

```bash
# Backend tests
cd server
npm test

# Run specific test
cd server
node test-filename.js
```

---

## 🚢 Deployment

### Production Build

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

### Environment Variables

```bash
# Server configuration
PORT=3010                          # Server port
HOST=0.0.0.0                      # Server host
NODE_ENV=production               # Environment
JWT_SECRET=your-secret-key        # JWT secret (change this!)
DATABASE_PATH=./database/erp.db   # Database path
```

### Docker (Coming Soon)

Docker Compose configuration for containerized deployment.

---

## 🔒 Security

### Implemented Security Features
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Access**: Admin and user permissions
- **SQL Injection Prevention**: Prepared statements
- **CORS Configuration**: Controlled cross-origin access
- **Input Validation**: Server-side validation

### Security Recommendations
- Change JWT_SECRET in production
- Use HTTPS in production
- Keep dependencies updated
- Regular backups of database
- Limit database file permissions
- Don't commit .env files

---

## 📊 Performance

### Optimization Techniques
- **Database Indexes**: Optimized query performance
- **React Query**: Intelligent caching and background updates
- **Lazy Loading**: Code splitting for faster initial load
- **Virtual DOM**: Efficient rendering
- **SQLite WAL Mode**: Improved concurrency

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [ERPNext](https://erpnext.com/) - Design inspiration
- [React](https://reactjs.org/) - UI framework
- [Node.js](https://nodejs.org/) - Runtime environment
- [SQLite](https://www.sqlite.org/) - Database
- [Vite](https://vitejs.dev/) - Build tool
- [TanStack Query](https://tanstack.com/query) - Data fetching

---

## 📞 Support

If you have any questions or need help, please:

1. Check the [Documentation](docs/)
2. Open an [Issue](https://github.com/mfbgull/mini-erp/issues)
3. Read the [Troubleshooting Guide](#troubleshooting)

---

<div align="center">

**Built with ❤️ by mfbgull**

[GitHub](https://github.com/mfbgull/mini-erp) • [Report Bug](https://github.com/mfbgull/mini-erp/issues) • [Request Feature](https://github.com/mfbgull/mini-erp/issues)

</div>
