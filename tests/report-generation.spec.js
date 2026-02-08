// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Report Generation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming user is already logged in for these tests
    await page.goto('/reports');
  });

  test('should successfully generate stock valuation report', async ({ page }) => {
    // Navigate to stock valuation report
    await page.locator('a[href="/reports/stock-valuation"]').click();
    
    // Wait for the report page to load
    await expect(page.locator('.stock-valuation-report')).toBeVisible();
    
    // Check that summary cards are visible
    await expect(page.locator('.summary-card')).toHaveCount(4);
    
    // Check that the table or grid is visible
    await expect(page.locator('.ag-theme-quartz, .data-table')).toBeVisible();
    
    // Verify that some data is loaded
    const rows = page.locator('.ag-row, .data-table tbody tr');
    await expect(rows).toHaveCountGreaterThan(0);
    
    // Test filtering functionality
    await page.locator('[name="warehouse_id"]').click();
    await page.locator('text=Main Warehouse').click(); // Select a warehouse
    
    // Apply filters
    await page.locator('button:has-text("Apply Filters")').click();
    
    // Wait for data to reload
    await expect(page.locator('.loading')).not.toBeVisible();
    
    // Verify data is still present after filtering
    await expect(rows).toHaveCountGreaterThan(0);
    
    // Test export functionality
    await page.locator('button:has-text("Export PDF")').click();
    
    // Wait for download or processing
    await expect(page.locator('.toast-success, .export-success')).toBeVisible();
  });

  test('should successfully generate sales summary report', async ({ page }) => {
    await page.goto('/reports/sales-summary');
    
    // Verify page loaded
    await expect(page.locator('h1:has-text("Sales Summary")')).toBeVisible();
    
    // Check that summary cards are visible
    await expect(page.locator('.summary-card')).toHaveCount(4);
    
    // Check that the sales data table is visible
    await expect(page.locator('.ag-theme-quartz, .data-table')).toBeVisible();
    
    // Verify that some sales data is present
    const rows = page.locator('.ag-row, .data-table tbody tr');
    await expect(rows).toHaveCountGreaterThan(0);
    
    // Test date range filter
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.first().fill('2023-01-01');
    await dateInputs.last().fill('2023-12-31');
    
    // Apply filters
    await page.locator('button:has-text("Apply Filters")').click();
    
    // Wait for data to reload
    await expect(page.locator('.loading')).not.toBeVisible();
    
    // Test export to Excel
    await page.locator('button:has-text("Export Excel")').click();
    
    // Wait for export success
    await expect(page.locator('.toast-success')).toBeVisible();
  });

  test('should successfully generate purchase summary report', async ({ page }) => {
    await page.goto('/reports/purchases-summary');
    
    // Verify page loaded
    await expect(page.locator('h1:has-text("Purchase Summary")')).toBeVisible();
    
    // Check that summary cards are visible
    await expect(page.locator('.summary-card')).toHaveCount(4);
    
    // Check that the purchase data table is visible
    await expect(page.locator('.ag-theme-quartz, .data-table')).toBeVisible();
    
    // Verify that some purchase data is present
    const rows = page.locator('.ag-row, .data-table tbody tr');
    await expect(rows).toHaveCountGreaterThan(0);
    
    // Test category filter
    await page.locator('[name="category"]').click();
    await page.locator('text=Raw Materials').click();
    
    // Apply filters
    await page.locator('button:has-text("Apply Filters")').click();
    
    // Wait for data to reload
    await expect(page.locator('.loading')).not.toBeVisible();
    
    // Verify filtered results
    await expect(rows).toHaveCountGreaterThan(0);
  });

  test('should successfully generate expense report', async ({ page }) => {
    await page.goto('/reports/expenses');
    
    // Verify page loaded
    await expect(page.locator('h1:has-text("Expenses Report")')).toBeVisible();
    
    // Check that summary cards are visible
    await expect(page.locator('.summary-card')).toHaveCount(4);
    
    // Check that the expense data table is visible
    await expect(page.locator('.ag-theme-quartz, .data-table')).toBeVisible();
    
    // Verify that some expense data is present
    const rows = page.locator('.ag-row, .data-table tbody tr');
    await expect(rows).toHaveCountGreaterThan(0);
    
    // Test date range filter
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.first().fill('2023-01-01');
    await dateInputs.last().fill('2023-12-31');
    
    // Apply filters
    await page.locator('button:has-text("Apply Filters")').click();
    
    // Wait for data to reload
    await expect(page.locator('.loading')).not.toBeVisible();
    
    // Test export functionality
    await page.locator('button:has-text("Export PDF")').click();
    
    // Wait for export success
    await expect(page.locator('.toast-success')).toBeVisible();
  });

  test('should successfully generate low stock report', async ({ page }) => {
    await page.goto('/reports/low-stock');
    
    // Verify page loaded
    await expect(page.locator('h1:has-text("Low Stock Report")')).toBeVisible();
    
    // Check that summary cards are visible
    await expect(page.locator('.summary-card')).toHaveCount(4);
    
    // Check that the low stock data table is visible
    await expect(page.locator('.ag-theme-quartz, .data-table')).toBeVisible();
    
    // Verify that some low stock data is present
    const rows = page.locator('.ag-row, .data-table tbody tr');
    await expect(rows).toHaveCountGreaterThan(0);
    
    // Test warehouse filter
    await page.locator('[name="warehouse_id"]').click();
    await page.locator('text=Main Warehouse').click();
    
    // Apply filters
    await page.locator('button:has-text("Apply Filters")').click();
    
    // Wait for data to reload
    await expect(page.locator('.loading')).not.toBeVisible();
    
    // Verify filtered results
    await expect(rows).toHaveCountGreaterThan(0);
  });
});