# Dashboard Customization — Specification (v3)

## Overview

Allow users to fully customize their dashboard via a drag-and-drop interface: add/remove blocks, rearrange them freely, resize them, configure each block's settings, and persist the layout per user on the server.

---

## 1. Block Catalog (15 Types)

Users can add any of the following blocks to their dashboard. Each block has a default size and can be resized.

| # | Block Type | Description | Default Size | Data Source | Required Permission |
|---|-----------|-------------|-------------|-------------|-------------------|
| 1 | **Stat Cards** | Total Items, Stock Value, Sales Revenue, Production Runs in a compact row | 3×1 | `GET /api/dashboard/summary` | `dashboard:read` |
| 2 | **Sales vs Purchases Chart** | Line chart — last 7 days sales vs purchases | 2×2 | `GET /api/dashboard/summary` (salesByDay + purchasesByDay) | `dashboard:read` |
| 3 | **Stock by Category Chart** | Doughnut chart — stock distribution across categories | 1×2 | `GET /api/dashboard/summary` (stockByCategory) | `dashboard:read` |
| 4 | **Low Stock Alerts** | List of items below reorder level | 1×2 | `GET /api/dashboard/summary` (lowStockItems) | `inventory:read` |
| 5 | **Quick Actions** | Grid of shortcut buttons to common pages. Coexists with the FloatingActionButton | 1×1 | Static / hardcoded links | `dashboard:read` |
| 6 | **Recent Activity Feed** | Latest system activity | 2×2 | `GET /api/activity-log/recent` | `activity_log:read` |
| 7 | **AR Summary / Aging** | Accounts Receivables snapshot with aging buckets | 2×2 | `GET /api/dashboard/ar-summary` (aggregated endpoint — see note below) | `reports:read` |
| 8 | **Top Customers** | Top N customers by revenue | 1×2 | `GET /api/dashboard/top-customers?limit=N` | `reports:read` |
| 9 | **Forecast Snapshot** | Forecast KPIs: tracked items, need restock, avg confidence | 1×1 | `GET /api/forecasts/dashboard` | `forecasts:read` |
| 10 | **Sales Summary** | Today / This Week / This Month sales totals | 1×1 | `GET /api/dashboard/sales-summary?period=today|week|month` | `sales:read` |
| 11 | **Expense Summary** | Recent expenses and period totals | 1×1 | `GET /api/dashboard/expense-summary?period=week|month` | `expenses:read` |
| 12 | **Production Status** | Active production orders and completion rates | 1×2 | `GET /api/dashboard/production-status` | `production:read` |
| 13 | **Stock Movement Summary** | Recent stock in/out movements | 2×2 | `GET /api/dashboard/stock-movement-summary?days=7` | `inventory:read` |
| 14 | **Custom Text / Heading** | User-editable heading or notes block. Edited by double-clicking inline (textarea). On blur, the text is saved to `config.text` and triggers the debounced auto-save. Falls back to settings popover textarea on mobile. | 2×1 | Static text saved in layout `config.text` | `dashboard:read` |
| 15 | **KPI Gauge** | Single-metric gauge widget (see KPI metric catalog below) | 1×1 | `GET /api/dashboard/kpi?metric=<name>` | `dashboard:read` |

### AR Summary — Data Format Note

The existing `GET /api/reports/ar-aging` endpoint returns per-customer data (`ARAgingCustomer[]`). For a dashboard block, the useful display is **aggregated totals**. Two approaches:

The block uses a dedicated aggregated endpoint:
```
GET /api/dashboard/ar-summary
→ { data: { total_ar, current_amount, amount_1_30, amount_31_60, amount_61_90, amount_over_90, customer_count } }
```
This is the preferred approach over aggregating the per-customer `GET /api/reports/ar-aging` response client-side.

### KPI Gauge — Metric Catalog

The KPI Gauge block lets users select from a catalog of predefined metrics. Each metric has a display label, unit, and a SQL computation.

| Metric Key | Label | Unit | SQL Query |
|-----------|-------|------|-----------|
| `inventory_turnover` | Inventory Turnover | ratio | `SELECT (SELECT COALESCE(SUM(total_cost), 0) FROM purchases WHERE purchase_date >= date('now', '-12 months')) / NULLIF((SELECT AVG(current_stock * standard_cost) FROM items WHERE is_active = 1), 0)` |
| `avg_days_to_pay` | Avg Days to Pay | days | `SELECT COALESCE(AVG(julianday(paid_amount, payment_date) - julianday(invoice_date)), 0) FROM invoices WHERE status = 'Paid' AND paid_amount > 0` |
| `total_active_items` | Active Items | count | Already available from `GET /api/dashboard/summary` (`totalItems`) |
| `stock_health` | Stock Health | % | `SELECT ROUND(100.0 * (SELECT COUNT(*) FROM items WHERE is_active = 1 AND current_stock > reorder_level) / NULLIF((SELECT COUNT(*) FROM items WHERE is_active = 1), 0), 1)` |
| `outstanding_receivables` | Outstanding AR | currency | `SELECT COALESCE(SUM(balance_amount), 0) FROM invoices WHERE status IN ('Unpaid', 'Partially Paid', 'Overdue')` |
| `monthly_revenue` | Monthly Revenue | currency | `SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE strftime('%Y-%m', invoice_date) = strftime('%Y-%m', 'now') AND status != 'Cancelled'` |

