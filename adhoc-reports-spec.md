# Ad-hoc Report Builder — Specification

> **Status:** Draft  
> **Date:** 2026-06-24  
> **Project:** MiniERP  
> **Target audience:** All users (visual builder — no SQL required)

---

## 1. Overview

An ad-hoc report builder that lets any user create custom reports by dragging and dropping fields from major business entities onto a canvas. The builder supports computed columns, aggregation, filters, sorting, grouping, and chart visualizations. Reports can be saved for personal reuse and exported to CSV, PDF, Excel, or image/print.

### User Story

> As an accountant, operations manager, or business analyst,  
> I want to build a custom report by selecting the data entities and fields I care about,  
> So that I can analyze my business data without needing SQL skills or waiting for a developer.

---

## 2. Data Sources

All major entities in the MiniERP database are exposed as report sources, including their key relationships:

| Entity | Key Fields | Related Entities |
|--------|-----------|-----------------|
| **Invoices** | invoice_no, invoice_date, due_date, status, total_amount, paid_amount, balance_amount, discount_*, created_at | customer_id → Customers, items → Invoice Items |
| **Invoice Items** | quantity, unit_price, amount, tax_rate | invoice_id → Invoices, item_id → Items |
| **Sales Orders** | so_no, so_date, delivery_date, status, total_amount, notes, created_at | customer_id → Customers, items → Sales Order Items |
| **Sales Order Items** | quantity, delivered_quantity, unit_price, amount | so_id → Sales Orders, item_id → Items |
| **Purchase Orders** | po_no, po_date, expected_delivery_date, status, total_amount, notes | supplier_id → Suppliers, items → PO Items |
| **Purchase Order Items** | quantity, received_quantity, unit_price, amount | po_id → Purchase Orders, item_id → Items |
| **Items (Inventory)** | item_code, item_name, category, unit_of_measure, current_stock, reorder_level, standard_cost, standard_selling_price, is_* flags | — |
| **Stock Movements** | movement_no, movement_type, quantity, unit_cost, movement_date, reference_* | item_id → Items, warehouse_id → Warehouses |
| **Stock Balances** | quantity | item_id → Items, warehouse_id → Warehouses |
| **Customers** | customer_code, customer_name, email, phone, payment_terms, credit_limit, opening_balance, is_active | — |
| **Suppliers** | supplier_code, supplier_name, email, phone, payment_terms, is_active | — |
| **Payments** | payment_no, payment_date, amount, payment_method, reference_no | customer_id → Customers, invoice_id → Invoices |
| **Expenses** | expense_no, expense_category, description, amount, expense_date, payment_method, vendor_name | — |
| **Employees** | employee_code, first_name, last_name, department, designation, salary, is_active | — |
| **Productions** | production_no, production_date, output_quantity, status | output_item_id → Items, bom_id → BOM |
| **BOMs** | bom_no, bom_name, quantity, is_active | finished_item_id → Items |
| **Warehouses** | warehouse_code, warehouse_name, location | — |
| **Activity Log** | action, entity_type, entity_id, description, created_at | user_id → Users |

Each entity exposes:
- **All native fields** (typed as text, number, date, boolean)
- **All direct foreign key joins** (e.g., Invoice → Customer name, Invoice → Customer code)
- **All reverse relationships** where useful (e.g., Customer → count of invoices, Customer → sum of invoice amounts)

---

## 3. Report Builder Page (`/reports/custom`)

### 3.1 Layout

