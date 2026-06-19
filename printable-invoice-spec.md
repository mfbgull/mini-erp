# Printable Invoice Redesign — Specification

**Date:** June 17, 2026
**Author:** Codebuff (interview with user)
**Status:** Draft — ready for review

---

## 1. Overview

Redesign the printable invoice system to support **two professional print formats**: A4 paper and 80mm thermal roll printer. The current invoice template has a header that occupies ~50% of the page, leaving insufficient room for invoice items and causing unwanted page overflow.

The two formats are accessible via **two dedicated buttons** on the invoice view page toolbar, each with a **keyboard shortcut** for quick printing. No global setting needed.

---

## 2. Requirements

### 2.1 Formats

| Format | Paper Size | Orientation | Use Case |
|--------|-----------|-------------|----------|
| **A4** | 210mm × 297mm | Portrait | Standard office/desktop printing |
| **Thermal** | 80mm width × continuous | Tall/scroll | Thermal roll printers in retail shops |

### 2.2 Key Design Decisions

- **Two dedicated buttons** on the invoice view page toolbar:
  - **"Print A4"** — opens A4 layout in a print window
  - **"Print Receipt"** — opens thermal layout in a print window
- **No global setting** in Settings page — the user just clicks the button they want
- **Keyboard shortcuts** for rapid access:
  - `Ctrl+P` → Print A4
  - `Ctrl+Shift+P` → Print Receipt (thermal)
- **PDF export** always produces A4 format (unaffected by which button was used)
- **Multi-page A4:** Items can overflow to subsequent pages naturally (CSS page-break). Totals/summary appear only on the final page.
- **Thermal content:** Minimal — business name, customer info, items (qty/rate/amount), totals, payment info, QR code. No fancy headers, no logo, no status badges.
- **Footer:** Keep simple — "Thank you for your business!" plus payment terms and contact info. No expansion of T&C or configurable footer.

### 2.3 Items Table — Column Behavior

| Column | A4 | Thermal |
|--------|----|---------|
| Item Name/Code | Always | Always |
| Quantity | Always | Always |
| Rate | Always | Always |
| Discount | Only if any item has non-zero discount | ❌ |
| Tax | Only if any item has non-zero tax | ❌ |
| Amount (line total) | Always | Always |

---

## 3. Components

### 3.1 New Components

#### `client/src/components/invoice/InvoiceTemplateA4.tsx`
- Refined A4 layout with compact side-by-side header
- Company info (name, address, phone, email, tax ID) on the left
- INVOICE title, invoice number, status, date, due date on the right
- Bill To section
- Items table (Qty, Rate, Discount*, Tax*, Amount) — *conditional columns
- Totals section (Subtotal, Discount, Tax, Total, Paid, Balance Due)
- Payment History table
- Simple footer
- CSS: `InvoiceTemplateA4.css`

#### `client/src/components/invoice/ThermalInvoiceTemplate.tsx`
- 80mm width, no max-height (continuous content)
- Minimal header: Business name only
- Customer: Name only
- Items table: Item, Qty, Rate, Amount only
- Totals: Subtotal, Total, Paid, Balance Due
- QR code containing invoice number + total amount
- Footer: "Thank you for your business!" + contact
- CSS: `ThermalInvoiceTemplate.css`

#### `client/src/components/invoice/InvoiceTemplateA4.css`
- A4 page styles, print-specific CSS
- Clean professional typography
- `page-break-before/after/inside` rules for multi-page

#### `client/src/components/invoice/ThermalInvoiceTemplate.css`
- `@page { width: 80mm; margin: 0; }`
- Monospace-friendly, compact font sizes (10-11px)
- Print-specific styles for thermal printers
- No page-break rules (continuous scroll)

### 3.2 Modified Components

#### `client/src/pages/sales/InvoiceViewPage.jsx`
- **Replace** the single "Print" button with **two buttons**:
  - "Print A4" (Printer icon) — `Ctrl+P`
  - "Print Receipt" (Receipt/Printer icon) — `Ctrl+Shift+P`
