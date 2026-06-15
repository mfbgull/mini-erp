# AG Grid Double-Click-to-View Specification

## Overview

Add `onRowDoubleClicked` handlers to all AG Grid tables across the app to open a view/detail experience for each record. Three pages already have this — Sales (`/sales/invoice/:id/view`), Sales Orders (`/sales-orders/:id`), and Quotations (`/quotations/:id`). This spec covers the remaining AG Grid instances.

## Design Principles

1. **Double-click = primary "view" action** — opens a detail view, preview modal, or the most useful action for that entity.
2. **Keep existing 3-dot menu** — the "View" (or equivalent) option in the DropdownMenu stays alongside double-click. Both do the same thing.
3. **No toast on unsupported pages** — pages without a view target silently do nothing on double-click.
4. **Reports & read-only grids are excluded** — skip all report pages, forecast pages, and read-only history grids.
5. **Mobile card views already have their own interaction patterns** — no changes to mobile views (they use CompactCard components with their own onClick/onView handlers).

## Files Requiring Changes

### Group A: Simple `onRowDoubleClicked` (1 file)

| File | Double-click action |
|------|-------------------|
| `client/src/pages/customers/CustomersPage.jsx` | `navigate(\`/customers/${params.data.id}\`)` |

**Notes:**
- `handleView()` already does `navigate(\`/customers/${customer.id}\`)` — reuse this logic inline.
- `navigate` from `useNavigate` is already imported and available.
- Ensure the AG Grid has `onRowDoubleClicked` prop wired to the navigate call.

---

### Group B: Open preview modal (5 files)

| File | Double-click action |
|------|-------------------|
| `client/src/pages/inventory/ItemsPage.jsx` | Open `ItemPreview` modal via `setPreviewItem(params.data)` |
| `client/src/pages/inventory/WarehousesPage.jsx` | Open `WarehousePreview` modal |
| `client/src/pages/purchases/PurchasesPage.jsx` | Open `PurchasePreview` modal |
| `client/src/pages/customers/CustomerDetailPage.jsx` — InvoicesTab | Open `InvoicePreview` modal |
| `client/src/pages/inventory/StockMovementPage.jsx` | Open `StockMovementPreview` modal (replaces existing single-click `onRowClicked`) |

**Notes:**
- **ItemsPage.jsx**: `ItemPreview` is already imported. `previewItem` state and `setPreviewItem` already exist. The `onRowDoubleClicked` handler just needs to call `setPreviewItem(params.data)`.
- **WarehousesPage.jsx**: `WarehousePreview` component exists at `./WarehousePreview.tsx`. Import it and add state for managing preview visibility. Remove existing `onRowClicked` handler (which opens edit modal on single-click) — double-click replaces this behavior.
- **PurchasesPage.jsx**: `PurchasePreview` is already imported. `previewPurchase` state and `setPreviewPurchase` already exist. Wire `onRowDoubleClicked` to `setPreviewPurchase(params.data)`.
- **CustomerDetailPage.jsx — InvoicesTab**: This sub-component receives `invoices` and `onViewInvoice` as props. Add `onRowDoubleClicked` that calls `onViewInvoice(params.data)`. The parent `CustomerDetailPage` already passes `onViewInvoice` which opens `InvoicePreview`.
- **StockMovementPage.jsx**: `StockMovementPreview` component exists at `./StockMovementPreview.tsx`. Currently has `onRowClicked={(params) => setIsModalOpen(true, params.data)}` which opens a stock adjustment form. Replace with `onRowDoubleClicked` that opens the `StockMovementPreview` modal instead.

---

### Group C: Open edit/management modal (2 files)

| File | Double-click action |
|------|-------------------|
| `client/src/pages/roles/RolesPage.jsx` | Open permissions modal via `handleEditPermissions(params.data)` |
| `client/src/pages/production/ProductionPage.jsx` | Open production details modal |

**Notes:**
- **RolesPage.jsx**: `handleEditPermissions` already exists and opens the `PermissionsModal`. Wire `onRowDoubleClicked` to call `handleEditPermissions(params.data)`.
- **ProductionPage.jsx**: Requires a new production details modal (see detailed section below).

---

### Group D: Inline BOM details (1 file)

| File | Double-click action |
|------|-------------------|
| `client/src/pages/bom/BOMPage.jsx` | Show BOM details in a modal using existing `BOMDetails` component |

