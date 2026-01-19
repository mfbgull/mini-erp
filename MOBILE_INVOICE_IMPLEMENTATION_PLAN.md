# Mobile Invoice Creation - Implementation Plan

## Overview
Implement a mobile-first invoice creation flow optimized for 360-390px screens with one-hand operation. This feature will complement the existing desktop invoice system.

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: React Context + TanStack Query
- **Backend**: Express.js + SQLite
- **Styling**: CSS Modules + Mobile-first responsive design

### Component Structure
```
client/src/pages/invoice/
├── MobileInvoiceWizard.tsx      # Main wizard container
├── InvoiceStep1Customer.tsx     # Screen 1: Customer & Invoice Details
├── InvoiceStep2Items.tsx        # Screen 2: Items List (Core)
├── InvoiceStep3AddItem.tsx      # Screen 3: Add/Edit Item (Bottom Sheet)
├── InvoiceStep4Payment.tsx      # Screen 4: Payment
├── InvoiceStep5Review.tsx       # Screen 5: Review & Save
├── components/
│   ├── StickyFooter.tsx         # Global footer (Screens 2-5)
│   ├── TopAppBar.tsx            # Consistent app bar
│   ├── CustomerSelector.tsx     # Customer search & selection
│   ├── ItemCard.tsx             # Swipeable item card
│   ├── QuantityControl.tsx      # + / - quantity buttons
│   ├── DatePickerRow.tsx        # Invoice/Due date picker
│   ├── TermsDropdown.tsx        # Payment terms selector
│   ├── TaxDropdown.tsx          # Tax rate selector
│   └── DiscountDropdown.tsx     # Discount type/amount selector
```

## Step-by-Step Implementation

### **Step 1: Backend API Enhancements**

#### 1.1 Create Mobile Invoice Routes
**File**: `server/src/routes/mobileInvoices.ts`
```typescript
import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth';

// Draft management
router.post('/draft', authenticateToken, createDraft);
router.put('/draft/:id', authenticateToken, updateDraft);
router.get('/draft/:id', authenticateToken, getDraft);
router.delete('/draft/:id', authenticateToken, deleteDraft);

// Item search for mobile
router.get('/items/search', authenticateToken, searchItems);

// Customer search
router.get('/customers/search', authenticateToken, searchCustomers);

// Tax rates
router.get('/tax-rates', authenticateToken, getTaxRates);

// Payment terms
router.get('/payment-terms', authenticateToken, getPaymentTerms);

export default router;
```

#### 1.2 Create Mobile Invoice Controller
**File**: `server/src/controllers/mobileInvoiceController.ts`

**Key Functions**:
- `createDraft()` - Create temporary draft invoice
- `updateDraft()` - Update draft with customer/items
- `getDraft()` - Retrieve draft for editing
- `searchItems()` - Autocomplete item search
- `searchCustomers()` - Customer search with recent selection
- `getTaxRates()` - Return configured tax rates
- `getPaymentTerms()` - Return payment terms options

#### 1.3 Database Schema Updates
**File**: `server/src/migrations/add-mobile-invoice-tables.sql`

```sql
-- Draft invoices table (temporary, auto-cleanup)
CREATE TABLE IF NOT EXISTS invoice_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(100) NOT NULL,  -- For identifying user's draft
    customer_id INTEGER,
    invoice_date DATE,
    due_date DATE,
    terms VARCHAR(50),
    notes TEXT,
    items_data TEXT,  -- JSON array of items
    status VARCHAR(20) DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT (datetime('now', '+7 days')),  -- Auto-delete after 7 days
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Tax rates configuration
CREATE TABLE IF NOT EXISTS tax_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1
);

-- Payment terms configuration  
CREATE TABLE IF NOT EXISTS payment_terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    days INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1
);

-- Insert default tax rates
INSERT INTO tax_rates (name, rate, is_default) VALUES
('No Tax', 0, 0),
('GST 5%', 5, 0),
('GST 10%', 10, 1),
('GST 15%', 15, 0);

-- Insert default payment terms
INSERT INTO payment_terms (name, days, is_default) VALUES
('Due on Receipt', 0, 0),
('Net 7', 7, 014', 14),
('Net , 1),
('Net 30', 30, 0),
('Net 60', 60, 0);
```