- Replace the rendered `InvoiceTemplate` with `InvoiceTemplateA4` for screen preview
- Add `useKeyboardShortcut` hooks for both shortcuts (context: `invoice-view`)
- Add `handlePrintA4()` and `handlePrintThermal()` functions that open print windows
- Remove the old `handlePrint` that just called `window.print()` directly

#### `client/src/pages/sales/InvoiceViewPage.css`
- Style for the two print buttons (can differentiate them visually)
- Print window styles

### 3.3 No Settings Page Changes

No changes to Settings page or backend settings. The two buttons + keyboard shortcuts replace the need for a global default.

---

## 4. Print Flow

### 4.1 Scenario: User clicks "Print A4" or presses `Ctrl+P`

1. Open a new browser window
2. Render `InvoiceTemplateA4` component with full invoice data
3. Inject the `InvoiceTemplateA4.css` stylesheet
4. Call `window.print()` on that window
5. User selects A4 paper in the browser print dialog

### 4.2 Scenario: User clicks "Print Receipt" or presses `Ctrl+Shift+P`

1. Open a new browser window
2. Render `ThermalInvoiceTemplate` component with invoice data
3. Inject the `ThermalInvoiceTemplate.css` stylesheet
4. Call `window.print()` on that window
5. User selects their 80mm thermal printer in the print dialog

### 4.3 Scenario: User clicks "PDF" (export)

1. Unchanged from current implementation
2. Uses `html2canvas` + `jsPDF` on the `InvoiceTemplateA4` component (rendered in-page)
3. Output: A4-format PDF

### 4.4 Keyboard Shortcut Handling

```javascript
// In InvoiceViewPage.jsx
useKeyboardShortcut('Ctrl+P', handlePrintA4, {
  context: 'invoice-view',
  label: 'Print A4 Invoice',
  id: 'invoice-print-a4'
});

useKeyboardShortcut('Ctrl+Shift+P', handlePrintThermal, {
  context: 'invoice-view',
  label: 'Print Receipt (Thermal)',
  id: 'invoice-print-thermal'
});
```

- Shortcuts are registered to the `invoice-view` context so they only fire when on the invoice view page
- They appear in the ShortcutBar at the bottom of the screen
- They appear in the `Ctrl+/` keyboard shortcuts help dialog
- The `shouldIgnoreShortcut` guard prevents firing when typing in input fields

---

## 5. Detailed A4 Layout (InvoiceTemplateA4)

```
┌─────────────────────────────────────────────┐
│                                             │
│  [Logo]  Company Name         INVOICE        │
│          Address              INV-001        │
│          Phone                [Paid]         │
│          Email                               │
│          Tax ID: XXX                         │
│                                             │
│ ┌──────────────┐ ┌────────────────────────┐ │
│ │ Bill To      │ │ Invoice Date: 12 Jun  │ │
│ │ Customer     │ │ Due Date: 12 Jul 2026 │ │
│ │ Address      │ │ Terms: Net 14 Days    │ │
│ │ Phone        │ │                       │ │
│ │ Email        │ │                       │ │
│ └──────────────┘ └────────────────────────┘ │
│                                             │
│ ┌──────┬─────┬──────┬──────────┬─────┬────┐ │
│ │ Item │ Qty │ Rate │ Discount │ Tax │ Amt│ │
│ ├──────┼─────┼──────┼──────────┼─────┼────┤ │
│ │ ...  │     │      │          │     │    │ │
│ │ ...  │     │      │          │     │    │ │
│ │ ...  │     │      │          │     │    │ │
│ └──────┴─────┴──────┴──────────┴─────┴────┘ │
│                                             │
│          Subtotal          $1,000.00         │
│          Discount          -$50.00          │
│          Tax               $95.00           │
│          ─────────────────────────────        │
│          Total             $1,045.00         │
│          Paid              $500.00           │
│          Balance Due       $545.00           │
│                                             │
│  Payment History                             │
│  ┌──────────┬────────┬───────┬──────────┐   │
│  │ Date     │ Method │ Ref   │ Amount   │   │
│  ├──────────┼────────┼───────┼──────────┤   │
│  │ 10 Jun   │ Cash   │ -     │ $500.00  │   │
│  └──────────┴────────┴───────┴──────────┘   │
│                                             │
│  Thank you for your business!                │
│  Payment within 14 days.                     │
│  Contact: support@company.com                │
│                                             │
└─────────────────────────────────────────────┘
```