---

### Group E: No-op (3 files)

| File | Behavior |
|------|---------|
| `client/src/pages/expenses/ExpensesPage.jsx` | No `onRowDoubleClicked` — silently does nothing |
| `client/src/pages/payments/PaymentsPage.tsx` | No `onRowDoubleClicked` — silently does nothing |
| `client/src/pages/users/UsersPage.jsx` | No `onRowDoubleClicked` — silently does nothing |

---

### Already Have Double-Click (3 files — no changes needed)

| File | Current action |
|------|---------------|
| `client/src/pages/sales/SalesPage.jsx` | `navigate(\`/sales/invoice/${params.data.id}/view\`)` |
| `client/src/pages/sales-orders/SalesOrdersPage.jsx` | `navigate(\`/sales-orders/${params.data.id}\`)` |
| `client/src/pages/quotations/QuotationsPage.jsx` | `navigate(\`/quotations/${params.data.id}\`)` |

---

### Excluded (read-only/report grids — no changes)

| File | Reason |
|------|--------|
| `client/src/pages/inventory/StockByWarehousePage.tsx` | Read-only stock view, no-op per user request |
| `client/src/pages/inventory/InvoiceReturnHistory.tsx` | Read-only history grid |
| `client/src/pages/purchases/PurchaseReturnHistory.tsx` | Read-only history grid |
| `client/src/pages/forecasts/DemandForecast.tsx` | Forecast report — excluded |
| All `client/src/pages/reports/*.jsx` (20+ files) | Read-only report grids — excluded |
| `client/src/pages/purchase-orders/PurchaseOrdersPage.jsx` | Card-based layout, not AG Grid — excluded |
| `client/src/pages/suppliers/SuppliersPage.jsx` | Card-based layout, not AG Grid — excluded |
| `client/src/pages/employees/EmployeesPage.tsx` | Card-based layout, not AG Grid — excluded |
| `client/src/pages/customers/CustomerDetailPage.jsx` — LedgerTab | Read-only sub-grid — no-op |
| `client/src/pages/customers/CustomerDetailPage.jsx` — PaymentsTab | Read-only sub-grid — no-op |

---

## Detailed: Production Details Modal

### Location
`client/src/pages/production/ProductionPage.jsx`

### Current state
- The file already has a Modal component (reused for the edit form) and imports `api` from `../../utils/api`.
- An existing `handleRowClick` function fetches `/productions/${production.id}` and displays a toast with input summary — this will be replaced by the details modal.
- The grid data already contains: `production_no`, `production_date`, `output_item_name`, `output_quantity`, `output_uom`, `finished_goods_warehouse_name`, `remarks`.
- The API at `GET /productions/:id` returns a full record with an `inputs` array.

### Implementation

1. **Add state variables** (alongside existing state):
   ```js
   const [detailProduction, setDetailProduction] = useState(null);
   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
   const [detailData, setDetailData] = useState(null);
   const [loadingDetail, setLoadingDetail] = useState(false);
   ```

2. **Add a fetch handler** for double-click:
   ```js
   const handleViewProduction = async (production) => {
     setLoadingDetail(true);
     setIsDetailModalOpen(true);
     try {
       const response = await api.get(`/productions/${production.id}`);
       setDetailProduction(production);
       setDetailData(response.data);
     } catch (error) {
       toast.error('Failed to load production details');
       setIsDetailModalOpen(false);
     } finally {
       setLoadingDetail(false);
     }
   };
   ```

3. **Wire `onRowDoubleClicked`** on the AG Grid:
   ```jsx
   <AgGridReact
     // ... existing props ...
     onRowDoubleClicked={(params) => handleViewProduction(params.data)}
   />
   ```

4. **Add a production details modal** below the existing edit modal:

   ```jsx
   {isDetailModalOpen && (
     <Modal
       isOpen={isDetailModalOpen}
       onClose={() => { setIsDetailModalOpen(false); setDetailProduction(null); setDetailData(null); }}
       title={detailProduction ? `Production: ${detailProduction.production_no}` : 'Production Details'}
       size="large"
     >
       {loadingDetail ? (
         <div className="loading"><div className="spinner"></div><p>Loading details...</p></div>
       ) : detailData ? (
         <ProductionDetails production={detailData} />
       ) : (
         <p>Failed to load production details.</p>
       )}
     </Modal>
   )}
   ```

