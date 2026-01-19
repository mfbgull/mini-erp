# 📋 Price History Hint Feature - Implementation Guide

## 🎯 Feature Overview

**Feature**: When adding items to a customer invoice, show a hint displaying:
1. Current selling price of the selected item
2. Last sold price to the same customer (from previous invoices)
3. Price difference with percentage
4. Transaction count and average price
5. Smart recommendations based on price trends

**Benefits**:
- Helps salespeople maintain consistent pricing
- Shows if price increased or decreased from last sale
- Provides historical context for better negotiations
- Prevents accidental price changes

---

## 📁 Files Created

### 1. PriceHistoryHint Component
**File**: `client/src/components/invoice/PriceHistoryHint.jsx`

**Features**:
- Fetches historical pricing for item + customer combination
- Displays current vs last price comparison
- Shows price difference with percentage
- Displays transaction count and average price
- Provides smart recommendations
- Loading states and error handling
- Close button to dismiss hint

### 2. PriceHistoryHint Styles
**File**: `client/src/components/invoice/PriceHistoryHint.css`

**Styles**:
- Fixed position modal overlay
- Smooth slide-in animation
- Responsive design
- Theme-specific colors (ERPNext, Odoo, SAP)
- Color-coded price differences:
  - Same price: gray
  - Price increased: red/orange
  - Price decreased: green

---

## 🔧 Implementation Steps

### Step 1: Import Component in SalesInvoicePage

Add this import to `client/src/pages/sales/SalesInvoicePage.jsx`:

```javascript
import PriceHistoryHint from '../../components/invoice/PriceHistoryHint';
```

### Step 2: Add State for Price Hint

Add state variable to track which item is showing price history:

```javascript
const [showPriceHint, setShowPriceHint] = useState(null);
```

`showPriceHint` should be an object with:
```javascript
{
  itemId: 123,        // Item ID
  customerId: 456,     // Customer ID
  currentPrice: 50.00   // Current price (item.rate)
}
```

### Step 3: Add Button to Rate Header

Modify the Rate table header to include a 💰 button:

**Location**: Around line 1156 in SalesInvoicePage.jsx

**Current**:
```jsx
<th className="text-right">Rate</th>
```

**After**:
```jsx
<th className="text-right">
  Rate
  <button
    type="button"
    className="price-history-btn"
    onClick={(e) => {
      e.stopPropagation();
      setShowPriceHint({
        itemId: item.item_id,
        customerId: invoice.customer_id,
        currentPrice: item.rate
      });
    }}
    title="View price history"
  >
    💰
  </button>
</th>
```

### Step 4: Add PriceHistoryHint Component

After the items table `</div>` closing tag (around line 1252), add the component:

```jsx
{/* Price History Hint - Show when item is selected */}
{showPriceHint && (
  <PriceHistoryHint
    itemId={showPriceHint.itemId}
    customerId={showPriceHint.customerId}
    currentPrice={showPriceHint.currentPrice}
    onClose={() => setShowPriceHint(null)}
  />
)}
```

---

## 🎨 UI Design

### Hint Modal Layout

```
┌───────────────────────────────────────┐
│                                    [×]        │ ← Close button
├───────────────────────────────────────┤
│                                          │
│           💰  Price History                │
├───────────────────────────────────────┤
│                                          │
│  Current Price:   $50.00            │ ← Bold, large
│                                          │
│  Last Sold to ABC Corp: $45.00     │ ← Last price
│      (Jan 15, 2025)               │ ← Invoice date
│                                          │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                          │
│            ↑ $5.00 higher (+11.1%)       │ ← Red if increased
│         [⚠️] Price increased. Confirm... │ ← Warning
│                                          │
│   5 previous transactions  | Avg: $47.50   │ ← Stats
│                                          │
└───────────────────────────────────────┘
```

### Color Coding

| Status | Background | Border | Meaning |
|--------|-----------|--------|----------|
| Same Price | Gray | Light Gray | No change |
| Price Increased | Red/Orange | Dark Red | Price went up - caution |
| Price Decreased | Green | Light Green | Good deal - discount |

---

## 🔌 Backend API Implementation

### Required Endpoint

Create endpoint: `GET /api/sales/item-customer-history`

**Query Parameters**:
- `item_id`: ID of the item
- `customer_id`: ID of the customer

