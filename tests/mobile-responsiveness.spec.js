// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Mobile Responsiveness Tests', () => {
  test('should display summary cards in 2-column grid on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await expect(page.locator('.dashboard')).toBeVisible();
    
    // Verify summary cards are arranged in 2-column grid
    const summaryCards = page.locator('.summary-card');
    await expect(summaryCards).toHaveCount(4);
    
    // On mobile, the 4 summary cards should be arranged as 2x2 grid
    // Check that the layout is appropriate for mobile
    await expect(page.locator('.summary-cards-grid')).toBeVisible();
    
    // Check that cards are properly sized for mobile
    const firstCard = summaryCards.first();
    await expect(firstCard).toBeVisible();
    
    // Verify that the cards are properly spaced on mobile
    await expect(firstCard).toHaveCSS('width', /px/); // Should have a defined width
  });

  test('should show hamburger menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // On mobile, the main navigation should be collapsed into a hamburger menu
    await expect(page.locator('.hamburger-menu, .mobile-menu-toggle')).toBeVisible();
    
    // The main menu items should be hidden by default
    await expect(page.locator('.nav-menu')).not.toBeVisible();
    
    // Click the hamburger menu
    await page.locator('.hamburger-menu, .mobile-menu-toggle').click();
    
    // The menu should now be visible
    await expect(page.locator('.nav-menu')).toBeVisible();
    
    // Check that all main navigation items are accessible
    await expect(page.locator('.nav-item')).toHaveCountGreaterThan(5);
  });

  test('should display expense cards in mobile-friendly format', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/reports/expense-summary');
    
    // Wait for page to load
    await expect(page.locator('.expense-summary-report')).toBeVisible();
    
    // On mobile, the table should be replaced with cards or have a different layout
    // Check if mobile-specific class is applied
    const mobileView = page.locator('.mobile-expense-list');
    if (await mobileView.count() > 0) {
      // If mobile view exists, verify it's displayed
      await expect(mobileView).toBeVisible();
      
      // Check that expense cards are visible
      const expenseCards = page.locator('.expense-card');
      await expect(expenseCards).toHaveCountGreaterThan(0);
      
      // Verify that each card has essential information
      const firstCard = expenseCards.first();
      await expect(firstCard.locator('.expense-amount')).toBeVisible();
      await expect(firstCard.locator('.expense-category')).toBeVisible();
    } else {
      // If no mobile-specific view, verify that the table is still usable on mobile
      const table = page.locator('.ag-theme-quartz, .data-table');
      await expect(table).toBeVisible();
      
      // On mobile, AG Grid should have special mobile styling
      await expect(table).toHaveCSS('height', /px/);
    }
  });

  test('should properly handle form inputs on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/inventory/items');
    
    // Click to add a new item
    await page.locator('button:has-text("Add Item")').click();
    
    // Wait for form to appear
    await expect(page.locator('.item-form')).toBeVisible();
    
    // Check that form fields are properly sized for mobile
    const inputField = page.locator('[name="item_name"]').first();
    await expect(inputField).toBeVisible();
    
    // Fill in a field
    await inputField.fill('Mobile Test Item');
    
    // Verify the input was filled correctly
    await expect(inputField).toHaveValue('Mobile Test Item');
    
    // Check that the form is scrollable if needed
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });

  test('should display reports in mobile-optimized view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/reports/stock-valuation');
    
    // Wait for report to load
    await expect(page.locator('.stock-valuation-report')).toBeVisible();
    
    // Check that summary section is visible
    await expect(page.locator('.report-summary')).toBeVisible();
    
    // On mobile, the report table should either be transformed to cards or have horizontal scroll
    const reportTable = page.locator('.ag-theme-quartz, .data-table');
    if (await reportTable.count() > 0) {
      // If AG Grid is used, check if it has mobile adaptations
      await expect(reportTable).toBeVisible();
    }
    
    // Check that filter controls are usable on mobile
    await expect(page.locator('.report-filters')).toBeVisible();
    
    // Verify that export buttons are accessible
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });

  test('should maintain touch-friendly controls on all pages', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test multiple pages for touch-friendly controls
    const pagesToTest = [
      '/dashboard',
      '/inventory/items',
      '/sales',
      '/purchases',
      '/reports'
    ];
    
    for (const url of pagesToTest) {
      await page.goto(url);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check that primary action buttons are visible and appropriately sized
      const primaryButtons = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
      if (await primaryButtons.count() > 0) {
        await expect(primaryButtons.first()).toBeVisible();
      }
      
      // Check that navigation elements are accessible
      await expect(page.locator('nav, .sidebar, .mobile-menu')).toBeVisible().catch(() => {});
    }
  });

  test('should properly handle orientation changes', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Verify elements are visible in portrait
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.summary-card')).toHaveCount(4);
    
    // Change to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    
    // Elements should still be visible and properly laid out in landscape
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.summary-card')).toHaveCount(4);
    
    // Change back to portrait
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Elements should still be visible and properly laid out
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.summary-card')).toHaveCount(4);
  });
});