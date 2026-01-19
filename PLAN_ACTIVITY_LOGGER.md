# Activity Logger Implementation Plan

## Overview
Implement a comprehensive activity logging system that tracks all user events and actions across the MiniERP application. This will provide audit trails, user行为分析, and system监控 capabilities.

## Current State Analysis
- **Existing Infrastructure**: Basic `activity_log` table exists with fields: `user_id`, `action`, `entity_type`, `entity_id`, `description`, `timestamp`
- **Current Issue**: Activity logging is scattered throughout controllers with direct DB inserts, inconsistent, and incomplete
- **Tables**: ~22 tables in database with no centralized logging

## Requirements

### Functional Requirements
1. Log all user authentication events (login, logout, password change)
2. Log all CRUD operations across all modules
3. Log system events (scheduled tasks, backups, settings changes)
4. Provide activity log viewing interface for admins
5. Support filtering by user, entity type, date range, action type
6. Export activity logs to CSV/PDF

### Non-Functional Requirements
- Minimal performance impact (< 5ms overhead per request)
- No circular dependencies in logging
- Thread-safe concurrent logging
- Retain logs for configurable period (default: 90 days)

## Implementation Plan

### Phase 1: Backend - Activity Logging Infrastructure

#### 1.1 Create Activity Logger Service
**File**: `server/src/services/activityLogger.ts`
- Centralized activity logging service
- Async logging (fire-and-forget) to minimize performance impact
- Log levels: INFO, WARNING, ERROR
- Queue-based processing for batch inserts

#### 1.2 Create Activity Log Model
**File**: `server/src/models/ActivityLog.ts`
- CRUD operations for activity logs
- Query methods with filters (user, entity, date range)
- Aggregation methods for reports
- Log retention/cleanup methods

#### 1.3 Enhance Database Schema
**File**: `server/src/migrations/activity_log_schema.sql`
```sql
ALTER TABLE activity_log ADD COLUMN log_level TEXT DEFAULT 'INFO';
ALTER TABLE activity_log ADD COLUMN ip_address TEXT;
ALTER TABLE activity_log ADD COLUMN user_agent TEXT;
ALTER TABLE activity_log ADD COLUMN metadata TEXT; -- JSON field for extra data
ALTER TABLE activity_log ADD COLUMN duration_ms INTEGER; -- Request duration

-- Create indexes for performance
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp);
CREATE INDEX idx_activity_log_user_timestamp ON activity_log(user_id, timestamp);
CREATE INDEX idx_activity_log_entity_timestamp ON activity_log(entity_type, timestamp);
```

#### 1.4 Create Logging Middleware
**File**: `server/src/middleware/activityLogger.ts`
- Request logging middleware
- Captures: method, path, user, ip, user_agent, duration
- Auto-logs failed requests (4xx, 5xx)

#### 1.5 Create Logger Helper/Wrapper
**File**: `server/src/utils/activityLogger.ts`
- Simple helper functions for controllers
- Methods: `log()`, `logAuth()`, `logCRUD()`, `logError()`
- Type definitions for actions

### Phase 2: Backend - Update All Controllers

#### 2.1 Authentication Controller
**File**: `server/src/controllers/authController.ts`
- Login: Log successful and failed attempts
- Logout: Track user logout
- Change Password: Log password changes
- Use: `logAuth()` helper

#### 2.2 Inventory Controller
**File**: `server/src/controllers/inventoryController.ts`
- Items: CREATE, UPDATE, DELETE, RESTORE
- Warehouses: CRUD operations
- Stock Movements: All movement types

#### 2.3 Purchase Controllers
**Files**:
- `server/src/controllers/purchaseOrderController.ts`
- `server/src/controllers/purchaseController.ts`
- Log: PO creation, approval, receiving, cancellation
- Log: GRN creation, item receipts

#### 2.4 Sales Controllers
**Files**:
- `server/src/controllers/salesController.ts`
- `server/src/controllers/invoiceController.ts`
- `server/src/controllers/customersController.ts`
- Log: SO creation, invoicing, payments
- Log: Customer changes, credit limit updates

#### 2.5 Manufacturing Controllers
**Files**:
- `server/src/controllers/bomController.ts`
- `server/src/controllers/productionController.ts`
- Log: BOM creation/modification, work orders, consumption

#### 2.6 Other Controllers
- `expenseController.ts` - Expense CRUD
- `suppliersController.ts` - Supplier CRUD
- `reportsController.ts` - Report generation
- `settingsController.ts` - Settings changes
- `posController.ts` - POS transactions

### Phase 3: Backend - Activity Log API Endpoints

#### 3.1 Activity Log Routes
**File**: `server/src/routes/activityLog.ts`
```
GET /api/activity-logs              # List with pagination & filters
GET /api/activity-logs/stats        # Activity statistics
GET /api/activity-logs/user/:id     # User activity
GET /api/activity-logs/entity/:type/:id  # Entity history
GET /api/activity-logs/export       # Export to CSV
DELETE /api/activity-logs/cleanup   # Run log cleanup (admin only)
```