### **Step 2: Frontend Routing Setup**

#### 2.1 Add Routes
**File**: `client/src/App.tsx`

```typescript
import MobileInvoiceWizard from './pages/invoice/MobileInvoiceWizard';

// Add to routes:
{
  path: '/invoice/create',
  element: <MobileInvoiceWizard />
},
{
  path: '/invoice/create/:draftId',
  element: <MobileInvoiceWizard />
}
```

#### 2.2 Add Navigation Entry
**File**: `client/src/components/layout/Sidebar.tsx`

Add "Create Invoice" button/menu item in mobile menu for quick access.

### **Step 3: State Management**

#### 3.1 Create Invoice Context
**File**: `client/src/context/InvoiceContext.tsx`

```typescript
interface InvoiceDraft {
  id?: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
    balance: number;
  } | null;
  invoiceDate: string;
  dueDate: string;
  terms: string;
  notes: string;
  items: InvoiceItem[];
  payment: {
    recordPayment: boolean;
    paymentDate: string;
    amount: number;
    method: string;
    reference: string;
  };
  discount: {
    type: 'percentage' | 'flat';
    value: number;
  };
}

interface InvoiceItem {
  id: string;
  itemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  amount: number;
}
```

### **Step 4: UI Component Implementation**

#### 4.1 Screen 1: Customer & Invoice Details
**File**: `client/src/pages/invoice/InvoiceStep1Customer.tsx`

**Components**:
- `TopAppBar` - Title "Create Invoice", Back icon
- `CustomerSelector` - Card with search icon, "Select customer" text, shows last selected
- `DatePickerRow` - Two equal buttons: "Invoice Date" | "Due Date"
- `TermsDropdown` - Full-width dropdown
- `NotesInput` - Multiline with mic icon (optional - start with basic textarea)
- `PrimaryButton` - "Continue" (sticky bottom or regular)

**Validation**:
- Customer must be selected before continuing
- Invoice date required
- Due date required (must be >= invoice date)

#### 4.2 Screen 2: Items List (Core)
**File**: `client/src/pages/invoice/InvoiceStep2Items.tsx`

**Components**:
- `ItemCard` - ~120px height card showing:
  - Item Name
  - Quantity: [-] 10 [+]
  - Price: 100 | Tax: 10%
  - Amount: 1000
  - ⋮ (actions menu, swipe left to delete)

**Interactions**:
- Swipe left → Reveal delete button (red background)
- Long press → Elevation + context menu
- Tap item → Open bottom sheet for edit
- FAB: "+ Add Item" (floating action button)
- Secondary button: "Scan" (camera icon for barcode scanning)

**Sticky Footer**:
```
Subtotal          Total
$XXX.XX          $XXX.XX
```

#### 4.3 Screen 3: Add/Edit Item (Bottom Sheet)
**File**: `client/src/pages/invoice/InvoiceStep3AddItem.tsx`

**Presentation**: Bottom Sheet (max 85% height)

**Fields**:
- `ItemSearch` - Autocomplete dropdown with item suggestions
- `QuantityControl` - Large +/- buttons (touch-friendly)
- `UnitPrice` - Numeric input with keypad
- `TaxDropdown` - Select tax rate
- `DiscountDropdown` - Select discount type/amount

**CTA**:
- "Save Item" - Sticky bottom button

**Validation**:
- Item must be selected
- Quantity > 0
- Unit price >= 0
- Tax rate >= 0

#### 4.4 Screen 4: Payment
**File**: `client/src/pages/invoice/InvoiceStep4Payment.tsx`

**Components**:
- `PaymentToggle` - Checkbox "Record Payment" (conditional fields below)
- If enabled:
  - `PaymentDate` - Date picker (default today)
  - `Amount` - Numeric (default = balance)
  - `PaymentMethodSelector` - Cash, Card, Bank Transfer, etc.
  - `ReferenceInput` - Text input
  - `Notes` - Text area with mic icon