The builder is a **full-page editor** with three vertical zones:

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Custom Report Builder" | Save | Run | Export  │
├────────────────────┬────────────────────────────────────┤
│  Left Panel        │  Right Panel                       │
│  ┌──────────────┐  │  ┌──────────────────────────────┐  │
│  │ Entity Picker│  │  │  Column Drop Zone           │  │
│  │              │  │  │  (dropped fields land here,  │  │
│  │ Fields       │  │  │   reorderable within zone)  │  │
│  │ (draggable)  │  │  ├──────────────────────────────┤  │
│  ├──────────────┤  │  │  ┌────────────────────────┐  │  │
│  │ Filters      │  │  │  │  Summary Cards         │  │  │
│  ├──────────────┤  │  │  └────────────────────────┘  │  │
│  │ Sort         │  │  │  ┌────────────────────────┐  │  │
│  ├──────────────┤  │  │  │  Chart (optional)      │  │  │
│  │ Group By     │  │  │  └────────────────────────┘  │  │
│  ├──────────────┤  │  │  ┌────────────────────────┐  │  │
│  │ Computed     │  │  │  │  Report Preview        │  │  │
│  │ Columns      │  │  │  │  (AG-Grid table)        │  │  │
│  └──────────────┘  │  │  └────────────────────────┘  │  │
├────────────────────┴────────────────────────────────────┤
│  Footer: Row count | "Apply" button                     │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Left Panel — Report Configuration

#### 3.2.1 Entity Picker (top)

- A dropdown/searchable-select listing all available data entities (see §2)
- Upon selecting an entity, its available fields populate the Fields section
- Changing the entity while fields are configured shows a confirmation dialog ("This will clear your current report configuration")
- **Multi-entity join:** A secondary "+ Add Entity" button to add cross-entity joins (e.g., Invoices + Customers), automatically resolved by foreign keys

#### 3.2.2 Fields (draggable list)

- Each field shows: field name, data type icon (🔤 text, 🔢 number, 📅 date, ✅ boolean)
- Fields are **drag-and-drop** onto the "Report Columns" area in the preview
- Alternative: click a "+" button next to each field to add it
- Order: fields can be reordered via drag-and-drop within the columns area
- Features:
  - Search/filter across available fields
  - Toggle field visibility (show/hide columns)
  - Set column alias (custom display name)
  - Set number formatting (currency, decimal places, percentage)
  - Set date formatting (short date, long date, month/year only)

#### 3.2.3 Filters Section

- Add one or more filter conditions
- Each filter: Field | Operator | Value
- Operators by field type:
  - **Text:** equals, not equals, contains, starts with, ends with, is empty, is not empty, in list
  - **Number:** equals, not equals, greater than, less than, greater or equal, less or equal, between, is empty
  - **Date:** equals, before, after, between, relative (last 7 days, last 30 days, this month, this quarter, this year, last month, last quarter, last year, custom range)
  - **Boolean:** is true, is false
- Filter groups: AND / OR logic between conditions, with nested groups
- Each filter condition is a row with a remove button

#### 3.2.4 Sorting Section

- Add one or more sort rules
- Field | Direction (Asc/Desc)
- Orders reorderable via drag handle (optional, can use the same @dnd-kit pattern as column reordering in future phases)

#### 3.2.5 Grouping & Aggregation

- Toggle: "Enable Grouping" switch
- Group By field(s): one or more fields to group by
- Aggregate functions per non-grouped field:
  - SUM, COUNT, AVG, MIN, MAX
- HAVING clause: filter groups by aggregate condition (e.g., SUM(amount) > 1000)

#### 3.2.6 Computed Columns

- "Add Computed Column" button
- Expression builder with:
  - **Operands:** field references (drag from fields list), literal numbers/strings
  - **Operators:** +, -, ×, ÷
  - **Functions:** ABS, ROUND, CONCAT, COALESCE, CASE (simple if-then-else)
  - **Date functions:** DATE_DIFF, DATE_ADD, EXTRACT(YEAR/MONTH/DAY)
- Example: `profit = ROUND(invoice.total_amount - (invoice_item.quantity × invoice_item.unit_price), 2)`
- Expression validation: real-time syntax checking
- Computed columns can also be used in filters, sort, and group-by

### 3.3 Right Panel — Preview

#### 3.3.1 Table (AG-Grid)

- Shows live preview of report data as the user configures it
- Uses the existing `MiniERPGrid` component
- Features:
  - Column sorting (click header)
  - Column resize
  - Pagination (default 20 rows)
  - Row count badge in footer
- **Debounced execution:** Auto-renders when user stops changing config for 1 second
- Shows loading spinner during query execution
- Empty state when no data matches filters

#### 3.3.2 Summary Cards

- Auto-computed from visible data:
  - **Numeric columns:** Sum, Average, Min, Max
  - **Count:** Total rows in result
