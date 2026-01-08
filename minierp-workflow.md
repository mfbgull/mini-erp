# Complete Business Workflow - Mini ERP

---

## 📦 STEP 1: PURCHASE RAW MATERIALS

### Create Purchase Order (PO)
```
PO-2025-0001
├─ Supplier: XYZ Supplies
├─ Items:
│  ├─ Bottles: 1000 @ $0.50 = $500
│  ├─ Water: 500L @ $2/L = $1000
│  └─ Labels: 1000 @ $0.10 = $100
└─ Total: $1600
```

### Submit & Track Supplier Ledger
```
Status: Draft → Submitted
Supplier Ledger Entry:
  debit: $1600 (what we owe)
  balance: $1600 (running AP balance)
```

### Receive Goods (Goods Receipt)
```
GR-2025-0001 Received
├─ Stock Movement Created: STK-2025-0001
│  ├─ Type: PURCHASE (positive)
│  ├─ Quantity: +1000 bottles
│  └─ Unit Cost: $0.50
└─ Stock Updated:
   ├─ stock_balances: WH-1, Bottles = 1000
   └─ items.current_stock = 1000
```

---

## 🏭 STEP 2: PRODUCTION (Raw Materials → Finished Goods)

### Define Bill of Materials (BOM)
```
BOM-2025-0001: "Bottled Water"
Finished Item: Bottled Water (produces 1 unit)
Required Materials:
  ├─ 1 Bottle @ $0.50
  ├─ 0.5L Water @ $2/L = $1.00
  └─ 1 Label @ $0.10
  ───────────────────────────
  Total Cost: $1.60 per unit
```

### Record Production
```
PROD-2025-0001
Output: 500 units of Bottled Water
Warehouse: WH-2 (Finished Goods)
```

### Material Consumption (Stock OUT)
```
For EACH material:
  Stock Movement: STK-2025-0002
    ├─ Type: PRODUCTION (negative)
    ├─ Quantity: -500 bottles
    └─ Ref: PROD-2025-0001

  stock_balances: WH-1, Bottles = 500 remaining
```

### Finished Goods Created (Stock IN)
```
Stock Movement: STK-2025-0003
  ├─ Type: PRODUCTION (positive)
  ├─ Quantity: +500 units
  └─ Ref: PROD-2025-0001

stock_balances: WH-2, Bottled Water = 500
```

---

## 💰 STEP 3: SELL FINISHED GOODS

### Record Sale
```
SALE-2025-0001
├─ Item: Bottled Water
├─ Quantity: 100 units
├─ Unit Price: $5.00
├─ Total: $500
└─ Stock Check: ✅ 500 available (can sell 100)
```

### Create Invoice
```
INV-2025-0001
├─ Customer: ABC Company
├─ Items: 100 Bottled Water @ $5.00 = $500
├─ Status: Unpaid
└─ Due Date: 30 days
```

### Stock Deduction (Stock OUT)
```
Stock Movement: STK-2025-0005
  ├─ Type: SALE (negative)
  ├─ Quantity: -100 units
  └─ Ref: SALE-2025-0001

stock_balances: WH-2, Bottled Water = 400 remaining
```

### Receive Payment
```
Payment #PAY-2025-0001
├─ Amount: $500
├─ Invoice: INV-2025-0001
└─ Status: Paid
```

---

## 📊 STEP 4: RECORD OPERATING EXPENSES

```
Expense Records (must be marked "Paid" to count):
EXP-2501-0001: Labor Costs          $200
EXP-2501-0002: Utilities            $50
EXP-2501-0003: Marketing            $100
EXP-2501-0004: Rent                $500
───────────────────────────────────────────
Total Operating Expenses: $850
```

---

# 💵 HOW TO CALCULATE ACTUAL INCOME/PROFIT

## The Formula:
```
REVENUE = Sum of all invoice sales
COGS = Sum of (quantity_sold × item.standard_cost)
EXPENSES = Sum of all paid expenses
───────────────────────────────────────────────────
NET PROFIT = REVENUE - COGS - EXPENSES
```

## Example Calculation:

```
Period: January 2025

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REVENUE CALCULATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invoice INV-2025-0001:   100 units × $5.00 = $500
Invoice INV-2025-0002:    80 units × $5.00 = $400
Invoice INV-2025-0003:   120 units × $5.00 = $600
                                   ──────
Total Revenue:                           $1,500
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COGS CALCULATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bottled Water Standard Cost: $1.60 per unit
  100 units × $1.60 = $160
   80 units × $1.60 = $128
  120 units × $1.60 = $192
                                   ──────
Total COGS:                              $480
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXPENSES CALCULATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Labor Costs:       $200
Utilities:          $50
Marketing:         $100
Rent:             $500
                                   ──────
Total Expenses:                           $850
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROFIT CALCULATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Revenue:         $1,500
- COGS:           $480
─────────────────────
Gross Profit:     $1,020  (68% margin)

- Expenses:       $850
─────────────────────
NET PROFIT:        $170    (11.3% margin)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# 📈 KEY REPORTS TO VIEW INCOME

## 1. Profit & Loss Report
**Path:** Reports → Profit & Loss
**Shows:**
- Total Revenue (all sales invoiced)
- Cost of Goods Sold
- Gross Profit (Revenue - COGS)
- Total Expenses (operating costs)
- Net Profit (Gross Profit - Expenses)
- Profit Margins (%)

**API:** `GET /reports/profit-loss?fromDate=2025-01-01&toDate=2025-01-31`

## 2. Sales Summary
**Path:** Reports → Sales Summary
**Shows:**
- All invoice transactions
- Total sales, total items sold
- Payment status (paid/unpaid)
**API:** `GET /reports/sales-summary?fromDate=...&toDate=...`

## 3. Stock Valuation
**Path:** Reports → Stock Valuation
**Shows:**
- Current inventory value (quantity × standard_cost)
- Total value of all stock on hand
**API:** `GET /reports/stock-valuation`

## 4. Cash Flow Report
**Path:** Reports → Cash Flow
**Shows:**
- Cash inflows (sales receipts)
- Cash outflows (payments, purchases)
- Net cash position
**API:** `GET /reports/cash-flow?fromDate=...&toDate=...`

---

# ⚠️ IMPORTANT LIMITATIONS

### What IS Tracked:
✅ Purchase costs (PO unit prices)
✅ Standard costs per item (manually maintained)
✅ Selling prices per invoice
✅ Operating expenses by category
✅ Stock movements (full audit trail)
✅ Supplier ledger (Accounts Payable)
✅ Customer ledger (Accounts Receivable)

### What is NOT Tracked:
❌ **Actual production costs** (uses only standard_cost, no labor/overhead)
❌ **Landed costs** (only PO price, no freight/tax/shipping)
❌ **Cost variance** (standard vs actual difference not calculated)
❌ **Multi-currency** (single currency only)
❌ **Serial/Batch tracking** (no expiry, no lot numbers)

---

# 🎯 COMPLETE DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    PURCHASING PHASE                      │
└─────────────┬───────────────────────────────────────────────┘
              │
              ├─ Purchase Order (Draft)
              │
              ├─ Submit → Supplier Ledger (AP)
              │
              └─ Goods Receipt → Stock Movement (IN)
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PRODUCTION PHASE                       │
└─────────────┬───────────────────────────────────────────────┘
              │
              ├─ BOM Definition (materials needed)
              │
              ├─ Production Record
              │
              ├─ Stock Movements (OUT for materials)
              │
              └─ Stock Movements (IN for finished goods)
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                     SALES PHASE                          │
└─────────────┬───────────────────────────────────────────────┘
              │
              ├─ Sale Record → Stock Movement (OUT)
              │
              ├─ Invoice Creation → Revenue Recognized
              │
              └─ Payment Receipt → A/R Updated
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                  FINANCIAL PHASE                         │
└─────────────┬───────────────────────────────────────────────┘
              │
              ├─ Record Expenses (must mark Paid)
              │
              ├─ Calculate COGS (qty sold × standard_cost)
              │
              ├─ Calculate Gross Profit (Revenue - COGS)
              │
              └─ Calculate Net Profit (Gross - Expenses)
                                ↓
                    ┌────────────────┐
                    │   REPORTS     │
                    └────────────────┘
```

---

# 📝 Quick Reference: API Endpoints for Income Calculation

| Purpose | Endpoint | Returns |
|----------|-----------|----------|
| **Profit & Loss** | `/reports/profit-loss` | Revenue, COGS, Expenses, Net Profit |
| **Sales Summary** | `/reports/sales-summary` | All sales transactions |
| **Purchase Summary** | `/reports/purchase-summary` | All purchase costs |
| **Expenses** | `/reports/expenses` | Operating expenses by category |
| **Stock Valuation** | `/reports/stock-valuation` | Inventory value |
| **Cash Flow** | `/reports/cash-flow` | Cash in/outflows |
| **A/R Aging** | `/reports/ar-aging` | Outstanding receivables |
| **Supplier Balance** | `/suppliers/:id/balance` | Outstanding payables |

---

# 🔍 DATABASE TABLES & KEY MODELS

## Core Tables:

### Inventory Layer
- **items** - Products, raw materials, finished goods
- **warehouses** - Storage locations
- **stock_balances** - Current quantities per warehouse
- **stock_movements** - Audit trail (IN, OUT, PRODUCTION, SALE, TRANSFER, ADJUSTMENT)

### Purchasing Layer
- **suppliers** - Vendor master
- **purchase_orders** - PO header (status: Draft → Submitted → Completed)
- **purchase_order_items** - PO detail (quantity, unit_price, received_quantity)
- **goods_receipts** - Receiving confirmation
- **supplier_ledger** - AP tracking (debit/credit/balance)

### Sales Layer
- **customers** - Customer master
- **sales_orders** - SO header
- **sales_order_items** - SO detail
- **invoices** - Billing documents (status: Unpaid → Paid)
- **invoice_items** - Invoice detail (unit_price, quantity)
- **payments** - Customer payments received