**Validation**:
- Payment amount > 0 and <= balance
- Payment method required if recording payment

#### 4.5 Screen 5: Review & Save
**File**: `client/src/pages/invoice/InvoiceStep5Review.tsx`

**Summary Card**:
```
Customer: [Name]
Items: X items
Subtotal: $XXX.XX
Tax: $XXX.XX
Discount: -$XX.XX
Total: $XXX.XX
Paid: $XX.XX
Balance: $XX.XX
```

**Actions**:
- Primary: "Save Invoice"
- Secondary: "Save & New" (clears form for next invoice)

### **Step 5: Reusable Components**

#### 5.1 StickyFooter
**File**: `client/src/pages/invoice/components/StickyFooter.tsx`

```typescript
interface Props {
  subtotal: number;
  total: number;
  paid: number;
  balance: number;
  onContinue?: () => void;
  continueLabel?: string;
}

export default function StickyFooter({ subtotal, total, paid, balance, onContinue, continueLabel = 'Continue' }: Props) {
  return (
    <div className="sticky-footer">
      <div className="footer-left">
        <span className="footer-label">Subtotal</span>
        <span className="footer-value">{formatCurrency(subtotal)}</span>
      </div>
      <div className="footer-right">
        <span className="footer-label">Total</span>
        <span className="footer-value">{formatCurrency(total)}</span>
      </div>
      <div className="footer-divider"></div>
      <div className="footer-left">
        <span className="footer-label">Paid</span>
        <span className="footer-value">{formatCurrency(paid)}</span>
      </div>
      <div className="footer-right">
        <span className="footer-label">Balance</span>
        <span className="footer-value balance">{formatCurrency(balance)}</span>
      </div>
      {onContinue && (
        <button className="continue-btn" onClick={onContinue}>
          {continueLabel}
        </button>
      )}
    </div>
  );
}
```

#### 5.2 ItemCard
**File**: `client/src/pages/invoice/components/ItemCard.tsx`

```typescript
interface Props {
  item: InvoiceItem;
  onEdit: () => void;
  onDelete: () => void;
  onQuantityChange: (delta: number) => void;
}

export default function ItemCard({ item, onEdit, onDelete, onQuantityChange }: Props) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className={`item-card ${showActions ? 'swiped' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="item-content" onClick={onEdit}>
        <div className="item-name">{item.name}</div>
        <div className="item-details">
          <span className="quantity-control">
            <button className="qty-btn" onClick={(e) => { e.stopPropagation(); onQuantityChange(-1); }}>-</button>
            <span className="qty-value">{item.quantity}</span>
            <button className="qty-btn" onClick={(e) => { e.stopPropagation(); onQuantityChange(1); }}>+</button>
          </span>
          <span className="price-info">
            @ {formatCurrency(item.unitPrice)} | Tax: {item.taxRate}%
          </span>
        </div>
        <div className="item-amount">{formatCurrency(item.amount)}</div>
      </div>
      <div className="delete-action" onClick={onDelete}>
        <Trash2 className="delete-icon" />
        Delete
      </div>
    </div>
  );
}
```

### **Step 6: Integration & API Calls**

#### 6.1 API Service Layer
**File**: `client/src/utils/invoiceApi.ts`

```typescript
import api from './api';

