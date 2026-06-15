# Menu Reorganization Spec

## Objective
Reorganize the ERP navigation menu items and their groupings in both the **Sidebar** and **TopMenu** components to follow a logical department-based structure that better reflects the business workflow.

## Files to Modify
- `client/src/components/layout/Sidebar.tsx` — `getNavItems()` function
- `client/src/components/layout/TopMenu.tsx` — `getNavItems()` function
- `client/src/components/common/SearchModal.tsx` — `PAGES` array (category updates + adding missing pages)
- `client/src/locales/en.json` — `nav` section (new keys: `manufacturing`, `purchaseReturns`, `invoiceReturns`, `productionSummary`, `bomUsage`, `manageExpenses`)
- `client/src/locales/ur.json` — `nav` section (same new keys as en.json)

---

## Proposed Menu Structure

The order follows: **Dashboard → Store → Source → Make → Sell → Serve → Analyze → Plan → People → Admin**

### 1. Dashboard
- **Type:** Single top-level item
- **Path:** `/`
- **Icon:** LayoutDashboard

### 2. Inventory
- **Type:** Dropdown group
- **Icon:** Package
- **Children:**
  - Items (`/inventory/items`)
  - Warehouses (`/inventory/warehouses`)
  - Stock Movements (`/inventory/stock-movements`)
  - Stock by Warehouse (`/inventory/stock-by-warehouse`)

### 3. Purchases
- **Type:** Dropdown group
- **Icon:** ShoppingCart
- **Children:**
  - Purchases (`/purchases`)
  - Purchase Orders (`/purchase-orders`)
  - Suppliers (`/suppliers`)
  - **NEW:** Purchase Returns (`/purchases/returns`)

### 4. Manufacturing
- **Type:** Dropdown group (**merged** from separate BOM + Production items)
- **Icon:** Factory or ClipboardList (decide during implementation — Factory is more representative of "Manufacturing")
- **Label:** `nav.manufacturing` (new translation key needed)
- **Children:**
  - Bill of Materials (`/bom`) — moved from standalone
  - Production (`/production`) — moved from standalone
  - **NEW:** Production Summary Report (`/reports/production-summary`)
  - **NEW:** BOM Usage Report (`/reports/bom-usage`)

### 5. Sales
- **Type:** Dropdown group
- **Icon:** DollarSign
- **Children:**
  - POS Terminal (`/pos`)
  - Invoices (`/sales`)
  - Quotations (`/quotations`)
  - Sales Orders (`/sales-orders`)
  - **NEW:** Invoice Returns (`/sales/returns`)
  - **REMOVED:** Create (`/sales/invoice`) — remove from nav (users create from Invoices page)
  - **MOVED:** Customers → now a separate top-level item

### 6. Customers
- **Type:** Dropdown group (**promoted** from child of Sales to top-level)
- **Icon:** Users
- **Label:** `nav.customers` (already exists)
- **Children:**
  - Customers (`/customers`)
  - **NEW:** Customer Statement — The nav item under Customers should link to `/customers` list page (not the dynamic `/customers/:id/statement` route). Users navigate to the statement from within the customer detail page.
  - **MOVED:** Payments (`/payments`) — moved from standalone to under Customers

### 7. Reports
- **Type:** Dropdown group
- **Icon:** BarChart3
- **Existing children** (unchanged relationships):
  - Reports Dashboard (`/reports`)
  - A/R Reports (`/reports/accounts-receivable`)
  - Sales Summary (`/reports/sales-summary`)
  - Stock Levels (`/reports/stock-level`)
  - Low Stock Alert (`/reports/low-stock`)
  - Profit & Loss (`/reports/profit-loss`)
  - Cash Flow (`/reports/cash-flow`)
- **NEW children to add:**
  - **Stock Valuation** (`/reports/stock-valuation`)
  - **Inventory Movement** (`/reports/inventory-movement`)
  - **Manage Expenses** (`/expenses`) — **moved** from standalone top-level item. Label uses `nav.manageExpenses`. Links to the transaction recording/management page, NOT the Expenses Report (`/reports/expenses`).

### 8. Forecasts
- **Type:** Dropdown group (kept separate)
- **Icon:** TrendingUp
- **Children** (unchanged):
  - Dashboard (`/forecasts`)
  - Demand Forecast (`/forecasts/demand`)
  - Trends (`/forecasts/trends`)

