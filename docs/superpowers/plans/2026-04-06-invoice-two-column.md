# Invoice Page Two-Column Layout Fix

**Goal:** Make invoice page display items table on left and payment section on right

**Approach:** Use CSS to position payment section on right side without changing JSX structure

---

### Task 1: Add CSS to create two-column layout

**Files:**
- Modify: `client/src/pages/sales/SalesInvoicePage.css`

**Steps:**

- [ ] **Step 1: Add CSS rules for positioning payment section to right**

Add these CSS rules after the existing split layout (around line 1427):

```css
/* Two-column layout using CSS - keep JSX structure intact */

/* Make invoice-document-modern a relative container */
.invoice-document-modern {
  position: relative;
}

/* Position payment section to the right */
.payment-section-modern {
  position: absolute;
  right: 0;
  top: 0;
  width: 340px;
  height: 100%;
  border-left: 1px solid #e5e7eb;
  padding: 0.75rem;
  box-sizing: border-box;
  overflow-y: auto;
  background: white;
}

/* Make main split take full height */
.invoice-body-modern {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Items table container should be flexible */
.items-table-container-modern {
  flex: 1;
  overflow-y: auto;
}
```

- [ ] **Step 2: Build and test**

Run: `cd client && npm run build`
Expected: Build passes

- [ ] **Step 3: Verify layout in browser**

Use Playwright or manual check to verify:
- Items table visible on left
- Payment section visible on right (340px width)
- Both sections scrollable independently