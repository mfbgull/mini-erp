# Invoice Smart Routing System

## Overview

The Invoice Smart Routing system provides intelligent navigation between invoice view and edit modes based on user intent, invoice status, and context. This solves the original issue where `/sales/invoice/19` was routing to the edit form instead of the display view.

## Components

### 1. InvoiceRouter (`client/src/components/invoice/InvoiceRouter.tsx`)

The main routing component that determines whether to show view or edit mode based on:

- **URL Parameters**: `?mode=view|edit`, `?action=view|edit|print|download|email`
- **Invoice Status**: Draft invoices default to edit, paid invoices default to view
- **User Context**: Referrer analysis and return paths
- **Business Logic**: Customizable rules based on invoice state

### 2. useInvoiceNavigation Hook (`client/src/hooks/useInvoiceNavigation.ts`)

Provides programmatic navigation methods:

```typescript
const { viewInvoice, editInvoice, printInvoice, downloadInvoice, emailInvoice } = useInvoiceNavigation();

// Basic usage
viewInvoice('19');                    // /sales/invoice/19?mode=view
editInvoice('19');                    // /sales/invoice/19?mode=edit

// With return context
viewInvoice('19', '/customers/123');  // /sales/invoice/19?mode=view&returnTo=/customers/123

// Action-based (auto-triggers actions)
printInvoice('19');                   // /sales/invoice/19?mode=view&action=print
```

### 3. InvoiceActionBar (`client/src/components/invoice/InvoiceActionBar.tsx`)

Unified action bar that adapts based on current mode and handles action auto-triggers.

## URL Patterns

| URL | Behavior |
|-----|----------|
| `/sales/invoice/19` | Smart routing based on invoice status and context |
| `/sales/invoice/19?mode=view` | Force view mode |
| `/sales/invoice/19?mode=edit` | Force edit mode |
| `/sales/invoice/19?action=print` | View mode + auto-print |
| `/sales/invoice/19?action=download` | View mode + auto-download |
| `/sales/invoice/19?action=email` | View mode + auto-email |
| `/sales/invoice/19/view` | Legacy explicit view route (still works) |
| `/sales/invoice/19/edit` | Legacy explicit edit route (still works) |

## Smart Routing Logic

The `InvoiceRouter` uses this decision tree:

1. **Explicit Mode Parameter**: `?mode=edit|view` overrides all other logic
2. **Action Parameter**: `?action=print|download|email` forces view mode
3. **Invoice Status Logic**:
   - `Draft` → Edit mode (allows completion)
   - `Unpaid` → Edit mode if coming from edit context, otherwise view
   - `Paid/Partially Paid/Cancelled` → View mode (read-only)
4. **Default Mode**: Configurable per route (defaults to view)

## Migration Guide

### Before (Original Issue)
```jsx
// This was routing to edit form instead of display
<Route path="/sales/invoice/:invoiceId" element={<SalesInvoicePage />} />
```

### After (Smart Routing)
```jsx
// Now intelligently routes based on context
<Route path="/sales/invoice/:invoiceId" element={<InvoiceRouter />} />
<Route path="/sales/invoice/:invoiceId/view" element={<InvoiceViewPage />} />
<Route path="/sales/invoice/:invoiceId/edit" element={<SalesInvoicePage />} />
```

## Usage Examples

### In Components
```tsx
import { useInvoiceNavigation } from '../../hooks/useInvoiceNavigation';

function InvoiceListItem({ invoice }) {
  const { viewInvoice, editInvoice } = useInvoiceNavigation();
  
  return (
    <div>
      <button onClick={() => viewInvoice(invoice.id)}>
        View Invoice
      </button>
      <button onClick={() => editInvoice(invoice.id, '/sales')}>
        Edit Invoice
      </button>
    </div>
  );
}
```

### Direct Links
```tsx
// Smart routing - will show appropriate mode
<Link to="/sales/invoice/19">Invoice #19</Link>

// Explicit mode
<Link to="/sales/invoice/19?mode=view">View Invoice</Link>
<Link to="/sales/invoice/19?mode=edit">Edit Invoice</Link>

// Action-based
<Link to="/sales/invoice/19?action=print">Print Invoice</Link>
```

## Benefits

1. **Intuitive Navigation**: URLs work as users expect
2. **Context Awareness**: Routing adapts to invoice status and user intent
3. **Action Integration**: Direct links can trigger actions (print, download, email)
4. **Backward Compatibility**: Existing explicit routes still work
5. **Flexible**: Easy to customize routing logic per business needs

## Customization

### Adding Custom Routing Logic
```tsx
// In InvoiceRouter.tsx
const shouldShowEditMode = () => {
  // Add custom business rules
  if (invoice.status === 'Sent' && userHasPermission('edit_sent_invoices')) {
    return true;
  }
  
  // Your custom logic here
  return defaultMode === 'edit';
};
```

### Adding New Actions
```tsx
// In useInvoiceNavigation.ts
const duplicateInvoice = useCallback((invoiceId: string | number) => {
  navigateToInvoice(invoiceId, { mode: 'edit', action: 'duplicate' });
}, [navigateToInvoice]);
```

## Testing

Test the routing with these URLs:

- `http://localhost:3010/sales/invoice/19` - Should now show view mode for paid invoices
- `http://localhost:3010/sales/invoice/19?mode=edit` - Forces edit mode
- `http://localhost:3010/sales/invoice/19?action=print` - Auto-opens print dialog

## Performance

- **Lazy Loading**: Components are only loaded when needed
- **Caching**: Invoice data is cached via React Query
- **Minimal Re-renders**: Smart routing decisions are memoized

This system solves the original routing issue while providing a foundation for more sophisticated invoice navigation patterns.