**Response Format**:
```json
{
  "success": true,
  "data": {
    "last_price": 45.00,
    "last_invoice_id": "INV-2025-001",
    "last_invoice_date": "2025-01-15T00:00:00.000Z",
    "customer_name": "ABC Corporation",
    "transaction_count": 5,
    "avg_price": 47.50,
    "price_history": [
      {
        "invoice_id": "INV-2025-001",
        "invoice_date": "2025-01-15T00:00:00.000Z",
        "unit_price": 45.00,
        "quantity": 10
      },
      // ... more transactions
    ]
  }
}
```

### SQL Query

```sql
SELECT
  i.unit_price AS last_price,
  si.invoice_id AS last_invoice_id,
  si.invoice_date AS last_invoice_date,
  c.customer_name,
  COUNT(*) OVER (PARTITION BY c.id) as transaction_count,
  AVG(i.unit_price) OVER (PARTITION BY c.id) as avg_price
FROM sales_items si
JOIN sales_invoices s ON si.invoice_id = s.invoice_id
JOIN customers c ON s.customer_id = c.id
WHERE si.item_id = ?
  AND c.id = ?
  AND s.status != 'Cancelled'
ORDER BY s.invoice_date DESC
LIMIT 1;
```

### Implementation in server.js

Add this route to `server/server.js`:

```javascript
// Get price history for item + customer
app.get('/api/sales/item-customer-history', async (req, res) => {
  try {
    const { item_id, customer_id } = req.query;

    // Validate inputs
    if (!item_id || !customer_id) {
      return res.status(400).json({
        success: false,
        error: 'Item ID and Customer ID are required'
      });
    }

    const db = getDb();

    // Fetch most recent price for this item to this customer
    const query = `
      SELECT
        si.unit_price AS last_price,
        si.invoice_id AS last_invoice_id,
        s.invoice_date AS last_invoice_date,
        c.customer_name,
        COUNT(*) OVER (PARTITION BY c.id) as transaction_count,
        AVG(i.unit_price) OVER (PARTITION BY c.id) as avg_price
      FROM sales_items si
      INNER JOIN sales_invoices s ON si.invoice_id = s.invoice_id
      INNER JOIN customers c ON s.customer_id = c.id
      WHERE si.item_id = ?
        AND c.id = ?
        AND s.status != 'Cancelled'
      ORDER BY s.invoice_date DESC
      LIMIT 1
    `;

    const result = db.prepare(query).get(item_id, customer_id);

    if (!result) {
      return res.json({
        success: true,
        data: {
          data: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        data: result
      }
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price history'
    });
  }
});
```

---

## 💡 Usage Examples

### Example 1: First Sale to Customer

```
Current Price: $50.00
Last Sold Price: [No previous sales]
→ No price history available
```

**Hint**: "No previous sales to this customer for this item"

### Example 2: Same Price

```
Current Price: $50.00
Last Sold Price: $50.00
→ Same as last price
```

**Hint**: "Price consistent with previous sales"

### Example 3: Price Increased

```
Current Price: $55.00
Last Sold Price: $50.00
↑ $5.00 higher (+10.0%)
⚠️ Price increased. Confirm with customer if this is intentional.
```

**Hint**: "Price increased from last sale - verify with customer"

### Example 4: Price Decreased (Good Deal)

```
Current Price: $45.00
Last Sold Price: $50.00
↓ $5.00 lower (-10.0%)
ℹ️ Price decreased from last sale. Good deal for customer!
```

**Hint**: "Price decreased - customer is getting a good deal"

---

## 🎨 Styling Guide

### Add CSS for Price History Button

Add to `client/src/pages/sales/SalesInvoicePage.css`:

```css
/* Price History Button in Table Header */
.price-history-btn {
  background: var(--primary-light);
  border: 1px solid var(--primary-500);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  margin-left: 4px;
  color: var(--primary-500);
  transition: all 200ms ease;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.price-history-btn:hover {
  background: var(--primary-500);
  color: white;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.price-history-btn:active {
  transform: translateY(0);
}
```

---

## 🔍 Testing Checklist

### Manual Testing Steps

1. **Create new invoice with customer**
2. **Add an item that was sold to this customer before**
3. **Click 💰 button in Rate header**
4. **Verify price history hint appears**
5. **Check that last price matches database**
6. **Verify date is displayed correctly**
7. **Test with customer who has no history**
8. **Test with different price scenarios** (same, higher, lower)
9. **Verify close button works**
10. **Test multiple items**

### Expected Results

✅ Hint appears when 💰 button is clicked
✅ Current price is displayed
✅ Last price is fetched from database
✅ Price difference is calculated correctly
✅ Percentage is accurate
✅ Transaction count shows correctly
✅ Average price is correct
✅ Color coding matches price trend
✅ Close button dismisses hint
✅ Loading state shows during API call
✅ No errors in console