### ProductionDetails Component

Create inside the same file (below the `ProductionForm` component):

```jsx
function ProductionDetails({ production }) {
  const { formatCurrency } = useSettings();

  return (
    <div className="production-details">
      {/* Header Info */}
      <div className="detail-section">
        <h3>Production Summary</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="label">Production #</span>
            <span className="value">{production.production_no}</span>
          </div>
          <div className="detail-item">
            <span className="label">Date</span>
            <span className="value">{format(new Date(production.production_date), 'dd MMM yyyy')}</span>
          </div>
          <div className="detail-item">
            <span className="label">Output Item</span>
            <span className="value">{production.output_item_name}</span>
          </div>
          <div className="detail-item">
            <span className="label">Quantity Produced</span>
            <span className="value production-output">
              {parseFloat(production.output_quantity).toFixed(2)} {production.output_uom}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Warehouse</span>
            <span className="value">{production.finished_goods_warehouse_name}</span>
          </div>
          {production.overhead_cost > 0 && (
            <div className="detail-item">
              <span className="label">Overhead Cost</span>
              <span className="value">{formatCurrency(production.overhead_cost)}</span>
            </div>
          )}
          {production.remarks && (
            <div className="detail-item full-width">
              <span className="label">Remarks</span>
              <span className="value">{production.remarks}</span>
            </div>
          )}
        </div>
      </div>

      {/* Input Materials Table */}
      <div className="detail-section">
        <h3>Raw Materials Consumed</h3>
        {production.inputs && production.inputs.length > 0 ? (
          <table className="materials-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {production.inputs.map((input, index) => (
                <tr key={index}>
                  <td>{input.item_name}</td>
                  <td>{parseFloat(input.quantity).toFixed(3)} {input.unit_of_measure}</td>
                  <td>{formatCurrency(input.unit_cost || 0)}</td>
                  <td>{formatCurrency((input.unit_cost || 0) * input.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan={3}><strong>Total Material Cost</strong></td>
                <td><strong>{formatCurrency(production.total_material_cost || 0)}</strong></td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="no-materials">No input materials recorded for this production.</p>
        )}
      </div>

      {/* Cost Summary */}
      {(production.total_material_cost > 0 || production.overhead_cost > 0) && (
        <div className="detail-section">
          <h3>Cost Summary</h3>
          <div className="cost-summary">
            <div className="cost-row">
              <span>Material Cost</span>
              <span>{formatCurrency(production.total_material_cost || 0)}</span>
            </div>
            {production.overhead_cost > 0 && (
              <div className="cost-row">
                <span>Overhead Cost</span>
                <span>{formatCurrency(production.overhead_cost)}</span>
              </div>
            )}
            <div className="cost-row total-row">
              <span><strong>Total Production Cost</strong></span>
              <span><strong>{formatCurrency((production.total_material_cost || 0) + (production.overhead_cost || 0))}</strong></span>
            </div>
            {production.output_quantity > 0 && (
              <div className="cost-row per-unit-row">
                <span>Cost per Unit</span>
                <span>{formatCurrency(((production.total_material_cost || 0) + (production.overhead_cost || 0)) / production.output_quantity)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Data shape from `GET /productions/:id`

```json
{
  "id": 1,
  "production_no": "PROD-001",
  "production_date": "2026-06-15",
  "output_item_id": 5,
  "output_item_name": "Bottled Mustard Oil",
  "output_quantity": 100,
  "output_uom": "Ltr",
  "finished_goods_warehouse_id": 1,
  "finished_goods_warehouse_name": "Main Warehouse",
  "total_material_cost": 4500.00,
  "overhead_cost": 500.00,
  "remarks": "Batch #B-2026-0615",
  "inputs": [
    {
      "item_id": 1,
      "item_name": "Mustard Seeds",
      "quantity": 250,
      "unit_of_measure": "Kg",
      "unit_cost": 15.00
    },
    {
      "item_id": 2,
      "item_name": "Plastic Bottle 1L",
      "quantity": 100,
      "unit_of_measure": "Nos",
      "unit_cost": 5.00
    }
  ]
}
```

### Styling notes

The existing `ProductionPage.css` already has styles for `.detail-section`, `.detail-item`, `.label`, `.value`, `.materials-table`, and `.cost-preview-*` classes that should mostly work. The following additional CSS will be needed:

```css
/* Production Details Modal */
.production-details {
  padding: 4px;
}