The KPI Gauge block's `config.metric` stores the metric key. The `GET /api/dashboard/kpi?metric=<key>` endpoint uses a switch statement to run the corresponding query.

### Reserved Block Type: `deprecated_block`

A fallback for forward compatibility. If a future update removes a block type (e.g., deprecates `kpi_gauge`), existing layouts containing it render as a "Deprecated block" placeholder with:
- The original block title and a warning icon
- Text explaining the block is no longer available
- A "Remove" button (always visible, even outside edit mode)

### Block Data Requirements

**New backend endpoints needed:**
- `GET /api/dashboard/top-customers?limit=5` — lightweight: `{ data: [{ customer_name, total_revenue, invoice_count }] }`
- `GET /api/dashboard/sales-summary?period=today|week|month` — `{ data: { period_total, count } }`
- `GET /api/dashboard/expense-summary?period=week|month` — `{ data: { period_total, count } }`
- `GET /api/dashboard/production-status` — `{ data: { active, completed, cancelled, total } }`
- `GET /api/dashboard/stock-movement-summary?days=7` — `{ data: { inbound_qty, outbound_qty, net } }`
- `GET /api/dashboard/kpi?metric=inventory_turnover` — `{ data: { metric, value, unit, label } }`
- `GET /api/dashboard/ar-summary` — aggregated AR totals (if Option A chosen)

**Existing endpoints available:**
- `GET /api/dashboard/summary` — stat cards, sales/purchases chart data, stock by category, low stock alerts
- `GET /api/activity-log/recent` — recent activity feed
- `GET /api/reports/ar-aging` — AR aging buckets (for AR Summary block, if aggregating client-side)
- `GET /api/forecasts/dashboard` — forecast snapshot

---

## 2. Layout System

### Grid
- **3-column grid** — columns are equal width, calculated from the dashboard container width
- Each cell is 1 column wide × fixed row height (e.g., `min(200px, 30vh)`)
- Blocks occupy a rectangular region of `width × height` in grid units
- Blocks snap to the nearest grid cell while being dragged
- During resize, edges snap to grid lines

### Block Sizing
- **Preset sizes:** Small (1×1), Medium (2×1 or 1×2), Large (2×2) — selectable from the block settings popover
- **Drag-to-resize:** A resize handle on the bottom-right corner of each block allows free dragging; the block snaps to grid on release
- Minimum size: 1×1
- Maximum size: 3×3

### Default Layout (Smart Defaults)
When a user first visits the dashboard and has no saved layout, the client renders the default layout immediately (from a local constant). It is silently saved to the server **only when the user first enters edit mode** or makes an edit — not on initial page load.

```
Row 1:  [ Stat Cards (3×1) ]
Row 2:  [ Sales vs Purchases (2×2) ] [ Stock by Category (1×2) ]
Row 3:  [ Low Stock Alerts (1×2) ] [ Quick Actions (1×1) ] [ Forecast Snapshot (1×1) ]
                                                              [ Top Customers (1×2) ]
```

---

## 3. Edit Mode

### Activation
- A **"Customize"** toggle button in the dashboard header
- When edit mode is ON:
  - An overlay/dim effect is applied to the dashboard (subtle overlay)
  - A **block palette panel** slides in from the right (Report Builder style)
  - Each block reveals: drag handle (top-left), settings icon (top-right), delete icon (top-right), resize handle (bottom-right)
  - Background interactions (keyboard shortcuts `Alt+N`, `Alt+R`, link clicks) are **suppressed**
    - Suppression mechanism: The `useKeyboardShortcut` hook (already used in Dashboard.tsx) supports a `context` filter. Pass an `enabled` boolean derived from `!isEditing` to each shortcut registration. When `isEditing` is true, `useKeyboardShortcut` skips executing the action.
  - **New edit-mode keyboard shortcuts** become active:
    - `Escape` — exit edit mode
    - `Delete` / `Backspace` — remove the focused/selected block (if any)
    - `Ctrl+Z` — undo last action (add, remove, move, resize)
    - `Ctrl+Shift+Z` — redo last undone action
  - The FloatingActionButton is conditionally hidden: `{!isEditing && <FloatingActionButton />}`