### 9. HR
- **Type:** Dropdown group (kept as dropdown, even with single child)
- **Icon:** Briefcase
- **Children:**
  - Employees (`/employees`)

### 10. Administrator
- **Type:** Dropdown group (**expanded**)
- **Icon:** Shield (Sidebar), Settings (TopMenu) — **unify to Shield icon** in both
- **Children:**
  - Users (`/users`)
  - Roles (`/roles`)
  - **MOVED:** Activity Log (`/activity-log`) — from standalone
  - **MOVED:** Integrations (`/integrations`) — from standalone

### 11. Settings
- **Type:** Single top-level item
- **Path:** `/settings`
- **Icon:** Settings

---

## Summary of Changes

### Items Moved
| Item | From | To |
|------|------|----|
| Customers | Under Sales dropdown | Top-level group (with Payments + Statement) |
| Payments | Standalone top-level | Under Customers group |
| BOM | Standalone top-level | Under Manufacturing group |
| Production | Standalone top-level | Under Manufacturing group |
| Expenses (`/expenses`) | Standalone top-level | Under Reports group (as "Manage Expenses") |
| Activity Log | Standalone top-level | Under Administrator group |
| Integrations | Standalone top-level | Under Administrator group |

### Items Removed
- **Create** (`/sales/invoice`) — removed from Sales dropdown

### Items Added (NEW)
| Item | Parent Group | Path |
|------|-------------|------|
| Purchase Returns | Purchases | `/purchases/returns` |
| Customer Statement | Customers | `/customers/{id}/statement` |
| Stock Valuation Report | Reports | `/reports/stock-valuation` |
| Inventory Movement Report | Reports | `/reports/inventory-movement` |
| Production Summary Report | Manufacturing | `/reports/production-summary` |
| BOM Usage Report | Manufacturing | `/reports/bom-usage` |
| Invoice Returns | Sales | `/sales/returns` |
| Manage Expenses (label) | Reports | `/expenses` (transaction page, not report) |

### Items Unchanged
- Dashboard
- Inventory (all children)
- Purchases → Suppliers, Purchase Orders
- Sales → POS, Invoices, Quotations, Sales Orders
- Reports → Dashboard, A/R, Sales Summary, Stock Levels, Low Stock, P&L, Cash Flow
- Forecasts (all children)
- HR → Employees
- Administrator → Users, Roles
- Settings

### Items NOT added (per user decision)
- Sales by Customer Report (kept accessible only from Reports Dashboard/context)
- Sales by Item Report (kept accessible only from Reports Dashboard/context)
- Supplier Analysis Report (kept accessible only from Reports Dashboard/context)

---

## SearchModal Updates

The SearchModal `PAGES` array needs comprehensive updates to match the new menu structure.

### Current PAGES array (for reference):
```
Dashboard (General)
Inventory Items (Inventory)
Warehouses (Inventory)
Stock Movements (Inventory)
Stock by Warehouse (Inventory)
Purchases (Purchasing)
Bill of Materials (Production)
Production (Production)
Sales (Sales)
Point of Sale (Sales)
Customers (Sales) ← needs category change
Reports Dashboard (Reports)
Accounts Receivable (Reports)
Sales Summary (Reports)
Sales by Customer (Reports) ← exists in SearchModal but NOT in nav (kept as-is)
Sales by Item (Reports) ← same, exists in SearchModal only
Stock Level (Reports)
Stock Valuation (Reports) ← already exists ✅
Low Stock (Reports)
Inventory Movement (Reports) ← already exists ✅
Profit & Loss (Reports)
Cash Flow (Reports)
Customer Statements (Reports) ← already exists, NOT added to nav
Top Debtors (Reports) ← exists in SearchModal only
DSO Report (Reports) ← exists in SearchModal only
Purchase Summary (Reports) ← exists in SearchModal only
Supplier Analysis (Reports) ← exists in SearchModal only
Production Summary (Reports) ← already exists ✅ (move category to Manufacturing or keep in Reports)
BOM Usage (Reports) ← already exists ✅ (move category to Manufacturing or keep in Reports)
Settings (General)
```

### Pages MISSING from SearchModal that should be added:
| Page Name | Path | Category |
|-----------|------|----------|
| Expenses | `/expenses` | Reports |
| Purchase Returns | `/purchases/returns` | Purchasing |
| Invoice Returns | `/sales/returns` | Sales |
| Payments | `/payments` | General (or Customers) |
| Activity Log | `/activity-log` | General |
| Integrations | `/integrations` | General |
| Ecosystem | `/ecosystem` | General |