- Shown as a compact `StatsGrid` above the table
- Cards are reactive to column changes

#### 3.3.3 Chart (optional)

- "Show Chart" toggle button above the table
- Chart type selector: Bar, Line, Pie, Doughnut, Area
- X-axis field picker, Y-axis field picker, optional series/color field
- Uses Chart.js (already in the project via `react-chartjs-2`)
- Chart sits between summary cards and the table
- Collapsible with a toggle

---

## 4. Report Lifecycle

### 4.1 Creating a Report

1. Navigate to `/reports/custom` → "New Report"
2. Select entity → fields → configure filters/sort/group → see live preview
3. Click "Save" → modal with:
   - Report name (required, max 100 chars)
   - Description (optional, max 500 chars)
4. Saved report appears in the "My Reports" list

### 4.2 Saving & Storage

- Stored as a **JSON definition** in a new `custom_reports` table
- Schema:
  ```sql
  CREATE TABLE custom_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    config JSON NOT NULL,           -- Full report definition
    is_active BOOLEAN DEFAULT 1,
    last_run_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  ```
- The `config` JSON includes:
  - `entity`: primary entity key
  - `joins`: array of joined entities with join paths
  - `columns`: array of { field, alias, format, width, visible }
  - `computedColumns`: array of { name, expression, type } (type: `'number' | 'string' | 'date'`)
  - `filters`: nested filter tree (relative date ranges are resolved to absolute dates at query time — no separate `relativeDateRanges` field)
  - `sort`: array of { field, direction }
  - `groupBy`: { enabled, fields, aggregates, having }
  - `chart`: { enabled, type, xField, yField, seriesField }

### 4.3 Running a Report

- **Saved reports page:** Click a report → opens the preview page with the report loaded
- **From builder:** Click "Run" or auto-preview
- **Backend execution:** A new `POST /api/reports/custom/run` endpoint parses the JSON config, builds a safe SQL query using prepared statements, and returns the results

### 4.4 Managing Reports

- "My Reports" page at `/reports/custom/list` — a list/grid of saved reports
- Each card shows: name, description, last run date, row count
- Actions: Run, Edit, Duplicate, Rename, Delete
- Reports are **personal** (per-user), not shared

### 4.5 Pre-built Templates

The system ships with **5 report templates** that users can clone & customize:

| Template | Entity | Description |
|----------|--------|-------------|
| Sales Summary | Invoices | invoice_date, customer_name, total_amount, status. Grouped by month. |
| Inventory Status | Items | item_code, item_name, category, current_stock, reorder_level. Filter: stock ≤ reorder_level. |
| Customer Aging | Invoices | customer_name, invoice_no, due_date, balance_amount. Filter: status = Unpaid/Overdue/Partially Paid. |
| Top Customers | Invoices | Grouped by customer_id. Aggregates: SUM(total_amount), COUNT(invoices). Sorted by sum desc. |
| Stock Valuation | Items | item_code, item_name, category, current_stock, standard_cost. Computed: value = stock × cost. |

---

## 5. Backend Architecture

### 5.1 New Files

| File | Role |
|------|------|
| `server/src/routes/customReports.ts` | Route definitions |
| `server/src/controllers/customReportsController.ts` | Request handling |
| `server/src/services/customReportService.ts` | Report execution engine |
| `server/src/models/CustomReport.ts` | CRUD for saved reports |
| `server/src/migrations/add-custom-reports.sql` | Schema migration |

### 5.2 Report Execution Engine (`customReportService.ts`)

The core responsibility: convert a JSON report definition into a safe, parameterized SQL query.

**Safety guarantees:**
- **No raw string interpolation** — all user values go through `?` placeholders
- **Field whitelisting** — only fields from known entities are accepted
- **Entity whitelisting** — only registered entities with their field definitions can be queried
- **MAX_JOIN_DEPTH = 3** to prevent runaway queries
- **MAX_COLUMNS = 50** to prevent absurdly wide results
- **MAX_FILTER_GROUPS = 10** to prevent absurdly complex filter trees
- Query timeout at application level (configurable)