- When edit mode is OFF:
  - Dashboard returns to normal view
  - All control handles are hidden
  - Blocks are non-interactive (no drag, no resize)
  - Original keyboard shortcuts (`Alt+N`, `Alt+R`) are restored

### Save-State Indicator
In edit mode, the customization header shows a save state indicator:

| State | Color | Behavior |
|-------|-------|----------|
| "Saved" | Green | Last save confirmed; auto-clears after 3s |
| "Unsaved changes" | Amber | Changes pending debounced auto-save |
| "Saving..." | Blue with spinner | Auto-save request in flight |
| "Save failed" | Red | Auto-save failed (network/server error). See auto-save error handling below |

**Auto-save error handling:**
- On first auto-save failure → show "Save failed" (red), keep allowing edits
- On first failure → auto-retry once after **3 seconds**
- On second failure → stay in "Save failed" state; user must manually click "Save" to retry
- Manual "Save" button always available in the header (even during auto-save)
- The red "Save failed" state does NOT block further edits — the local state is always preserved

### Block Palette (Right Panel)
- Shows all 15 available block types in a scrollable list, **filtered by user permissions** (see Required Permission column in §1)
- Each block type has:
  - Name, icon, brief description
  - A preview of the default size
  - An **"Add to Dashboard"** button or drag-to-add
- **Insertion position:** New blocks are always added at the **bottom** of the dashboard (highest `y` + 1). This is predictable and avoids unexpected layout shifts. Users can then drag blocks to their desired position.
- Already-added blocks show "Added" or are hidden from the palette
- Dragging a block type from the palette onto the dashboard also adds it at the bottom (drop position is ignored for palette → dashboard adds)

### Block Settings (Inline Popover)
When a user clicks the settings icon on a block in edit mode:
- An inline popover appears near the block
- Settings include:
  - **Block title** (editable text input)
  - **Size** (preset buttons: Small / Medium / Large)
  - **Refresh interval** (dropdown: None / 30s / 60s / 5min / 15min)
  - **Data filters** (block-specific)
  - **Delete block** button (with confirmation showing the block title)
- The popover closes when clicking outside or pressing Escape

---

## 4. Data Model

### Database Table: `dashboard_layouts`

```sql
CREATE TABLE dashboard_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  layout_name TEXT DEFAULT 'Default',
  blocks TEXT NOT NULL,  -- JSON array of block configurations
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, layout_name)
);
```

### Block JSON Schema (stored in `blocks` column)

```json
[
  {
    "id": "uuid-string",
    "type": "sales_vs_purchases_chart",
    "title": "Sales vs Purchases",
    "x": 0,          // grid column position (0-indexed)
    "y": 1,          // grid row position (0-indexed)
    "width": 2,      // in grid columns (1-3)
    "height": 2,     // in grid rows (1-3)
    "visible": true,
    "version": 1,     // schema version for forward compatibility
    "config": {
      "refreshInterval": 60,  // seconds; 0 = no auto-refresh
      "text": "",             // for custom_text block
      "metric": "inventory_turnover",  // for kpi_gauge block
      "limit": 5              // for top_customers block
    }
  }
]
```

**`version` field**: Starts at `1`. If a future update changes the block schema, the version is bumped. Unknown block types or incompatible versions render as a `deprecated_block` placeholder (see §1).

### TypeScript Types (to add to client/src/types/index.ts and server/src/types/index.ts)

```typescript
type DashboardBlockType =
  | 'stat_cards'
  | 'sales_vs_purchases_chart'
  | 'stock_by_category_chart'
  | 'low_stock_alerts'
  | 'quick_actions'
  | 'recent_activity'
  | 'ar_summary'
  | 'top_customers'
  | 'forecast_snapshot'
  | 'sales_summary'
  | 'expense_summary'
  | 'production_status'
  | 'stock_movement_summary'
  | 'custom_text'
  | 'kpi_gauge'
  | 'deprecated_block';  // fallback for removed types

interface DashboardBlockConfig {
  refreshInterval?: number;  // seconds, 0 = no refresh
  text?: string;             // for custom_text block
  metric?: string;           // for kpi_gauge block
  limit?: number;            // for top_customers and similar
  [key: string]: unknown;
}

interface DashboardBlock {
  id: string;
  type: DashboardBlockType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  version: number;        // schema version, starts at 1
  config: DashboardBlockConfig;
}

interface DashboardLayout {
  id: number;
  user_id: number;
  layout_name: string;
  blocks: DashboardBlock[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// For the undo/redo stack
interface DashboardEditAction {
  type: 'add' | 'remove' | 'move' | 'resize' | 'config_change';
  blockId: string;
  previous: Partial<DashboardBlock> | null;
  current: Partial<DashboardBlock> | null;
}
```