### Manufacturing Layer
- **boms** - BOM header
- **bom_items** - Raw materials needed per BOM
- **productions** - Production records (inputs consumed, output produced)
- **production_inputs** - Materials consumed in production

### Financial Layer
- **expenses** - Operating expenses by category
- **expense_categories** - Predefined categories (Office, Travel, Utilities, Rent, Salaries, etc.)

---

# 📊 REPORTS AVAILABLE

## Financial Reports

### Profit & Loss Report
```
GET /reports/profit-loss?fromDate=...&toDate=...
Returns:
  - totalRevenue
  - totalCogs
  - grossProfit
  - totalExpenses
  - netProfit
  - grossProfitMargin (%)
  - netProfitMargin (%)
```

### Accounts Receivable (AR) Reports
```
- A/R Aging: Outstanding invoices aged by days (0-30, 31-60, 61-90, 90+)
- Top Debtors: Largest outstanding balances
- DSO Metric: Days Sales Outstanding
- Receivables Summary: Invoice status breakdown
```

### Cash Flow Report
```
GET /reports/cash-flow?fromDate=...&toDate=...
Returns:
  - Cash inflows (sales receipts)
  - Cash outflows (payments to suppliers, expenses)
  - Net cash position
```

## Sales Reports

### Sales Summary
```
GET /reports/sales-summary?fromDate=...&toDate=...
Returns all transactions with:
  - Invoice date, number, customer
  - Total sales, items sold
  - Paid amount, balance, status
  - Summary: total invoices, sales, items, average value
```

### Sales by Customer
```
Returns:
  - Customer name, total invoices
  - Total sales revenue
  - Total items sold
  - Average order value
  - Last purchase date
```

### Sales by Item
```
Returns:
  - Item code, name
  - Total quantity sold
  - Total revenue per item
  - Average selling price
  - Invoice count
```

## Inventory Reports

### Stock Level Report
```
Returns:
  - Item name, code
  - Current stock vs reorder level
  - Status: Out of Stock | Low Stock | In Stock
```

### Stock Valuation Report
```
GET /reports/stock-valuation
For each item:
  total_value = current_stock × standard_cost
Returns:
  - Stock valuation per item
  - Summary: total items, total value
```

### Inventory Movement Report
```
GET /reports/inventory-movement?fromDate=...&toDate=...
Returns:
  - All stock movements (type, quantity, cost)
  - Summary: total inbound, outbound, net movement
```

## Purchase Reports

### Purchase Summary
```
GET /reports/purchase-summary?fromDate=...&toDate=...
Returns:
  - PO number, supplier, date
  - Status, total cost, items
  - Received amount, balance
  - Summary: total orders, cost, average value
```

### Supplier Analysis
```
Returns:
  - Supplier name, total orders
  - Total purchases
  - Average unit price
  - First/last order dates
```

## Production Reports

### Production Summary
```
Returns:
  - Production number, BOM name
  - Planned vs produced quantity
  - Status, completion percentage
  - Summary: total work orders, produced, in-progress
```

### BOM Usage Report
```
GET /reports/bom-usage?fromDate=...&toDate=...
Returns:
  - BOM name, finished good
  - Usage count, total quantity used
```

## Expense Reports

### Expenses Report
```
GET /reports/expenses?fromDate=...&toDate=...&category=...
Returns:
  - Expense category, description
  - Amount, date, vendor
  - Status (Draft | Submitted | Approved | Paid)
  - Summary: total expenses, category breakdown
```

---

# 🎓 HOW TO USE THE SYSTEM FOR PROFIT TRACKING

## Daily Operations:

1. **Purchase Materials**
   - Create PO → Submit → Receive goods
   - System tracks: Stock IN, supplier balance (AP)

2. **Production**
   - Create BOM (if needed)
   - Record production → System deducts materials, adds finished goods
   - System tracks: Material consumption, output production

3. **Sales**
   - Record sale → Create invoice
   - System tracks: Stock OUT, revenue, A/R balance

4. **Expenses**
   - Record daily operating expenses
   - Mark as "Paid" to count in profit calculations

## Monthly Profit Calculation:

1. Run **Profit & Loss Report** for the month
2. Review:
   - Revenue: Total sales invoiced
   - Gross Profit: Revenue - COGS (product margin)
   - Net Profit: Gross Profit - Operating Expenses
3. Analyze:
   - Profit margins (gross vs net)
   - Top selling items
   - Expense categories
   - A/R aging (collections)

## Quarterly/Annual Analysis:

1. **Stock Valuation** - Current inventory value
2. **Sales Summary** - Revenue trends by period
3. **Purchase Summary** - Cost trends, supplier performance
4. **Cash Flow** - Cash position over time
5. **A/R Aging** - Customer payment issues
6. **Production Summary** - Manufacturing efficiency

---

This ERP provides end-to-end workflow management with complete audit trails and financial reporting.