**Execution flow:**
1. Validate JSON config against schema
2. Resolve entity → table mapping and field definitions
3. Build SELECT clause (fields + computed columns + aggregates)
4. Build FROM clause with JOINs (auto-resolved via foreign keys)
5. Build WHERE clause from filter tree (parameterized)
6. Build GROUP BY + HAVING if aggregation enabled
7. Build ORDER BY
8. Add LIMIT (default 500, configurable per request)
9. Execute via `db.prepare(sql).all(...params)`
10. Return `{ columns: [...], rows: [...], totalRows, summary }`

### 5.3 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/reports/custom` | List user's saved reports |
| `POST` | `/api/reports/custom` | Save a new report (JSON body) |
| `GET` | `/api/reports/custom/:id` | Get report definition by ID |
| `PUT` | `/api/reports/custom/:id` | Update report definition |
| `DELETE` | `/api/reports/custom/:id` | Delete report |
| `POST` | `/api/reports/custom/:id/duplicate` | Duplicate report |
| `POST` | `/api/reports/custom/run` | Execute a report (accepts JSON config or saved report ID) |
| `GET` | `/api/reports/custom/entities` | List available entities with their fields and types |
| `GET` | `/api/reports/custom/templates` | List pre-built templates |

### 5.4 Permissions

- `custom_reports:read` — View and run saved reports
- `custom_reports:create` — Create new reports
- `custom_reports:update` — Edit/update reports
- `custom_reports:delete` — Delete reports

Boundaries: existing `reports:read` permission is NOT sufficient for custom reports since the execution engine has broader data access.

---

## 6. Frontend Architecture

### 6.1 New Files

| File | Role |
|------|------|
| `client/src/pages/reports/CustomReportsPage.tsx` | Main list page |
| `client/src/pages/reports/CustomReportBuilder.tsx` | Builder page (full-page) — orchestrates DnD context and all sub-panels |
| `client/src/pages/reports/CustomReportPreview.tsx` | Report result view |
| `client/src/components/reports/EntityPicker.tsx` | Entity selector dropdown |
| `client/src/components/reports/FieldPalette.tsx` | Draggable field list (uses `useDraggable` from @dnd-kit) |
| `client/src/components/reports/ColumnDropZone.tsx` | Drop target for fields + sortable column list (uses `useDroppable` + `SortableContext` + `useSortable`) |
| `client/src/components/reports/DragGhost.tsx` | Simplified visual representation of a field shown inside DragOverlay during drag |
| `client/src/components/reports/FilterBuilder.tsx` | Filter condition rows (standard forms, no DnD) |
| `client/src/components/reports/SortBuilder.tsx` | Sort rule rows, optionall sortable via @dnd-kit in future |
| `client/src/components/reports/ComputedColumnEditor.tsx` | Expression builder modal |
| `client/src/components/reports/ChartConfigPanel.tsx` | Chart type/field pickers |
| `client/src/hooks/useCustomReport.ts` | TanStack Query hooks |
| `client/src/locales/en.json` | Translation additions |
| `client/src/styles/components/report-builder.css` | Builder-specific styles (drop zone highlights, drag ghosts, transitions) |

### 6.2 Drag-and-Drop Implementation (using @dnd-kit)

#### 6.2.1 Library Choice

**Library:** `@dnd-kit` (core + sortable + utilities)  
**Rationale:** See `dnd-library-research.md` for full comparison. @dnd-kit wins over alternatives for:
- ~15–20 kB tree-shakeable bundle (vs ~50–60 kB for @hello-pangea/dnd)
- Native support for the **palette-to-dropzone** pattern (official "Multiple Containers" example)
- No AG-Grid conflicts — DnD interactions happen in the **config panel only**, separate from the AG-Grid result table
- Actively maintained with first-class React 19 support
- Excellent collision detection and custom sensor system

#### 6.2.2 Package Installation

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

No peer dependencies needed. The three packages provide:
- `@dnd-kit/core` — DndContext, useDraggable, useDroppable, sensors, collision detection
- `@dnd-kit/sortable` — SortableContext, useSortable, arrayMove, sortableKeyboardCoordinates
- `@dnd-kit/utilities` — CSS.Transform helpers, utility types

#### 6.2.3 Component Tree