---

## 5. API Endpoints

All layout endpoints live under `/api/dashboard/layout*` using the existing dashboard route file:

| Method | Endpoint | Description | Auth (requirePermission) |
|--------|----------|-------------|--------------------------|
| `GET` | `/api/dashboard/layout/active` | Get the active layout for the current user | `dashboard`, `read` |
| `POST` | `/api/dashboard/layout` | Create a new layout (initial save) | `dashboard`, `create` |
| `PUT` | `/api/dashboard/layout/:id` | Update an existing layout's blocks + `updated_at` | `dashboard`, `update` |
| `PATCH` | `/api/dashboard/layout/:id/rename` | Rename a layout | `dashboard`, `update` |
| `DELETE` | `/api/dashboard/layout/:id` | Delete a layout | `dashboard`, `delete` |
| `GET` | `/api/dashboard/layouts` | List all layouts for the current user | `dashboard`, `read` |
| `PUT` | `/api/dashboard/layout/:id/activate` | Set a layout as active (deactivates others) | `dashboard`, `update` |
| `GET` | `/api/dashboard/top-customers` | Top customers by revenue | `dashboard`, `read` |
| `GET` | `/api/dashboard/sales-summary` | Sales totals by period | `dashboard`, `read` |
| `GET` | `/api/dashboard/expense-summary` | Expense totals by period | `dashboard`, `read` |
| `GET` | `/api/dashboard/production-status` | Production status counts | `dashboard`, `read` |
| `GET` | `/api/dashboard/stock-movement-summary` | Stock movement totals | `dashboard`, `read` |
| `GET` | `/api/dashboard/kpi` | KPI calculation | `dashboard`, `read` |
| `GET` | `/api/dashboard/ar-summary` | Aggregated AR totals (if Option A chosen) | `dashboard`, `read` |

### Permission Seed Data

In `server/src/config/database.ts`, add to the `seedDefaultPermissions()` function:

```typescript
// Dashboard layouts
{ name: 'dashboard_layouts:read', module: 'dashboard', action: 'read', description: 'View dashboard layouts' },
{ name: 'dashboard_layouts:create', module: 'dashboard', action: 'create', description: 'Create dashboard layouts' },
{ name: 'dashboard_layouts:update', module: 'dashboard', action: 'update', description: 'Update dashboard layouts' },
{ name: 'dashboard_layouts:delete', module: 'dashboard', action: 'delete', description: 'Delete dashboard layouts' },
```

### Database Migration

New migration file: `server/src/migrations/dashboard-layouts.sql`

```sql
CREATE TABLE dashboard_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  layout_name TEXT DEFAULT 'Default',
  blocks TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, layout_name)
);

CREATE INDEX idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);
CREATE INDEX idx_dashboard_layouts_active ON dashboard_layouts(is_active);
```

Rollback file: `server/src/migrations/rollbacks/rollback-dashboard-layouts.sql`

```sql
DROP TABLE IF EXISTS dashboard_layouts;
```

---

## 6. Frontend Architecture

### New Files
```
client/src/
  pages/
    Dashboard.tsx          ← REFACTOR this existing file
    Dashboard.css          ← REFACTOR this existing file
  components/
    dashboard/
      DashboardLayout.tsx      ← Main layout component with grid + drag system
      DashboardLayout.css
      DashboardBlock.tsx       ← Single block wrapper (drag handles, resize, settings)
      DashboardBlock.css
      DashboardBlockPalette.tsx ← Right-side block catalog panel
      DashboardBlockPalette.css
      BlockSettingsPopover.tsx ← Inline popover for block settings
      BlockSettingsPopover.css
      blocks/
        StatCardsBlock.tsx
        SalesPurchasesChartBlock.tsx
        StockByCategoryBlock.tsx
        LowStockAlertsBlock.tsx
        QuickActionsBlock.tsx
        RecentActivityBlock.tsx
        ARSummaryBlock.tsx
        TopCustomersBlock.tsx
        ForecastSnapshotBlock.tsx
        SalesSummaryBlock.tsx
        ExpenseSummaryBlock.tsx
        ProductionStatusBlock.tsx
        StockMovementSummaryBlock.tsx
        CustomTextBlock.tsx
        KPIGaugeBlock.tsx
        DeprecatedBlock.tsx     ← Fallback for removed/unknown block types
  hooks/
    useDashboardLayout.ts    ← Hook: load/save layout, manage drag state, undo/redo
  utils/
    dashboardBlockRegistry.ts ← Registry mapping block types to components, default sizes, etc.
```