### 5.1 A4 Header — Compact Side-by-Side

**Left side** (company info):
- Logo placeholder (first letter of company name, colored circle/square)
- Company name (bold, 1.2rem)
- Address (smaller, muted)
- Phone
- Email
- Tax ID (if set)

**Right side** (invoice metadata):
- "INVOICE" title (bold, 1.8rem, colored)
- Invoice number (monospace)
- Status badge (compact, colored pill)
- No dates here — they go in the Bill To / Details section below

Total header height: ~80-100px (~10-15% of page), down from ~50%.

### 5.2 A4 Bill To + Details — Two Column Grid

**Left:** Bill To section
- "Bill To" label (small uppercase)
- Customer name (bold)
- Customer address
- Customer phone
- Customer email

**Right:** Invoice Details
- Invoice Date: {value}
- Due Date: {value}
- Payment Terms: Net {X} Days

---

## 6. Thermal Layout (ThermalInvoiceTemplate)

```
┌──────────────────────────────┐
│     BUSINESS NAME            │
│   (bold, centered)           │
│                              │
│  Invoice: INV-001            │
│  Date: 12 Jun 2026           │
│                              │
│  ──────────────────────────  │
│  Customer: John Doe          │
│                              │
│  ──────────────────────────  │
│  ITEM          QTY   AMOUNT  │
│  ──────────────────────────  │
│  Widget A       2    $100    │
│  Widget B       1    $50     │
│  Gadget X       5    $250    │
│  ──────────────────────────  │
│  Subtotal             $400   │
│  Total                $400   │
│  Paid                 $200   │
│  Balance Due          $200   │
│                              │
│  ┌──────────────────────┐   │
│  │  ██ QR CODE ████     │   │
│  │  INV-001 | $400.00   │   │
│  └──────────────────────┘   │
│                              │
│  Thank you!                  │
│  Contact: support@...        │
│  Ph: +1 123 456 7890        │
│                              │
└──────────────────────────────┘
```

### 6.1 Thermal Specifications

- **Width:** 80mm (72mm printable area after margins)
- **Font:** Monospace or compact sans-serif (10-11px)
- **Max-width:** 80mm in CSS
- **No max-height** — content flows freely for long receipts
- **Single column** — no side-by-side layouts
- **Lines:** Use `─` characters (Unicode) for dividers
- **QR Code:** Generated using a lightweight library (e.g., `qrcode` npm package) as an inline SVG

---

## 7. Print Window Logic

### 7.1 Print A4 Handler

```javascript
const handlePrintA4 = () => {
  const printWindow = window.open('', '_blank');
  const styles = document.querySelector('link[href*="InvoiceTemplateA4"]')?.outerHTML || '';
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${invoice?.invoice_no}</title>
        ${styles}
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { margin: 0; padding: 0; font-family: ...; }
        </style>
      </head>
      <body>
        <div id="invoice-print">
          ${/* Serialized A4 template HTML */}
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
```

### 7.2 Print Receipt (Thermal) Handler

```javascript
const handlePrintThermal = () => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt ${invoice?.invoice_no}</title>
        <link rel="stylesheet" href="/src/components/invoice/ThermalInvoiceTemplate.css" />
        <style>
          @page { width: 80mm; margin: 0; }
          body { width: 80mm; margin: 0 auto; padding: 5mm 0; font-family: ...; }
        </style>
      </head>
      <body>
        <div id="receipt-print">
          ${/* Serialized thermal template HTML */}
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
```

### 7.3 Data Serialization Challenge

Since React components can't be directly serialized to HTML strings for a new window, two approaches:

**Option A — ReactDOM.render (recommended):**
- Open the new window
- Create a root element
- Use `ReactDOM.createRoot(printWindow.document.body).render(<ThermalInvoiceTemplate ... />)`
- Wait for render, then call `window.print()`

**Option B — Static HTML template string:**
- Build the print HTML as a template string directly in the handler
- Simpler but duplicates rendering logic
- Only viable if the template is simple enough

**Decision:** Use **Option A** (React portal approach) — render the React component into the popup window, giving us full React rendering without duplicating logic.