The @dnd-kit `DndContext` wraps the entire builder layout:

```tsx
// CustomReportBuilder.tsx (conceptual)
import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { nanoid } from 'nanoid';

export default function CustomReportBuilder() {
  const [columns, setColumns] = useState<FieldDef[]>([]);
  const [availableFields, setAvailableFields] = useState<FieldDef[]>([]);
  const [activeDrag, setActiveDrag] = useState<FieldDef | null>(null);

  // Sensors with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    // activeDrag stores the field definition for DragOverlay display
    const draggedField = availableFields.find(f => f.id === event.active.id);
    setActiveDrag(draggedField ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Detects when dragging over the ColumnDropZone for visual feedback
    // The drop zone itself handles its own isOver state via useDroppable
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const isFromPalette = active.data.current?.source === 'palette';
    const isInDropZone = over.data.current?.zone === 'columns';

    if (isFromPalette && isInDropZone) {
      // Clone field from palette and add to columns array with a unique instance ID
      const field = active.data.current?.field as FieldDef;
      setColumns(prev => [...prev, { ...field, id: `col-${nanoid()}` }]);
    } else if (isInDropZone) {
      // Reorder within columns array
      setColumns(prev => {
        const oldIndex = prev.findIndex(c => c.id === active.id);
        const newIndex = prev.findIndex(c => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="report-builder-layout">
        <aside className="left-panel">
          <EntityPicker />
          <FieldPalette />
          <FilterBuilder />
          <SortBuilder />
          <ComputedColumnEditor />
        </aside>
        <main className="right-panel">
          <ColumnDropZone columns={columns} />
          <ReportPreview />
        </main>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeDrag ? <DragGhost field={activeDrag} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

**Imports note:** `nanoid` must be installed separately (`npm install nanoid`) — it generates short unique IDs for each column instance dropped from the palette.

#### 6.2.4 FieldPalette Component (Source)

```tsx
// FieldPalette.tsx — items are draggable out, but NOT sortable within the palette
import { useDraggable } from '@dnd-kit/core';