### Component Tree

```
DashboardPage
├── DashboardHeader (customize toggle, title, save-state indicator)
├── DashboardEditOverlay (conditional — shown in edit mode)
│   ├── DashboardLayout  (3-column grid, read from layout state)
│   │   └── DashboardBlock (wraps each block with drag/resize/settings)
│   │       ├── DragHandle
│   │       ├── SettingsButton → BlockSettingsPopover
│   │       ├── ResizeHandle (bottom-right)
│   │       ├── DeleteButton (top-right, with confirmation)
│   │       └── [BlockComponent] (renders actual content)
│   └── DashboardBlockPalette (right panel — available block types)
│       └── PaletteItem (each type with add button)
│           ├── BlockTypeIcon
│           ├── BlockTypeName + Description
│           └── AddButton or "Added" badge
└── [Normal View — edit mode OFF]
    └── DashboardLayout (read-only, no handles)
        └── DashboardBlock (no controls)
            └── [BlockComponent]
```

### Drag and Drop Implementation

Use `@dnd-kit` (already installed):
- `@dnd-kit/core` — DndContext, DragOverlay, useDraggable, useDroppable
- `@dnd-kit/sortable` — SortableContext, arrayMove (for reordering within grid)
- `@dnd-kit/utilities` — CSS transform utilities
- Custom `useDashboardLayout` hook manages:
  - Current block positions (stored as grid x, y, width, height)
  - Collision detection for placement (find nearest valid cell)
  - Grid calculation (3 columns, responsive row height)
  - Auto-scroll when dragging near edges
  - **Undo/redo stack** — each action (add, remove, move, resize, config_change) pushes to the stack
  - **localStorage cache** — layout is cached locally for instant load before server response

### Grid Calculation

```
Container width = dashboard-content.clientWidth
Grid cell width = (container width - gaps) / 3
Grid cell height = fixed (e.g., min(200px, 30vh))
Block position = (x * cell width + gap * x, y * cell height + gap * y)
Block size = (width * cell width + gap * (width - 1), height * cell height + gap * (height - 1))
```

### Block Overflow Behavior
Each `DashboardBlock` wrapper uses `overflow-y: auto` internally. Blocks scroll their content if it exceeds the allocated grid cell height, preventing layout breakage.

### Drag Overlap Resolution Algorithm

When a block is dropped:
1. Calculate the center position of the drop
2. Snap to nearest grid cell (x, y)
3. Check for overlap with existing blocks (rect intersection)
4. If overlap, push conflicting blocks down by one row
5. **Cascade cap:** If the downward cascade exceeds **10 shifts**, stop and place the dropped block at the first available position below all existing blocks (wraps to a new row)
6. Update state and auto-save to server

### Layout Persistence Flow

1. **On mount:**
   - Read cached layout from `localStorage('dashboard-layout')` → render immediately
   - Fire `GET /api/dashboard/layout/active` in the background
   - **Reconciliation logic (prevents race conditions):**
     - Server response includes `updated_at` timestamp
     - Compare server `updated_at` vs localStorage `updated_at`
     - If localStorage is **newer** (user edited while offline/server was slow) → keep local, push to server on next auto-save
     - If server is **newer** → replace local with server data
     - If timestamps match → no conflict
   - If server returns 404 (no saved layout), keep the local default layout
2. **On edit save:** `PUT /api/dashboard/layout/:id` with updated blocks
   - Auto-save on drag end (debounced, 1s delay)
   - Auto-save on add/remove/resize/config-change (debounced, 1s delay)
   - Save-state indicator updates accordingly
   - On successful save → update `updated_at` in layout state and localStorage
   - On save failure → show "Save failed" indicator; auto-retry once after 3s; if still fails, user must click manual Save
3. **On block add:** Insert at bottom (highest `y` + 1), auto-save, push undo state
4. **On block remove:** Remove with confirmation dialog (shows block title), auto-save, push undo state
5. **On block resize:** Update width/height, auto-save, push undo state

### Block Rendering

Each block component receives:
```typescript
interface DashboardBlockComponentProps {
  config: Record<string, unknown>;  // block-specific config
  isEditing: boolean;
  onConfigChange: (config: Record<string, unknown>) => void;
}
```

**Per-block TanStack Query keys for refresh intervals:**
Each block type creates its own query key scoped by `blockId`:
```typescript
// In each block component:
const queryKey = ['dashboard-block', blockId, blockType];
const query = useQuery({
  queryKey,
  queryFn: () => api.get(endpoint).then(r => r.data.data),
  refetchInterval: (config.refreshInterval || 0) * 1000,  // ms; 0 = no refresh
  staleTime: 30_000,
});
```
This ensures each block's refresh interval is independently configurable. The `refetchInterval` is read dynamically from `config.refreshInterval` (uses the function form of `refetchInterval` if the interval changes without re-creating the query).