#### 3.2 Activity Log Controller
**File**: `server/src/controllers/activityLogController.ts`
- Handle all activity log endpoints
- Apply filters: user, entity_type, action, start_date, end_date
- Pagination support
- Statistics aggregation

### Phase 4: Frontend - Activity Log Viewer

#### 4.1 Activity Log Page
**File**: `client/src/pages/ActivityLog.tsx`
- Data table with AG Grid
- Filters: User dropdown, Entity type, Action type, Date range
- Pagination
- Export button

#### 4.2 Activity Log Context/State
**File**: `client/src/context/ActivityLogContext.tsx`
- React Query for fetching activity logs
- Cache management

#### 4.3 Activity Log Components
**Files**:
- `client/src/components/activity/ActivityFilters.tsx`
- `client/src/components/activity/ActivityTable.tsx`
- `client/src/components/activity/ActivityStats.tsx`

#### 4.4 Sidebar Integration
**File**: `client/src/components/common/Sidebar.tsx`
- Add "Activity Log" menu item under Administration

### Phase 5: Frontend - Contextual Activity Display

#### 5.1 Entity Activity History
**File**: `client/src/components/common/EntityActivity.tsx`
- Show recent activity for any entity
- Used in detail views (e.g., customer detail shows recent transactions)

#### 5.2 Activity Notifications (Optional)
- Real-time updates for admin users
- Toast notifications for critical actions

## File Structure

```
server/src/
├── controllers/
│   ├── activityLogController.ts    # NEW
│   └── [existing controllers updated]
├── middleware/
│   ├── activityLogger.ts           # NEW - Request logging middleware
│   └── auth.ts
├── models/
│   └── ActivityLog.ts              # NEW - Activity log model
├── routes/
│   └── activityLog.ts              # NEW - Activity log routes
├── services/
│   └── activityLogger.ts           # NEW - Central logging service
└── utils/
    └── activityLogger.ts           # NEW - Helper functions

client/src/
├── components/
│   └── activity/                   # NEW - Activity log components
│       ├── ActivityFilters.tsx
│       ├── ActivityStats.tsx
│       └── ActivityTable.tsx
├── context/
│   └── ActivityLogContext.tsx      # NEW
├── pages/
│   └── ActivityLog.tsx             # NEW - Activity log page
└── App.tsx                         # UPDATE - Add route
```

## Action Types Enumeration

```typescript
// Authentication
LOGIN = 'LOGIN'
LOGOUT = 'LOGOUT'
LOGIN_FAILED = 'LOGIN_FAILED'
PASSWORD_CHANGE = 'PASSWORD_CHANGE'

// Inventory
ITEM_CREATE = 'ITEM_CREATE'
ITEM_UPDATE = 'ITEM_UPDATE'
ITEM_DELETE = 'ITEM_DELETE'
WAREHOUSE_CREATE = 'WAREHOUSE_CREATE'
STOCK_MOVEMENT = 'STOCK_MOVEMENT'

// Purchases
PO_CREATE = 'PO_CREATE'
PO_UPDATE = 'PO_UPDATE'
PO_APPROVE = 'PO_APPROVE'
PO_CANCEL = 'PO_CANCEL'
GRN_CREATE = 'GRN_CREATE'

// Sales
SO_CREATE = 'SO_CREATE'
SO_UPDATE = 'SO_UPDATE'
INVOICE_CREATE = 'INVOICE_CREATE'
INVOICE_UPDATE = 'INVOICE_UPDATE'
PAYMENT_RECEIVED = 'PAYMENT_RECEIVED'

// Manufacturing
BOM_CREATE = 'BOM_CREATE'
BOM_UPDATE = 'BOM_UPDATE'
WO_CREATE = 'WO_CREATE'
WO_START = 'WO_START'
WO_COMPLETE = 'WO_COMPLETE'
MATERIAL_CONSUME = 'MATERIAL_CONSUME'

// Settings
SETTING_UPDATE = 'SETTING_UPDATE'
BACKUP_CREATE = 'BACKUP_CREATE'
```

## Migration Steps

1. Run database migration to add new columns and indexes
2. Create new logging service and utilities
3. Create activity log routes and controller
4. Update all existing controllers to use logging helpers
5. Create frontend activity log page and components
6. Add sidebar menu item
7. Test end-to-end

## Testing Plan

### Unit Tests
- ActivityLogger service methods
- Helper functions
- Controller logging calls

### Integration Tests
- API endpoints return correct data
- Logs are persisted correctly
- Filters work as expected

### Manual Testing
- Login/logout logging
- CRUD operations logging
- Frontend filtering and pagination
- Export functionality

## Rollout Considerations

- Run migration during app startup
- Backfill existing data? No - only log going forward
- Log retention: Default 90 days, configurable via settings
- Performance: Async logging with queue to avoid blocking requests