function DraggableField({ field }: { field: FieldDef }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${field.name}`,
    data: { source: 'palette', field },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="palette-field">
      <DataTypeIcon type={field.type} />
      <span>{field.label}</span>
      <button onClick={() => onAddField(field)}>+</button>
    </div>
  );
}
```

#### 6.2.5 ColumnDropZone Component (Target)

```tsx
// ColumnDropZone.tsx — receives fields from palette AND supports internal reordering
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';

function ColumnDropZone({ columns }: { columns: FieldDef[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'column-drop-zone' });

  return (
    <div
      ref={setNodeRef}
      className={`column-drop-zone ${isOver ? 'drag-over' : ''}`}
    >
      <SortableContext items={columns.map(c => c.id)} strategy={verticalListSortingStrategy}>
        {columns.map(col => (
          <SortableColumnItem key={col.id} column={col} />
        ))}
      </SortableContext>
      {columns.length === 0 && (
        <div className="drop-zone-placeholder">
          Drag fields here or click + to add columns
        </div>
      )}
    </div>
  );
}

function SortableColumnItem({ column }: { column: FieldDef }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { zone: 'columns', column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="sortable-column">
      <button className="drag-handle" {...listeners} {...attributes}>
        ⠿
      </button>
      <DataTypeIcon type={column.type} />
      <span className="column-name">{column.alias || column.label}</span>
      <div className="column-actions">
        <button onClick={() => onRemoveColumn(column.id)}>✕</button>
      </div>
    </div>
  );
}
```

#### 6.2.6 Multiple Containers Pattern

The builder uses @dnd-kit's **Multiple Containers** pattern (matching the official example):

| Container | Role | DnD Behavior |
|-----------|------|-------------|
| **Palette** (left panel) | Source of fields | Items use `useDraggable` but are NOT in a `SortableContext` — they act as originals that get cloned on drop |
| **Drop Zone** (right panel) | Target for fields + reorder | Uses `useDroppable` as the container, and `SortableContext` + `useSortable` for its child items |

**Drag lifecycle:**
1. **onDragStart** — Store the dragged field in state; show `DragOverlay` (a ghost copy following the cursor)
2. **onDragOver** — Detect when the dragged item crosses into the drop zone; apply CSS class for visual feedback (`drag-over`)
3. **onDragEnd** — Check `active.data.current.source`:
   - If `'palette'` → clone the field and add to columns array (the palette item stays)
   - If `'columns'` → call `arrayMove()` to reorder within the columns array
4. **DragOverlay** — A floating copy of the field follows the pointer during drag, providing clear visual feedback

#### 6.2.7 Sensors & Accessibility

```tsx
const sensors = useSensors(
  // Pointer sensor: responds to mouse AND touch
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,  // Require 5px movement before activating — prevents accidental drags
    },
  }),
  // Keyboard sensor: arrow keys + Enter/Space for keyboard-only users
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  }),
);
```

**Accessibility considerations:**
- @dnd-kit provides built-in ARIA attributes via `attributes` and `listeners` spread from `useDraggable` / `useSortable`
- Keyboard sensor allows full drag-and-drop via Tab, Arrow keys, Enter, and Escape
- `DragOverlay` provides visual feedback for all users
- Live region announcements for drag start/end can be added via a toast or screen reader announcer

#### 6.2.8 Visual Feedback & Styling

```css
/* report-builder.css */

.column-drop-zone {
  min-height: 80px;
  border: 2px dashed var(--border-color, #d1d5db);
  border-radius: 8px;
  padding: 8px;
  transition: border-color 0.2s, background-color 0.2s;
}

.column-drop-zone.drag-over {
  border-color: var(--primary, #3b82f6);
  background-color: rgba(59, 130, 246, 0.05);
}

.sortable-column {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  margin-bottom: 4px;
  cursor: default;
  transition: box-shadow 0.2s;
}

.sortable-column:active {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.drag-handle {
  cursor: grab;
  touch-action: none;   /* Prevent scroll interference on touch devices */
  background: none;
  border: none;
  padding: 4px;
  color: var(--text-tertiary, #9ca3af);
}

.drag-handle:active {
  cursor: grabbing;
}

.palette-field.dragging {
  opacity: 0.4;
}

.drag-overlay-ghost {
  padding: 8px 12px;
  background: var(--primary-bg, #dbeafe);
  border: 1px solid var(--primary, #3b82f6);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  pointer-events: none;
}
```

#### 6.2.9 Edge Cases Handled

| Case | Handling |
|------|----------|
| **Drop outside any zone** | `onDragEnd` with no `over` → no-op (field returns to palette) |
| **Drop on itself** | `active.id === over.id` in `onDragEnd` → skip reorder |
| **Rapid sequential drops** | Each drop clones the palette item with a unique `nanoid` ID, so multiple copies are independent |
| **Empty drop zone** | Show placeholder text "Drag fields here" |
| **Touch devices** | `PointerSensor` handles both mouse and touch; `touch-action: none` on drag handles prevents scroll interference |
| **Keyboard navigation** | `KeyboardSensor` with `sortableKeyboardCoordinates` enables full keyboard DnD |
| **Many fields** | Virtualized scroll within the palette if > 50 fields; drop zone uses normal scroll |
| **Changing entity** | Clear columns array; show confirmation dialog if columns are non-empty |
| **Duplicate field names** | Each column instance has a unique `id` (nanoid), even if referencing the same entity field |

#### 6.2.10 DragOverlay for Smooth UX

`DragOverlay` is a portal that renders a floating copy of the dragged item at the cursor position. This avoids layout shifts and provides a clean "pick up and drop" feel:

```tsx
<DragOverlay dropAnimation={dropAnimationConfig}>
  {activeDrag ? <DragGhost field={activeDrag} /> : null}
</DragOverlay>
```

The `DragGhost` is a simplified, visually prominent version of the field (styled with shadow, border, and slightly different background) that tells the user exactly what they're dragging. It matches the styling defined in §6.2.8 `.drag-overlay-ghost`.

### 6.3 Routing

```
/reports/custom              → CustomReportsPage (list saved reports)
/reports/custom/new          → CustomReportBuilder (empty canvas)
/reports/custom/:id          → CustomReportBuilder (loading saved config)
/reports/custom/:id/preview  → CustomReportPreview (read-only view)
```

### 6.4 Nav Integration

Add a `Custom Reports` item under the existing `Reports` section in both Sidebar and TopMenu.

---

## 7. Charts & Visualization

### 7.1 Chart Types

- **Bar** (vertical, grouped, stacked)
- **Line** (with optional fill/area)
- **Pie / Doughnut**
- **Area**

### 7.2 Chart Configuration

- X-axis: pick any field (typically a date or category)
- Y-axis: pick any numeric field
- Series: optional, used for color/legend grouping
- Aggregation: chart auto-aggregates (SUM for bar/line, COUNT for pie)
- Toggle: show/hide chart (default hidden)
- Position: between summary cards and the table

---

## 8. Exports

### 8.1 Export Button (in header)

- **CSV** — Uses existing `exportToExcel` from `exportUtils.ts`
- **PDF** — Uses existing `exportToPDF` from `exportUtils.ts` with the report title as filename
- **Excel (.xlsx)** — Add `xlsx` (SheetJS) package for true Excel format (`.xlsx`, not just CSV)
- **Print** — Uses browser's window.print() with a print-optimized layout

### 8.2 Export behavior

- Downloads current visible data (respecting filters, grouping)
- Includes all configured columns (not just what's scrolled into view)
- PDF includes: report title, generation timestamp, column headers, data rows, summary

---

## 9. i18n

All labels, field names, entity names, and operators are translatable using the existing `useTranslation` hook with English and Urdu locales.

---

## 10. Mobile Responsiveness

- The builder page is **desktop-only** initially (min-width 1024px)
- On mobile (<768px), show a simplified view:
  - Report list page uses card layout (existing pattern)
  - Saved reports can be run on mobile but not edited
  - The preview (table results) already works on mobile via AG-Grid

---

## 11. Migration

```sql
-- Migration: add-custom-reports.sql

CREATE TABLE IF NOT EXISTS custom_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  config TEXT NOT NULL,              -- JSON blob
  is_active BOOLEAN DEFAULT 1,
  last_run_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_custom_reports_user ON custom_reports(user_id);

-- Seed 5 templates (user_id = NULL = system template)
-- See §4.5 for template details
```

---

## 12. Entity Registry (Backend)

A centralized `EntityRegistry` object that defines all available entities, their tables, fields, types, and join paths:

```typescript
interface EntityField {
  name: string;
  column: string;       // SQL column name
  type: 'string' | 'number' | 'date' | 'boolean';
  format?: string;      // default display format
  aggregateFns?: string[]; // which functions apply
}

interface EntityJoin {
  entity: string;         // target entity name
  type: 'ONE_TO_MANY' | 'MANY_TO_ONE';
  localField: string;     // FK on this table
  foreignField: string;   // PK on target table
  alias?: string;         // prefix for target fields
}

interface EntityDefinition {
  key: string;
  table: string;
  label: string;          // translatable
  fields: EntityField[];
  joins: EntityJoin[];
}
```

---

## 13. Implementation Order (Recommended)

| Phase | Prerequisites | Tasks |
|-------|--------------|-------|
| **P0 — Foundation** | None | Migration, `custom_reports` table, Entity Registry, Basic CRUD endpoints, Entity list API |
| **P1 — Execution Engine** | P0 | `POST /api/reports/custom/run` — Parse JSON → Build safe SQL → Execute → Return results |
| **P2 — Builder UI** | P0 + install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `nanoid` | Full-page editor with entity picker, field drag-drop, filters, sort, group, computed columns |
| **P3 — Preview & Results** | P1 | AG-Grid integration, summary cards, live preview with debounce |
| **P4 — Charts** | P3 | Chart.js integration, chart config panel |
| **P5 — Templates** | P0 | Seed 5 templates, "clone from template" flow |
| **P6 — Exports** | P3 + install `xlsx` (SheetJS) | CSV, PDF, Excel, Print |
| **P7 — Polish** | All above | i18n, permissions, mobile responsive, loading/error states, empty states |
| **P8 — Edge Cases** | All above | Deep join limits, column overflow, large dataset warnings, query timeout |