---

## 🚀 Advanced Features (Optional)

### 1. Full Price History Table

Instead of just showing last price, show a table of all historical prices:

```jsx
<PriceHistoryTable
  itemId={itemId}
  customerId={customerId}
/>
```

### 2. Price Trend Chart

Visualize price history with a mini chart:

```jsx
<PriceTrendChart
  priceHistory={history}
/>
```

### 3. Smart Recommendations

AI-powered suggestions:
- "Consider offering bulk discount for frequent purchases"
- "Customer typically pays within 14 days - offer net-30 terms"
- "Price negotiation room detected - consider margin impact"

### 4. Quick Price Adjustment

Add buttons to quickly set price to last price or average:

```jsx
<button onClick={setToLastPrice}>
  Use Last Price (${formatCurrency(lastPrice)})
</button>
<button onClick={setToAveragePrice}>
  Use Average Price (${formatCurrency(avgPrice)})
</button>
```

---

## 📊 Business Intelligence

### Price Consistency Score

Track how consistent pricing is across customers:

```javascript
const priceConsistencyScore = (prices) => {
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avg;

  if (coefficientOfVariation < 0.1) {
    return { score: 'Excellent', color: 'green' };
  } else if (coefficientOfVariation < 0.2) {
    return { score: 'Good', color: 'blue' };
  } else {
    return { score: 'Review Needed', color: 'orange' };
  }
};
```

### Customer Pricing Profile

Build pricing intelligence for each customer:

- Average discount received
- Payment terms compliance
- Order frequency
- Price negotiation history
- Preferred price ranges

---

## 🎯 Success Metrics

### Implementation Goals

| Metric | Target | Status |
|---------|--------|--------|
| API Endpoint Created | ✅ Pending |
| Frontend Component | ✅ Complete |
| State Management | ✅ Pending |
| UI Integration | ✅ Pending |
| Styling | ✅ Complete |
| Documentation | ✅ Complete |

### Business Value

- **Improved Pricing Consistency**: Salespeople see historical prices
- **Better Customer Relations**: Show you track their pricing
- **Prevent Mistakes**: Visual alert when price varies significantly
- **Data-Driven Decisions**: Make informed pricing choices
- **Competitive Advantage**: Know when you're offering good deals

---

## 📞 Troubleshooting

### Issue: Hint doesn't appear

**Possible Causes**:
1. Customer not selected
2. Item not selected (item_id is empty)
3. Backend endpoint not implemented
4. API call failing
5. Console errors

**Solutions**:
1. Check that both itemId and customerId are set in showPriceHint
2. Verify backend endpoint exists
3. Check network tab for failed API calls
4. Verify database has historical sales data
5. Check browser console for errors

### Issue: Incorrect last price

**Possible Causes**:
1. SQL query not filtering correctly
2. Ordering issue (not getting most recent)
3. Wrong item_id or customer_id
4. Database query syntax error

**Solutions**:
1. Verify SQL query parameters match item_id and customer_id
2. Check ORDER BY clause
3. Test query directly in database
4. Verify invoice status filter (exclude cancelled invoices)

---

## 💡 Best Practices

### User Experience

1. **Show hint on demand**: User clicks button to view
2. **Close easily**: One-click dismiss
3. **Clear visual feedback**: Color-coded differences
4. **Quick loading**: Show spinner while fetching
5. **Handle errors gracefully**: Show friendly error messages

### Performance

1. **Cache results**: Consider client-side caching
2. **Lazy load**: Only fetch when button is clicked
3. **Optimize SQL**: Use indexes on item_id and customer_id
4. **Debounce**: Prevent multiple rapid clicks
5. **Minimize re-renders**: Use React.memo for component

### Data Privacy

1. **Per-customer isolation**: Each customer sees only their data
2. **No cross-customer leakage**: Don't show other customer prices
3. **Appropriate aggregation**: Don't expose detailed invoice data unnecessarily
4. **Compliance**: Follow data protection regulations

---

## 📚 Related Documentation

- **Invoice Management**: Sales Invoice Page
- **API Documentation**: Backend API Routes
- **Database Schema**: Sales Tables
- **UI Components**: PriceHistoryHint, Table Components

---

**Created by: BMad Master**
**Date**: 2025-12-27
**Feature**: Price History Hint for Customer Invoices
**Status**: Frontend component ready, backend pending implementation