---

## 8. File Changes Summary

### New Files

| # | File Path | Description |
|---|-----------|-------------|
| 1 | `client/src/components/invoice/InvoiceTemplateA4.tsx` | New A4-optimized invoice component |
| 2 | `client/src/components/invoice/InvoiceTemplateA4.css` | A4 print styles |
| 3 | `client/src/components/invoice/ThermalInvoiceTemplate.tsx` | 80mm thermal receipt component |
| 4 | `client/src/components/invoice/ThermalInvoiceTemplate.css` | Thermal print styles |

### Modified Files

| # | File Path | Change Description |
|---|-----------|-------------------|
| 1 | `client/src/pages/sales/InvoiceViewPage.jsx` | Replace single Print with two buttons (Print A4 + Print Receipt); add keyboard shortcuts; replace InvoiceTemplate with InvoiceTemplateA4 for preview; add print window logic |
| 2 | `client/src/pages/sales/InvoiceViewPage.css` | Style for two print buttons; print window layout |
| 3 | `client/src/locales/en.json` | Add labels: "Print A4", "Print Receipt", shortcut descriptions |
| 4 | `client/src/locales/ur.json` | Add Urdu translations for the same |

### Unchanged Files

The following files remain **unchanged** from the current implementation:
- `client/src/pages/SettingsPage.jsx` — No invoicing section needed
- `server/src/models/Settings.ts` — No new setting needed
- `client/src/components/invoice/InvoiceTemplate.tsx` — Kept as-is (may still be used elsewhere)

### Deprecated (Kept but Not the Primary Component)

| # | File Path | Reason |
|---|-----------|--------|
| 1 | `client/src/components/invoice/InvoiceTemplate.tsx` | Still used for screen preview initially, then replaced by InvoiceTemplateA4 |

---

## 9. QR Code Implementation

- **Library:** Use `qrcode` npm package (lightweight, no dependencies, supports QR → SVG/Canvas)
- **Data format:** `INV:{invoice_no}|TOTAL:{total_amount}|`
- **Size:** ~60×60px on thermal receipt
- **Placement:** Centered above the footer, below the totals
- **Only on thermal format** — QR code is not suitable for A4 printing
- **Rendering:** SVG-inline rendered via the `qrcode` package's `toString` method with `type: 'svg'`

---

## 10. Edge Cases & Considerations

| Edge Case | Handling |
|-----------|----------|
| Invoice has 0 items | Show "No items" message, still print full layout |
| Invoice is cancelled | Show status "Cancelled" — print still works but prominently displays cancelled status |
| Browser blocks popup | Show toast: "Please allow popups to print. Use the shortcut instead." |
| Company has no logo | Use text-based placeholder (first letter of company name, colored circle) |
| Thermal printer not connected | The browser print dialog lets user select any printer — no special handling needed |
| Currency settings change | Invoice always uses current global settings values |
| Very long item names | Truncate with ellipsis on thermal; word-wrap on A4 |
| Negative amounts | Show with hyphen sign (e.g., -$50.00) |
| Multiple pages of items on A4 | Totals only on last page. Use `page-break-inside: avoid` on item rows where possible |
| `Ctrl+P` conflicts with browser default | Override with `event.preventDefault()` in the keyboard shortcut handler |
| No dark-mode on prints | Both templates always render in light/white background regardless of app theme |

---

## 11. Success Criteria

1. **Header uses ≤15% of A4 page height** (down from ~50%)
2. **A4 layout fits standard 8+ line items on a single page** without overflow
3. **Thermal layout renders at exactly 80mm width** when printed or previewed
4. **"Print A4" button** opens A4 layout in print dialog
5. **"Print Receipt" button** opens thermal layout in print dialog
6. **`Ctrl+P`** triggers Print A4 on the invoice view page
7. **`Ctrl+Shift+P`** triggers Print Receipt on the invoice view page
8. **Shortcuts appear** in the ShortcutBar and `Ctrl+/` help dialog
9. **PDF export** still works and produces A4 output
10. **No visual regressions** on the invoice view screen preview
11. **i18n** — all new labels have English and Urdu translations
12. **QR code** renders correctly on thermal receipt
