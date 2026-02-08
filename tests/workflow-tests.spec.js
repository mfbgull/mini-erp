// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Business Workflow Tests', () => {
  test('should complete full invoice creation workflow', async ({ page }) => {
    await page.goto('/sales');
    
    // Click on "Create Invoice" button
    await page.locator('button:has-text("Create Invoice")').click();
    
    // Wait for invoice form to appear
    await expect(page.locator('.invoice-form')).toBeVisible();
    
    // Step 1: Select customer
    await page.locator('[name="customer_id"]').click();
    await page.locator('text=Test Customer').click();
    
    // Step 2: Set invoice date
    await page.locator('[name="invoice_date"]').fill(new Date().toISOString().split('T')[0]);
    
    // Step 3: Add items to invoice
    await page.locator('button:has-text("Add Item")').click();
    
    // Select an item
    await page.locator('[name="item_id"]').first().click();
    await page.locator('text=Test Item').first().click();
    
    // Set quantity and price
    await page.locator('[name="quantity"]').first().fill('2');
    await page.locator('[name="unit_price"]').first().fill('15.00');
    
    // Step 4: Calculate totals
    await page.locator('button:has-text("Calculate")').click();
    
    // Verify calculated totals
    await expect(page.locator('.total-amount')).toContainText('$30.00');
    
    // Step 5: Save draft
    await page.locator('button:has-text("Save as Draft")').click();
    
    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Step 6: Submit invoice
    await page.locator('button:has-text("Submit")').click();
    
    // Confirm submission
    await page.locator('button:has-text("Yes, Submit")').click();
    
    // Verify invoice status changed to submitted
    await expect(page.locator('.status-badge:has-text("Submitted")')).toBeVisible();
    
    // Step 7: Process payment
    await page.locator('button:has-text("Process Payment")').click();
    
    // Fill payment details
    await page.locator('[name="payment_amount"]').fill('30.00');
    await page.locator('[name="payment_method"]').click();
    await page.locator('text=Cash').click();
    
    // Submit payment
    await page.locator('button:has-text("Submit Payment")').click();
    
    // Verify payment success
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Verify invoice status changed to paid
    await expect(page.locator('.status-badge:has-text("Paid")')).toBeVisible();
  });

  test('should complete purchase order to goods receipt workflow', async ({ page }) => {
    await page.goto('/purchase-orders');
    
    // Click on "Create Purchase Order" button
    await page.locator('button:has-text("Create Purchase Order")').click();
    
    // Wait for PO form to appear
    await expect(page.locator('.purchase-order-form')).toBeVisible();
    
    // Step 1: Select supplier
    await page.locator('[name="supplier_id"]').click();
    await page.locator('text=Test Supplier').click();
    
    // Step 2: Set PO date
    await page.locator('[name="po_date"]').fill(new Date().toISOString().split('T')[0]);
    
    // Step 3: Add items to PO
    await page.locator('button:has-text("Add Item")').click();
    
    // Select an item
    await page.locator('[name="item_id"]').first().click();
    await page.locator('text=Test Raw Material').first().click();
    
    // Set quantity and price
    await page.locator('[name="quantity"]').first().fill('10');
    await page.locator('[name="unit_price"]').first().fill('5.00');
    
    // Step 4: Calculate totals
    await page.locator('button:has-text("Calculate")').click();
    
    // Verify calculated totals
    await expect(page.locator('.total-amount')).toContainText('$50.00');
    
    // Step 5: Save and submit PO
    await page.locator('button:has-text("Submit")').click();
    
    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Verify PO status is submitted
    await expect(page.locator('.status-badge:has-text("Submitted")')).toBeVisible();
    
    // Step 6: Receive goods against this PO
    await page.locator('button:has-text("Receive Goods")').click();
    
    // In the goods receipt form, verify items from PO are pre-filled
    await expect(page.locator('.goods-receipt-form')).toBeVisible();
    await expect(page.locator('[name="received_quantity"]').first()).toBeVisible();
    
    // Set received quantity
    await page.locator('[name="received_quantity"]').first().fill('10');
    
    // Select warehouse
    await page.locator('[name="warehouse_id"]').click();
    await page.locator('text=Main Warehouse').click();
    
    // Submit goods receipt
    await page.locator('button:has-text("Submit Receipt")').click();
    
    // Verify success
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Verify PO status changed to completed
    await expect(page.locator('.status-badge:has-text("Completed")')).toBeVisible();
  });

  test('should complete inventory adjustment workflow', async ({ page }) => {
    await page.goto('/inventory/adjustments');
    
    // Click on "Create Adjustment" button
    await page.locator('button:has-text("Create Adjustment")').click();
    
    // Wait for adjustment form to appear
    await expect(page.locator('.inventory-adjustment-form')).toBeVisible();
    
    // Step 1: Select warehouse
    await page.locator('[name="warehouse_id"]').click();
    await page.locator('text=Main Warehouse').click();
    
    // Step 2: Select item
    await page.locator('[name="item_id"]').click();
    await page.locator('text=Test Item').click();
    
    // Step 3: Select adjustment type
    await page.locator('[name="adjustment_type"]').click();
    await page.locator('text=Increase Stock').click();
    
    // Step 4: Enter quantity and reason
    await page.locator('[name="quantity"]').fill('5');
    await page.locator('[name="reason"]').fill('Additional stock received');
    
    // Step 5: Submit adjustment
    await page.locator('button:has-text("Submit")').click();
    
    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Verify adjustment appears in the list
    await expect(page.locator('text=ADJ-')).toBeVisible(); // Adjustment number typically starts with ADJ-
    
    // Verify that the item's stock has increased
    await page.goto('/inventory/items');
    await page.locator('text=Test Item').click(); // Click on the item to view details
    
    // Check that the stock level has been updated
    await expect(page.locator('.current-stock')).toContainText(/increased/);
  });

  test('should complete production workflow from BOM to finished goods', async ({ page }) => {
    await page.goto('/production');
    
    // Click on "Create Production" button
    await page.locator('button:has-text("Create Production")').click();
    
    // Wait for production form to appear
    await expect(page.locator('.production-form')).toBeVisible();
    
    // Step 1: Select BOM
    await page.locator('[name="bom_id"]').click();
    await page.locator('text=Test Product BOM').click();
    
    // Step 2: Set production date
    await page.locator('[name="production_date"]').fill(new Date().toISOString().split('T')[0]);
    
    // Step 3: Set quantity to produce
    await page.locator('[name="quantity_to_produce"]').fill('5');
    
    // Step 4: Verify raw materials are calculated
    await expect(page.locator('.raw-materials-list')).toBeVisible();
    await expect(page.locator('.raw-material-item')).toHaveCountGreaterThan(0);
    
    // Step 5: Select warehouse for finished goods
    await page.locator('[name="finished_goods_warehouse_id"]').click();
    await page.locator('text=Finished Goods Warehouse').click();
    
    // Step 6: Select warehouse for raw materials consumption
    await page.locator('[name="raw_materials_warehouse_id"]').click();
    await page.locator('text=Raw Materials Warehouse').click();
    
    // Step 7: Submit production
    await page.locator('button:has-text("Submit Production")').click();
    
    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Verify production record appears in the list
    await expect(page.locator('text=PROD-')).toBeVisible(); // Production number typically starts with PROD-
    
    // Verify that raw materials were consumed and finished goods were created
    await page.goto('/inventory/stock-movements');
    
    // Look for stock movements related to this production
    await expect(page.locator('text=Production')).toBeVisible();
  });

  test('should complete customer payment workflow', async ({ page }) => {
    await page.goto('/customers');
    
    // Find a customer with outstanding invoices
    await page.locator('text=Test Customer').click();
    
    // Go to customer's invoice list
    await page.locator('button:has-text("View Invoices")').click();
    
    // Find an unpaid invoice
    const unpaidInvoice = page.locator('.status-unpaid').first();
    await expect(unpaidInvoice).toBeVisible();
    
    // Click on the invoice to view details
    await unpaidInvoice.click();
    
    // Process payment for this invoice
    await page.locator('button:has-text("Process Payment")').click();
    
    // Fill payment details
    await page.locator('[name="payment_amount"]').fill('100.00');
    await page.locator('[name="payment_method"]').click();
    await page.locator('text=Bank Transfer').click();
    await page.locator('[name="reference_number"]').fill('REF-001');
    
    // Submit payment
    await page.locator('button:has-text("Submit Payment")').click();
    
    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Verify invoice status changed to paid
    await expect(page.locator('.status-badge:has-text("Paid")')).toBeVisible();
    
    // Verify payment appears in customer's payment history
    await page.locator('button:has-text("Payment History")').click();
    await expect(page.locator('text=REF-001')).toBeVisible();
  });
});