.production-details .detail-section {
  margin-bottom: 24px;
}

.production-details .detail-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: var(--neutral-900);
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary-500);
}

.production-details .details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.production-details .detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.production-details .detail-item.full-width {
  grid-column: 1 / -1;
}

.production-details .detail-item .label {
  font-size: 12px;
  font-weight: 600;
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.production-details .detail-item .value {
  font-size: 15px;
  color: var(--neutral-900);
}

.production-details .production-output {
  color: var(--success);
  font-weight: 700;
}

/* Materials Table */
.production-details .materials-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}

.production-details .materials-table th {
  background: var(--neutral-100);
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--neutral-700);
  border-bottom: 2px solid var(--neutral-300);
  font-size: 13px;
}

.production-details .materials-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--neutral-200);
  font-size: 14px;
}

.production-details .materials-table tbody tr:hover {
  background: var(--neutral-50);
}

.production-details .materials-table .total-row td {
  border-top: 2px solid var(--neutral-300);
  padding-top: 12px;
  font-size: 15px;
}

/* Cost Summary */
.production-details .cost-summary {
  background: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  border-radius: 8px;
  padding: 16px;
}

.production-details .cost-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
  color: var(--neutral-800);
}

.production-details .cost-row.total-row {
  border-top: 2px solid var(--neutral-300);
  margin-top: 4px;
  padding-top: 10px;
  font-size: 16px;
}

.production-details .cost-row.per-unit-row {
  color: var(--primary-600);
  font-weight: 600;
}