### Category changes needed:
- **Customers** — change from `Sales` → keep under `Sales` (it's still a sales-related entity even though it's a top-level nav group). Or create a `Customers` category. **Decision needed during implementation.**
- **Bill of Materials** — change from `Production` → `Manufacturing`
- **Production** — change from `Production` → `Manufacturing`
- **Expenses** — add as new entry under `Reports` category
- **Production Summary** — keep under `Reports` (it's already there, no change needed)
- **BOM Usage** — keep under `Reports` (it's already there, no change needed)

## Translation Updates
- Add `nav.manufacturing` ("Manufacturing") to both locale files ✅ — already done
- Add `nav.purchaseReturns` ("Purchase Returns") ✅ — already done
- Add `nav.invoiceReturns` ("Invoice Returns") ✅ — already done
- Add `nav.productionSummary` ("Production Summary") ✅ — already done
- Add `nav.bomUsage` ("BOM Usage") ✅ — already done
- Add `nav.manageExpenses` ("Manage Expenses") ✅ — already done
- `nav.stockValuation` and `nav.inventoryMovement` already exist in both locale files ✅
- `nav.expenses` key still exists as-is — no change needed (repurposed/referenced from existing translation)

## TopMenu Considerations
- **VISIBLE_ITEMS = 8** (keep unchanged)
- Top-level groups count: Dashboard(1) + Inventory(2) + Purchases(3) + Manufacturing(4) + Sales(5) + Customers(6) + Reports(7) + Forecasts(8) = 8 visible
- Items 9-11 (HR, Administrator, Settings) will go into the "More" overflow dropdown
- **Overflow flattening behavior:** The TopMenu overflow currently renders nested children as flat links without group headers. This means:
  - **HR** (index 9, has children) → will show just "Employees" in the overflow (losing the "HR" group label)
  - **Administrator** (index 10, has children) → will show flat: "Users", "Roles", "Activity Log", "Integrations" (losing "Administrator" label)
  - **Settings** (index 11, no children) → will show normally
  - This is acceptable — standard UX for overflow menus. No changes needed to the TopMenu overflow render logic.

## Icon Consistency
- Administrator: Use **Shield** icon in both Sidebar and TopMenu (currently TopMenu uses Settings icon)

## Edge Cases
1. **Customer Statement — TWO separate pages exist:**
   - `CustomerStatement.jsx` at `/customers/:id/statement` — individual customer statement (dynamic route)
   - `CustomerStatementsReport.jsx` at `/reports/customer-statements` — bulk customer statements report (already in SearchModal under Reports)
   - **Nav decision:** The nav item under Customers links to `/customers` list page (not the dynamic route). The bulk report stays accessible only via SearchModal.

2. **Expenses clarification** — There are two separate pages: `/expenses` (transaction recording/management) and `/reports/expenses` (expenses report). After user clarification:
   - The **nav link** under Reports goes to `/expenses` (the transaction management page)
   - The **label** is "Manage Expenses" (`nav.manageExpenses`) to distinguish from the report
   - The Expenses Report (`/reports/expenses`) remains accessible via SearchModal under Reports category

3. **BOM Usage Report + Production Summary Report** — Placed under Manufacturing group in nav but the routes are under `/reports/`. SearchModal can categorize them under either Manufacturing or Reports. **Recommendation:** Keep them under `Reports` category in SearchModal (since their routes are `/reports/...`) but in the nav they're under Manufacturing.

4. **Ecosystem page** — The `/ecosystem` route (EcosystemView) appears on the Dashboard quick actions card but is NOT in any nav menu or SearchModal. Add it to SearchModal under `General` category.

5. **TopMenu overflow group labels** — Items 9-11 lose their group context when in the "More" overflow dropdown (see TopMenu section above). This is accepted behavior.

6. **Icon for Administrator** — Currently Sidebar uses `Shield` icon and TopMenu uses `Settings` icon. **Unify to `Shield` icon in both.**

## Testing / Validation
After implementation:
1. Verify Sidebar renders all groups correctly, no broken links
2. Verify TopMenu renders first 8 items, overflow has HR + Administrator + Settings
3. Verify all moved pages are accessible
4. Verify no orphaned translation keys in the nav
5. Verify Search modal reflects correct categories