export const invoiceApi = {
  // Draft management
  createDraft: (data: Partial<InvoiceDraft>) => 
    api.post('/mobile-invoices/draft', data),
    
  updateDraft: (id: string, data: Partial<InvoiceDraft>) => 
    api.put(`/mobile-invoices/draft/${id}`, data),
    
  getDraft: (id: string) => 
    api.get(`/mobile-invoices/draft/${id}`),
    
  deleteDraft: (id: string) => 
    api.delete(`/mobile-invoices/draft/${id}`),
    
  // Search endpoints
  searchItems: (query: string) => 
    api.get(`/mobile-invoices/items/search?q=${encodeURIComponent(query)}`),
    
  searchCustomers: (query: string) => 
    api.get(`/mobile-invoices/customers/search?q=${encodeURIComponent(query)}`),
    
  getTaxRates: () => 
    api.get('/mobile-invoices/tax-rates'),
    
  getPaymentTerms: () => 
    api.get('/mobile-invoices/payment-terms'),
    
  // Final submission
  submitInvoice: (data: InvoiceDraft) => 
    api.post('/invoices', data),
};
```

### **Step 7: Styling System**

#### 7.1 Design Tokens
**File**: `client/src/assets/styles/mobile-invoice-tokens.css`

```css
:root {
  /* Spacing */
  --screen-padding: 16px;
  --card-padding: 12px;
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  /* Border Radius */
  --radius-card: 12px;
  --radius-button: 16px;
  
  /* Typography */
  --font-size-title: 18px;
  --font-size-label: 12px;
  --font-size-primary: 14px;
  --font-size-amount: 16px;
  
  /* Colors */
  --brand: #2563eb;
  --card: #ffffff;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --error: #ef4444;
  --success: #10b981;
  
  /* Touch Targets */
  --min-touch: 44px;
}
```

#### 7.2 Component Styles
**File**: `client/src/pages/invoice/MobileInvoice.css`

```css
/* Sticky Footer */
.sticky-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--card);
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  padding: 0 var(--screen-padding);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

/* Item Card */
.item-card {
  display: flex;
  background: var(--card);
  border-radius: var(--radius-card);
  padding: var(--card-padding);
  margin-bottom: var(--spacing-sm);
  touch-action: pan-x;
  transition: transform 0.2s ease;
}

.item-card.swiped {
  transform: translateX(-80px);
}

.delete-action {
  position: absolute;
  right: -80px;
  width: 80px;
  height: 100%;
  background: var(--error);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: var(--radius-card);
}

/* Bottom Sheet */
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  background: var(--card);
  border-radius: 20px 20px 0 0;
  padding: var(--spacing-md);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Quantity Control */
.quantity-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.qty-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: white;
  font-size: 18px;
  font-weight: 600;
  color: var(--brand);
}

.qty-value {
  min-width: 40px;
  text-align: center;
  font-weight: 600;
}

/* Primary Button */
.primary-btn {
  width: 100%;
  height: 48px;
  border-radius: var(--radius-button);
  background: var(--brand);
  color: white;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
}

/* Date Row */
.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.date-btn {
  padding: var(--spacing-md);
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-card);
  background: white;
  text-align: center;
}

