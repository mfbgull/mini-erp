# Architecture

## System Overview

MiniERP follows a classic client-server architecture with a React SPA frontend and an Express REST API backend, backed by an embedded SQLite database.

```
Browser (React SPA)
    |
    | HTTP/REST (JSON)
    |
Express Server (port 3011)
    |
    | better-sqlite3 (synchronous)
    |
SQLite Database (WAL mode)
```

## Directory Structure

```
minierp/
  .env                              # Root environment variables
  docs/                             # Documentation
  server/
    server.ts                       # Entry point (port, host, graceful shutdown)
    src/
      app.ts                        # Express app (middleware, routes, SPA serving)
      config/
        database.ts                 # SQLite connection, schema init, migrations
      middleware/
        auth.ts                     # JWT authentication + role guard
        rateLimiter.ts              # Rate limiting (auth, API, sensitive ops)
        validation.ts               # Zod + express-validator schemas
        errorHandler.ts             # Global error handler + 404
        requestLogger.ts            # Request/response logging with timing
      routes/                       # 19 route modules
        auth.ts                     # /api/auth/*
        dashboard.ts                # /api/dashboard/*
        customers.ts                # /api/customers/*
        suppliers.ts                # /api/suppliers/*
        inventory.ts                # /api/inventory/*
        invoices.ts                 # /api/invoices/*
        payments.ts                 # /api/payments/*
        reports.ts                  # /api/reports/*
        purchases.ts                # /api/purchases
        purchaseOrders.ts           # /api/purchase-orders/*
        sales.ts                    # /api/sales/*
        production.ts               # /api/productions/*
        bom.ts                      # /api/boms/*
        expenses.ts                 # /api/expenses/*
        pos.ts                      # /api/pos/*
        settings.ts                 # /api/settings/*
        activityLog.ts              # /api/activity-logs/*
        mobileInvoices.ts           # /api/mobile-invoices/*
        integrations.ts             # /api/integrations/* (admin only)
      controllers/                  # 18 controller files (request/response handling)
      models/                       # 10 model files (database access)
      services/
        activityLogger.ts           # Activity/audit logging service
        integrations/               # Third-party service wrappers
          emailService.ts           # SendGrid
          notificationService.ts    # Twilio
          weatherService.ts         # Weatherstack
          validationService.ts      # Numverify
          currencyService.ts        # Fixer
          taxService.ts             # TaxJar
      utils/
        currency.ts                 # Safe financial arithmetic (rounding to 2 decimal places)
        ledgerUtils.ts              # Customer ledger + balance management
        logger.ts                   # Winston logger
        apiResponse.ts              # Standardized API response helpers
        queryUtils.ts               # Query parameter parsing utilities
      migrations/                   # 20 SQL migration files
      types/
        index.ts                    # Shared TypeScript interfaces
  client/
    src/
      main.tsx                      # React entry point
      App.tsx                       # Root component, routes, providers
      context/
        AuthContext.tsx              # Authentication state
        SettingsContext.tsx          # App settings
        ThemeContext.tsx             # Dark/light theme
        InvoiceContext.tsx           # Invoice wizard state
      pages/                        # Page components by module
        Dashboard.jsx               # Main dashboard
        LoginPage.tsx               # Login
        ActivityLogPage.tsx         # Activity log viewer
        customers/                  # Customer pages
        inventory/                  # Inventory pages
        sales/                      # Sales/invoice pages
        purchases/                  # Purchase pages
        suppliers/                  # Supplier pages
        invoice/                    # Mobile invoice wizard (5-step)
        bom/                        # BOM pages
        production/                 # Production pages
        expenses/                   # Expense pages
        reports/                    # 19 report pages
        pos/                        # Point of Sale
      components/
        layout/                     # Sidebar, FloatingActionButton, QuickActions
        common/                     # DataTable, Card, Modal, SearchableSelect, etc.
        invoice/                    # InvoiceWizard, InvoiceRouter, InvoiceTemplate
        customers/                  # PaymentModal
        bom/                        # BOMCard
        production/                 # ProductionCard
        expenses/                   # ExpenseCard
      utils/
        api.ts                      # Axios instance with interceptors
      assets/
        styles/
          variables.css             # CSS design tokens
          global.css                # Global styles
          mobile-responsive.css     # Mobile overrides
```

## Key Design Patterns

### Authentication Flow

1. User submits credentials to `POST /api/auth/login`
2. Server validates with bcrypt (12 rounds), generates JWT
3. JWT set as httpOnly cookie (`sameSite: strict`, `secure` in production)
4. All API requests include cookie automatically
5. `authenticateToken` middleware verifies JWT on protected routes
6. `requireAdmin` middleware guards destructive operations (delete invoice, delete payment, integrations)

### Database Access

- **Synchronous**: better-sqlite3 is synchronous by design -- no async/await needed for DB calls
- **WAL mode**: Write-Ahead Logging for better concurrent read performance
- **Transactions**: `db.transaction()` wraps multi-step operations (uses `BEGIN IMMEDIATE` for write locks)
- **Migrations**: Run sequentially on startup in `database.ts` -- each checks if already applied

### Financial Safety

- All monetary arithmetic uses `utils/currency.ts` (`parseCurrency`, `addCurrency`, `subtractCurrency`, `multiplyCurrency`) to prevent floating-point errors
- Ledger entries use transaction-wrapped running balance calculation
- Document numbers (invoices, payments, stock movements) use atomic `INSERT ON CONFLICT DO UPDATE` to prevent race conditions
- Payment recording and customer balance updates happen inside the same transaction as invoice creation

### Frontend Architecture

- **Code Splitting**: `React.lazy()` for all non-critical pages (~45 lazy-loaded components)
- **Data Fetching**: TanStack Query with 5-minute stale time and 10-minute cache
- **State Management**: React Context for auth, settings, theme, invoice wizard
- **Data Grid**: AG Grid Community for tabular data
- **Mobile**: Responsive CSS with dedicated mobile invoice wizard (5-step flow)

### Rate Limiting

| Limiter | Scope | Limit |
|---|---|---|
| `authLimiter` | Login attempts per username | 5 per 15 minutes |
| `passwordChangeLimiter` | Password changes | 3 per hour |
| `apiLimiter` | All `/api/` routes | 100 per minute |
| `sensitiveOperationLimiter` | Financial reports, exports | 10 per minute |