The `dashboardBlockRegistry.ts` maps block types to:
- React component (lazy-loaded via `React.lazy` for code splitting)
- Icon (for palette)
- Default title
- Default size (width × height in grid units)
- Description
- Required data query key(s) and endpoint
- Permissions required (see §1 table)

### Browser Tab Sync

To keep the layout in sync across browser tabs:
- In `useDashboardLayout`, listen for the `storage` event: `window.addEventListener('storage', handleStorageChange)`
- When a change to `localStorage('dashboard-layout')` is detected from another tab, refetch the layout from the server (`GET /api/dashboard/layout/active`)
- This prevents stale data when the user customizes the dashboard in one tab while viewing it in another
- Clean up the event listener on unmount

### Performance Strategy

- **CSS `contain: layout`** on each `DashboardBlock` wrapper to isolate layout recalculations during drag
- **`React.memo` with custom comparator** on each `DashboardBlock` — only re-renders if position, size, or data change
- **`useMemo`** on grid cell calculations to avoid recalculating on every drag pixel
- **Debounced auto-save** (1s) to avoid flooding the API during rapid edits
- **Blocks lazy-load their data independently** via TanStack Query — no central loading state
- **Max 20 blocks** per layout to prevent performance degradation

---

## 7. Backend Architecture

### New/Modified Files

```
server/src/
  models/
    Dashboard.ts             ← REFACTOR: add layout CRUD functions + new data methods
    DashboardLayout.ts       ← NEW: model for dashboard_layouts table CRUD
  controllers/
    dashboardController.ts   ← REFACTOR: add layout controllers + new data controllers
  routes/
    dashboard.ts             ← REFACTOR: add new routes
  migrations/
    dashboard-layouts.sql    ← NEW: migration file
    rollbacks/
      rollback-dashboard-layouts.sql  ← NEW: rollback file
```

### Model: `DashboardLayout`

```typescript
function getActiveLayout(userId: number): DashboardLayout | null
function createLayout(userId: number, name: string, blocks: DashboardBlock[]): DashboardLayout
function updateLayout(id: number, blocks: DashboardBlock[]): void   // also updates `updated_at`
function renameLayout(id: number, name: string): void
function deleteLayout(id: number): void
function listLayouts(userId: number): DashboardLayout[]
function setActiveLayout(userId: number, id: number): void                   // deactivates others
```

### New Data Endpoint Implementations

Each new dashboard data endpoint follows the existing pattern in `Dashboard.ts` model — prepared statements, try/catch, structured JSON response.

| Endpoint | Model Method | Query Pattern |
|----------|-------------|---------------|
| `top-customers` | `getTopCustomers(limit)` | `SELECT customer_name, SUM(total_amount) as total_revenue, COUNT(*) as invoice_count FROM invoices WHERE status != 'Cancelled' GROUP BY customer_name ORDER BY total_revenue DESC LIMIT ?` |
| `sales-summary` | `getSalesSummary(period)` | For `today`: `WHERE invoice_date = date('now')`. For `week`: `WHERE invoice_date >= date('now', '-7 days')`. For `month`: `WHERE invoice_date >= date('now', '-1 month')` |
| `expense-summary` | `getExpenseSummary(period)` | Same date filtering as sales-summary but on `expenses` table |
| `production-status` | `getProductionStatus()` | `SELECT status, COUNT(*) as count FROM productions GROUP BY status` |
| `stock-movement-summary` | `getStockMovementSummary(days)` | `SELECT movement_type, SUM(quantity) as total FROM stock_movements WHERE movement_date >= date('now', '-' || ? || ' days') GROUP BY movement_type` |
| `kpi` | `getKPI(metric)` | Switch on metric key (see KPI metric catalog in §1 for queries) |
| `ar-summary` | `getARSummary()` | `SELECT COALESCE(SUM(CASE WHEN ...))` aggregated bucket query |

### Migration Integration

Add `runDashboardLayoutsMigration()` to `server/src/config/database.ts` — follows the same pattern as existing migrations. Call it after `runCustomReportsMigration()`:

```typescript
function runDashboardLayoutsMigration(): void {
  try {
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='dashboard_layouts'
    `).get() as { name: string } | undefined;

    if (!tableCheck) {
      logger.info('Running dashboard layouts migration...');
      const migrationSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/dashboard-layouts.sql'),
        'utf8'
      );
      db.exec(migrationSQL);
      logger.info('✅ Dashboard layouts migration completed!');
    }
  } catch (error: any) {
    logger.error('Dashboard layouts migration error:', error.message);
  }
}
```

Register at the bottom of the call chain:
```typescript
// ...existing migrations...
runDashboardLayoutsMigration();
```

---

## 8. i18n Keys

New keys to add to `client/src/locales/en.json` (and `ur.json`):

```json
"dashboardCustomization": {
  "customize": "Customize",
  "done": "Done",
  "save": "Save Layout",
  "saving": "Saving...",
  "saved": "Saved",
  "unsaved": "Unsaved changes",
  "saveFailed": "Save failed",
  "saveRetrying": "Retrying...",
  "revert": "Revert to Default",
  "reverted": "Layout reverted to default",
  "blockPalette": "Block Palette",
  "addBlock": "Add to Dashboard",
  "removeBlock": "Remove",
  "blockSettings": "Block Settings",
  "title": "Block Title",
  "size": "Size",
  "small": "Small",
  "medium": "Medium",
  "large": "Large",
  "refreshInterval": "Refresh Interval",
  "noRefresh": "None",
  "refresh30s": "Every 30s",
  "refresh60s": "Every 60s",
  "refresh5m": "Every 5 min",
  "refresh15m": "Every 15 min",
  "deleteBlock": "Delete Block",
  "deleteConfirm": "Delete \"{title}\"?",
  "deleteConfirmMsg": "This block will be removed from your dashboard.",
  "layoutSaved": "Layout saved",
  "blockAdded": "Block added to dashboard",
  "blockRemoved": "Block removed",
  "dragHint": "Drag blocks to rearrange",
  "undo": "Undo",
  "redo": "Redo",
  "mobilePaletteTitle": "Add a Block",
  "mobilePaletteDesc": "Select a block type to add to your dashboard",
  "deprecatedBlock": "This block type is no longer available",
  "deprecatedRemove": "Remove",
  "editShortcuts": "Escape to exit, Delete to remove, Ctrl+Z to undo",
  "syncedFromOtherTab": "Dashboard updated from another tab",
  // Block type labels
  "blockStatCards": "Stat Cards",
  "blockSalesPurchases": "Sales vs Purchases",
  "blockStockByCategory": "Stock by Category",
  "blockLowStock": "Low Stock Alerts",
  "blockQuickActions": "Quick Actions",
  "blockRecentActivity": "Recent Activity",
  "blockARSummary": "AR Summary",
  "blockTopCustomers": "Top Customers",
  "blockForecastSnapshot": "Forecast Snapshot",
  "blockSalesSummary": "Sales Summary",
  "blockExpenseSummary": "Expense Summary",
  "blockProductionStatus": "Production Status",
  "blockStockMovements": "Stock Movement Summary",
  "blockCustomText": "Text / Heading",
  "blockKPIGauge": "KPI Gauge",
  // Descriptions
  "blockStatCardsDesc": "Total Items, Stock Value, Sales, Production",
  "blockSalesPurchasesDesc": "7-day sales vs purchases line chart",
  "blockStockByCategoryDesc": "Stock distribution by category",
  "blockLowStockDesc": "Items below reorder level",
  "blockQuickActionsDesc": "Shortcuts to common pages",
  "blockRecentActivityDesc": "Latest system activity",
  "blockARSummaryDesc": "Accounts receivable aging",
  "blockTopCustomersDesc": "Top customers by revenue",
  "blockForecastSnapshotDesc": "Forecast KPIs and metrics",
  "blockSalesSummaryDesc": "Today / Week / Month sales totals",
  "blockExpenseSummaryDesc": "Recent expenses and totals",
  "blockProductionStatusDesc": "Active production orders",
  "blockStockMovementsDesc": "Recent stock in/out movements",
  "blockCustomTextDesc": "Custom heading or notes",
  "blockKPIGaugeDesc": "Single configurable KPI gauge"
}
```

---

## 9. Implementation Order

### Phase 1 — Foundation
1. Create DB migration (`dashboard-layouts.sql`) + rollback + run in `database.ts`
2. Create `DashboardLayout` model (CRUD operations including `updated_at` handling)
3. Add **dashboard_layouts permission seeds** to `seedDefaultPermissions()`
4. Add layout API endpoints to dashboard routes + controller
5. Add 7 new data endpoints (top-customers, sales-summary, expense-summary, production-status, stock-movement-summary, kpi, ar-summary)
6. Register i18n keys

### Phase 2 — Block Components
7. Create `dashboardBlockRegistry.ts` — registry with all fields including required permissions
8. Create all 15 block components (lazy-loaded) + `DeprecatedBlock.tsx`
9. Wrap blocks with consistent skeleton/shimmer loading states + error states with retry

### Phase 3 — Layout Engine
10. Create `useDashboardLayout` hook (load/save, grid calc, undo/redo stack, localStorage cache, auto-save with debounce + error handling, browser tab sync via `storage` event)
11. Create `DashboardLayout` component (3-column CSS grid rendering with `contain: layout`)
12. Create `DashboardBlock` wrapper (grid positioning, `overflow-y: auto`, `React.memo` with custom comparator)

### Phase 4 — Edit Mode
13. Create `DashboardBlockPalette` (right panel — filtered by user permissions, adds blocks at bottom)
14. Create `BlockSettingsPopover` (inline popover with title, size presets, refresh interval, delete)
15. Implement drag-and-drop (add from palette to bottom, reorder within grid, resize with handle) using @dnd-kit
16. Implement edit mode toggle + overlay + keyboard shortcut suppression

### Phase 5 — Polish
17. Refactor existing `Dashboard.tsx` to use new system (replace hardcoded layout with `DashboardLayout` + `useDashboardLayout`)
18. Add undo/redo keyboard bindings (Ctrl+Z / Ctrl+Shift+Z) and toolbar buttons
19. Add responsive behavior (mobile: single-column layout, palette as bottom sheet)
20. Add smooth transitions for block add/remove/move/resize
21. Testing and bug fixes

---

## 10. Edge Cases & Constraints

- **Empty dashboard:** If user removes all blocks, show a "Getting Started" state with a prompt to add blocks from the palette
- **Loading states:** Each block uses a consistent skeleton/shimmer pattern (grey animated placeholder matching the block shape) while data is loading
- **Error states:** Each block shows an error state with a retry button when data fetch fails; the error does not affect other blocks
- **Overlapping blocks:** On drop, auto-layout pushes conflicting blocks down, capped at **10 cascade shifts**; beyond that, place at first available position below all existing blocks (wraps to a new row)
- **Undo/redo stack:** Maximum 50 actions in the stack. Oldest actions are dropped when the limit is exceeded. Undo reverts the entire block state (position, size, config) atomically
- **Auto-save error handling:**
  - First failure → show "Save failed" (red), auto-retry once after 3 seconds
  - Second failure → stay in "Save failed" state; user must click manual "Save" to retry
  - Edits are NEVER blocked by save failures — local state is always preserved
  - The manual "Save" button remains available even during auto-save
- **Responsive (mobile <768px):** Switch to single-column layout (all blocks become 1-col wide, full width). The palette panel transforms into a **bottom sheet** — user taps "Add Block" and a modal sheet slides up with block type options. Tapping a type auto-adds it to the top of the dashboard and closes the sheet
- **Performance:** Blocks lazy-load data independently via TanStack Query with per-block query keys and `refetchInterval`; debounce auto-save (1s); `React.memo` with custom comparator on DashboardBlock; CSS `contain: layout` on each block wrapper
- **Permission-aware:** Block types that require permissions the current user lacks are hidden from the palette. Permission mapping is in the registry (see Required Permission column in §1)
- **Max blocks cap:** Limit to 20 blocks per layout
- **Block type versioning & removal:** Each block has a `version` field. If a future update removes a block type, existing layouts render a `deprecated_block` placeholder with a warning icon, original title, and remove button (visible even outside edit mode). The migration run on startup logs a warning for any deprecated blocks found
- **Layout migration (new block types):** If new block types are added, existing layouts remain valid. New blocks appear in the palette for optional addition
- **Multiple layouts:** Users can save multiple named layouts and switch via a dropdown in edit mode
- **Initial layout load flash prevention:** On mount, the layout is read from `localStorage('dashboard-layout')` and rendered immediately. The server response reconciles in the background using `updated_at` timestamp comparison (see §6 reconciliation logic)
- **Browser tab sync:** The `useDashboardLayout` hook listens for the `storage` event. When a change to `localStorage('dashboard-layout')` is detected from another tab, the layout is refetched from the server. A toast notification "Dashboard updated from another tab" is shown
- **Edit mode + Background interactions:** In edit mode, the dashboard overlay prevents clicks/links from firing. Keyboard shortcuts `Alt+N` (new item) and `Alt+R` (refresh) are suppressed via the `context` filter on `useKeyboardShortcut`. Edit-mode shortcuts `Escape` (exit), `Delete` (remove focused block), `Ctrl+Z`/`Ctrl+Shift+Z` (undo/redo) become active
- **Layout name uniqueness:** The DB has `UNIQUE(user_id, layout_name)`. When creating a named layout (not "Default"), if the name already exists, the server returns a 409 Conflict. The UI shows an inline error "A layout with this name already exists" and allows the user to choose a different name