.production-details .no-materials {
  padding: 24px;
  text-align: center;
  color: var(--neutral-500);
  font-style: italic;
}
```

---

## Detailed: BOM Details Inline Component

### Location
`client/src/pages/bom/BOMPage.jsx`

### Current state
- A `BOMDetails` sub-component **already exists** at the bottom of `BOMPage.jsx` but is never rendered in the UI. It was likely created for this purpose but never wired up.
- The grid data already contains: `bom_no`, `bom_name`, `finished_item_name`, `quantity`, `finished_uom`, `item_count`, `total_material_cost`, `is_active`, `description`.
- The dropdown menu "Edit" option already fetches `GET /boms/:id` to get full details including `items` array.
- CSS for `.bom-details`, `.detail-section`, `.detail-item`, `.materials-table` already exists in `BOMPage.css`.

### Implementation

1. **Add state variables** (alongside existing state):
   ```js
   const [detailBOM, setDetailBOM] = useState(null);
   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
   const [detailBOMData, setDetailBOMData] = useState(null);
   const [loadingBOMDetail, setLoadingBOMDetail] = useState(false);
   ```

2. **Add a fetch handler** for double-click:
   ```js
   const handleViewBOM = async (bom) => {
     setLoadingBOMDetail(true);
     setIsDetailModalOpen(true);
     try {
       const response = await api.get(`/boms/${bom.id}`);
       setDetailBOM(bom);
       setDetailBOMData(response.data);
     } catch (error) {
       toast.error('Failed to load BOM details');
       setIsDetailModalOpen(false);
     } finally {
       setLoadingBOMDetail(false);
     }
   };
   ```

3. **Wire `onRowDoubleClicked`** on the AG Grid:
   ```jsx
   <AgGridReact
     // ... existing props ...
     onRowDoubleClicked={(params) => handleViewBOM(params.data)}
   />
   ```

4. **Add a BOM details modal** below the existing create/edit modal:
   ```jsx
   {isDetailModalOpen && (
     <Modal
       isOpen={isDetailModalOpen}
       onClose={() => { setIsDetailModalOpen(false); setDetailBOM(null); setDetailBOMData(null); }}
       title={detailBOM ? `BOM: ${detailBOM.bom_name}` : 'BOM Details'}
       size="medium"
     >
       {loadingBOMDetail ? (
         <div className="loading"><div className="spinner"></div><p>Loading BOM details...</p></div>
       ) : detailBOMData ? (
         <BOMDetails bom={detailBOMData} />
       ) : (
         <p>Failed to load BOM details.</p>
       )}
     </Modal>
   )}
   ```

### Existing BOMDetails Component (no changes needed)

The component already exists in `BOMPage.jsx` at the bottom of the file:

```jsx
function BOMDetails({ bom }) {
  return (
    <div className="bom-details">
      <div className="detail-section">
        <h3>Output</h3>
        <div className="detail-item">
          <span className="label">Finished Item:</span>
          <span className="value">{bom.finished_item_name}</span>
        </div>
        <div className="detail-item">
          <span className="label">Quantity:</span>
          <span className="value">
            {bom.quantity} {bom.finished_uom}
          </span>
        </div>
        {bom.description && (
          <div className="detail-item">
            <span className="label">Description:</span>
            <span className="value">{bom.description}</span>
          </div>
        )}
      </div>
      <div className="detail-section">
        <h3>Raw Materials Required</h3>
        <table className="materials-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Current Stock</th>
            </tr>
          </thead>
          <tbody>
            {bom.items.map((item, index) => (
              <tr key={index}>
                <td>{item.item_name}</td>
                <td>
                  {item.quantity} {item.unit_of_measure}
                </td>
                <td
                  className={
                    item.current_stock < item.quantity ? "low-stock" : ""
                  }
                >
                  {item.current_stock} {item.unit_of_measure}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**No changes needed** to this component — it already renders cleanly with the `bom` object from `GET /boms/:id`.

### Data shape from `GET /boms/:id`

```json
{
  "id": 1,
  "bom_no": "BOM-001",
  "bom_name": "Mustard Oil 1L - Standard",
  "finished_item_id": 5,
  "finished_item_name": "Bottled Mustard Oil",
  "finished_uom": "Ltr",
  "quantity": 1,
  "description": "Standard recipe for 1 liter bottle of mustard oil",
  "is_active": true,
  "total_material_cost": 45.00,
  "items": [
    {
      "item_id": 1,
      "item_name": "Mustard Seeds",
      "quantity": 2.5,
      "unit_of_measure": "Kg",
      "current_stock": 500
    },
    {
      "item_id": 2,
      "item_name": "Plastic Bottle 1L",
      "quantity": 1,
      "unit_of_measure": "Nos",
      "current_stock": 200
    }
  ]
}
```

### Styling notes

CSS classes already exist in `BOMPage.css`:
- `.bom-details` — padding container
- `.detail-section` — section wrapper with bottom margin
- `.detail-section h3` — section heading with primary-color bottom border
- `.detail-item` — flex row for label/value pairs
- `.detail-item .label` — 140px wide label (bold, neutral-700)
- `.detail-item .value` — value text (neutral-900)
- `.materials-table` — full-width table with hover effects
- `.materials-table .low-stock` — red text for low stock cells

No new CSS needed for BOM details.

---

## Implementation Pattern

Each file follows this template:

```jsx
// In the AG Grid JSX, add:
<AgGridReact
  theme="legacy"
  // ... existing props ...
  onRowDoubleClicked={(params) => {
    // Action based on the table:
    navigate(`/customers/${params.data.id}`);
    // or
    setPreviewItem(params.data);
    // or
    handleViewProduction(params.data);
    // etc.
  }}
/>
```

Key points:
- The `onRowDoubleClicked` handler must be added to the `<AgGridReact>` component, not to individual column definitions.
- The handler receives AG Grid's `RowDoubleClickedEvent` — access record data via `params.data`.
- For modals, the double-click handler should set the appropriate state variable that triggers the modal.
- Ensure `navigate` (from `react-router-dom`) is imported and available in each page component.

## Verification

1. Open each modified page and double-click a row
2. Confirm the expected behavior:
   - Navigation pages: correct URL loads with all data
   - Preview modals: modal opens with correct record data
   - Management modals: correct modal opens (permissions/BOM details)
   - Production details modal: shows summary, materials table, and cost summary
   - BOM details modal: reuses existing BOMDetails component within a Modal wrapper
   - No-op pages: nothing happens on double-click
3. Confirm double-click still works on already-implemented pages (Sales, Sales Orders, Quotations)
4. Confirm the 3-dot menu "View" option still works alongside double-click
5. Confirm single-click behavior (sorting, filtering, row selection) still works
6. Confirm excluded pages/reports are unaffected
7. Check for TypeScript/JSX compilation errors