.date-btn.selected {
  background: var(--brand);
  color: white;
  border-color: var(--brand);
}
```

### **Step 8: Testing & Validation**

#### 8.1 Test Scenarios

**Happy Path**:
1. Navigate to /invoice/create
2. Search and select customer
3. Choose invoice date and due date
4. Select payment terms
5. Add notes
6. Click Continue
7. Screen 2: Add items via bottom sheet
8. Review item list, delete one
9. Click Continue
10. Screen 3: Toggle "Record Payment"
11. Fill payment details
12. Click Continue
13. Screen 4: Review summary
14. Click "Save Invoice"
15. Success toast, redirect to invoice view

**Edge Cases**:
- No customer selected → Prevent continue, show error
- No items added → Prevent continue, show error
- Invalid dates → Show validation error
- Payment amount > balance → Show warning
- Network error during save → Show error, allow retry
- App refresh → Restore draft state

**Mobile Interactions**:
- Swipe to delete item
- Long press context menu
- Bottom sheet drag to close
- Keyboard handling for numeric inputs
- Safe area inset handling (iPhone notch)

### **Step 9: Error Handling**

#### 9.1 Frontend Error Handling
```typescript
// Use React Query error handling
const mutation = useMutation({
  mutationFn: invoiceApi.submitInvoice,
  onError: (error: ApiError) => {
    if (error.response?.status === 400) {
      toast.error(error.response.data.message);
    } else if (error.response?.status === 422) {
      // Validation errors
      showFieldErrors(error.response.data.errors);
    } else {
      toast.error('Failed to save invoice. Please try again.');
    }
  }
});
```

#### 9.2 Backend Error Handling
```typescript
// In controller
try {
  // Validation
  if (!customer_id) {
    return res.status(400).json({ 
      error: 'Customer is required',
      field: 'customer_id' 
    });
  }
  
  if (!items || items.length === 0) {
    return res.status(400).json({ 
      error: 'At least one item is required',
      field: 'items' 
    });
  }
  
  // ... rest of logic
  
} catch (error) {
  console.error('Mobile invoice error:', error);
  res.status(500).json({ error: 'Failed to process invoice' });
}
```

## Implementation Order

1. **Backend Foundation**
   - [ ] Add mobile invoice routes
   - [ ] Create mobile invoice controller
   - [ ] Add migration for draft table, tax rates, payment terms
   - [ ] Test API endpoints with Postman

2. **Frontend Foundation**
   - [ ] Add routing
   - [ ] Create Invoice Context
   - [ ] Add API service layer
   - [ ] Create basic page structure

3. **Screen 1 Implementation**
   - [ ] TopAppBar component
   - [ ] CustomerSelector component
   - [ ] DatePickerRow component
   - [ ] TermsDropdown component
   - [ ] NotesInput component
   - [ ] PrimaryButton component
   - [ ] Navigation logic to Screen 2

4. **Screen 2 Implementation**
   - [ ] ItemCard component with swipe
   - [ ] Add Item FAB
   - [ ] Scan button (optional)
   - [ ] StickyFooter component
   - [ ] Navigation to/from Screen 3

5. **Screen 3 Implementation**
   - [ ] BottomSheet component
   - [ ] ItemSearch component
   - [ ] QuantityControl component
   - [ ] TaxDropdown component
   - [ ] DiscountDropdown component
   - [ ] Save logic

6. **Screen 4 Implementation**
   - [ ] PaymentToggle component
   - [ ] Payment method selector
   - [ ] Reference input
   - [ ] Notes input with mic

7. **Screen 5 Implementation**
   - [ ] Summary card
   - [ ] Save button
   - [ ] Save & New button
   - [ ] Final submission logic

8. **Polish & Testing**
   - [ ] Error handling
   - [ ] Loading states
   - [ ] Draft auto-save
   - [ ] Responsive testing
   - [ ] Accessibility testing

## Dependencies & Requirements

### New Dependencies
- None (using existing stack)

### Existing Dependencies Used
- React 18
- TypeScript
- TanStack Query
- React Router
- React Hot Toast
- Lucide React
- Axios

## Estimated Effort

- **Backend**: 4-6 hours
- **Frontend Components**: 12-16 hours
- **Integration & Testing**: 4-6 hours
- **Total**: 20-28 hours

## Files to Create/Modify

### New Files
- `server/src/routes/mobileInvoices.ts`
- `server/src/controllers/mobileInvoiceController.ts`
- `server/src/migrations/add-mobile-invoice-tables.sql`
- `client/src/pages/invoice/MobileInvoiceWizard.tsx`
- `client/src/pages/invoice/InvoiceStep1Customer.tsx`
- `client/src/pages/invoice/InvoiceStep2Items.tsx`
- `client/src/pages/invoice/InvoiceStep3AddItem.tsx`
- `client/src/pages/invoice/InvoiceStep4Payment.tsx`
- `client/src/pages/invoice/InvoiceStep5Review.tsx`
- `client/src/pages/invoice/components/StickyFooter.tsx`
- `client/src/pages/invoice/components/TopAppBar.tsx`
- `client/src/pages/invoice/components/CustomerSelector.tsx`
- `client/src/pages/invoice/components/ItemCard.tsx`
- `client/src/pages/invoice/components/QuantityControl.tsx`
- `client/src/pages/invoice/components/DatePickerRow.tsx`
- `client/src/pages/invoice/components/TermsDropdown.tsx`
- `client/src/pages/invoice/components/BottomSheet.tsx`
- `client/src/pages/invoice/MobileInvoice.css`
- `client/src/context/InvoiceContext.tsx`
- `client/src/utils/invoiceApi.ts`

### Modified Files
- `client/src/App.tsx` (add routes)
- `client/src/components/layout/Sidebar.tsx` (add navigation)
- `server/src/app.ts` (add route mount)
- `client/src/utils/api.ts` (add base URL if needed)
