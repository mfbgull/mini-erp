// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Form Submission Tests', () => {
  test('should successfully submit item creation form', async ({ page }) => {
    // First, navigate to the items page
    await page.goto('/inventory/items');
    
    // Click on "Add Item" button
    await page.locator('button:has-text("Add Item")').click();
    
    // Wait for modal or form to appear
    await expect(page.locator('.item-form')).toBeVisible();
    
    // Fill in the form fields
    await page.locator('[name="item_code"]').fill('TEST-001');
    await page.locator('[name="item_name"]').fill('Test Item');
    await page.locator('[name="item_category"]').click(); // Click to open dropdown
    await page.locator('text=Raw Materials').click(); // Select category
    await page.locator('[name="unit_of_measure"]').click(); // Click to open UOM dropdown
    await page.locator('text=Piece').click(); // Select UOM
    await page.locator('[name="standard_cost"]').fill('10.00');
    await page.locator('[name="standard_selling_price"]').fill('15.00');
    await page.locator('[name="reorder_level"]').fill('5');
    
    // Submit the form
    await page.locator('button:has-text("Save")').click();
    
    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Verify the item appears in the list
    await expect(page.locator('text=TEST-001')).toBeVisible();
  });

  test('should successfully submit customer creation form', async ({ page }) => {
    await page.goto('/customers');
    
    // Click on "Add Customer" button
    await page.locator('button:has-text("Add Customer")').click();
    
    // Wait for modal or form to appear
    await expect(page.locator('.customer-form')).toBeVisible();
    
    // Fill in the form fields
    await page.locator('[name="customer_code"]').fill('CUST-001');
    await page.locator('[name="customer_name"]').fill('Test Customer');
    await page.locator('[name="contact_person"]').fill('John Doe');
    await page.locator('[name="email"]').fill('john@example.com');
    await page.locator('[name="phone"]').fill('+1234567890');
    await page.locator('[name="billing_address"]').fill('123 Test Street\nTest City, TC 12345');
    
    // Submit the form
    await page.locator('button:has-text("Save")').click();
    
    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Verify the customer appears in the list
    await expect(page.locator('text=CUST-001')).toBeVisible();
  });

  test('should successfully submit supplier creation form', async ({ page }) => {
    await page.goto('/suppliers');
    
    // Click on "Add Supplier" button
    await page.locator('button:has-text("Add Supplier")').click();
    
    // Wait for modal or form to appear
    await expect(page.locator('.supplier-form')).toBeVisible();
    
    // Fill in the form fields
    await page.locator('[name="supplier_code"]').fill('SUP-001');
    await page.locator('[name="supplier_name"]').fill('Test Supplier');
    await page.locator('[name="contact_person"]').fill('Jane Smith');
    await page.locator('[name="email"]').fill('jane@example.com');
    await page.locator('[name="phone"]').fill('+1987654321');
    await page.locator('[name="address"]').fill('456 Supplier Ave\nSupplier City, SC 54321');
    
    // Submit the form
    await page.locator('button:has-text("Save")').click();
    
    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Verify the supplier appears in the list
    await expect(page.locator('text=SUP-001')).toBeVisible();
  });

  test('should successfully submit invoice creation form', async ({ page }) => {
    await page.goto('/sales');
    
    // Click on "Create Invoice" button
    await page.locator('button:has-text("Create Invoice")').click();
    
    // Wait for invoice form to appear
    await expect(page.locator('.invoice-form')).toBeVisible();
    
    // Fill in the form fields
    await page.locator('[name="customer_id"]').click(); // Click to open customer dropdown
    await page.locator('text=Test Customer').click(); // Select customer
    await page.locator('[name="invoice_date"]').fill(new Date().toISOString().split('T')[0]);
    await page.locator('[name="due_date"]').fill(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    // Add an item to the invoice
    await page.locator('button:has-text("Add Item")').click();
    await page.locator('[name="item_id"]').first().click(); // Click to open item dropdown
    await page.locator('text=Test Item').first().click(); // Select item
    await page.locator('[name="quantity"]').first().fill('2');
    await page.locator('[name="unit_price"]').first().fill('15.00');
    
    // Submit the form
    await page.locator('button:has-text("Save")').click();
    
    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Verify the invoice appears in the list
    await expect(page.locator('text=INV-')).toBeVisible(); // Invoice number typically starts with INV-
  });

  test('should successfully submit purchase order form', async ({ page }) => {
    await page.goto('/purchase-orders');
    
    // Click on "Create Purchase Order" button
    await page.locator('button:has-text("Create Purchase Order")').click();
    
    // Wait for PO form to appear
    await expect(page.locator('.purchase-order-form')).toBeVisible();
    
    // Fill in the form fields
    await page.locator('[name="supplier_id"]').click(); // Click to open supplier dropdown
    await page.locator('text=Test Supplier').click(); // Select supplier
    await page.locator('[name="po_date"]').fill(new Date().toISOString().split('T')[0]);
    await page.locator('[name="expected_delivery_date"]').fill(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    // Add an item to the PO
    await page.locator('button:has-text("Add Item")').click();
    await page.locator('[name="item_id"]').first().click(); // Click to open item dropdown
    await page.locator('text=Test Item').first().click(); // Select item
    await page.locator('[name="quantity"]').first().fill('10');
    await page.locator('[name="unit_price"]').first().fill('10.00');
    
    // Submit the form
    await page.locator('button:has-text("Save")').click();
    
    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Verify the PO appears in the list
    await expect(page.locator('text=PO-')).toBeVisible(); // PO number typically starts with PO-
  });

  test('should show validation errors for required fields', async ({ page }) => {
    await page.goto('/inventory/items');
    
    // Click on "Add Item" button
    await page.locator('button:has-text("Add Item")').click();
    
    // Wait for modal or form to appear
    await expect(page.locator('.item-form')).toBeVisible();
    
    // Try to submit without filling required fields
    await page.locator('button:has-text("Save")').click();
    
    // Check for validation errors
    await expect(page.locator('.error-message')).toBeVisible();
  });
});