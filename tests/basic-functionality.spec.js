// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Basic Application Functionality Tests', () => {
  test('should load the dashboard page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Verify the page loaded correctly
    await expect(page.locator('h1')).toContainText(/dashboard|overview/i);
    
    // Check that main dashboard elements are visible
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.summary-card')).toHaveCount(4);
    
    // Verify that navigation menu is accessible
    await expect(page.locator('.sidebar, nav')).toBeVisible();
    
    // Check that some data is displayed
    const kpiElements = page.locator('.summary-value');
    await expect(kpiElements).toHaveCountGreaterThan(0);
    
    // Verify no console errors occurred
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console Error: ${msg.text()}`);
      }
    });
  });

  test('should navigate to different sections', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to inventory section
    await page.locator('text=Inventory').click();
    await expect(page).toHaveURL(/.*inventory/);
    await expect(page.locator('h1')).toContainText(/inventory|items/i);
    
    // Test navigation to sales section
    await page.locator('text=Sales').click();
    await expect(page).toHaveURL(/.*sales/);
    await expect(page.locator('h1')).toContainText(/sales|invoices/i);
    
    // Test navigation to purchases section
    await page.locator('text=Purchases').click();
    await expect(page).toHaveURL(/.*purchases/);
    await expect(page.locator('h1')).toContainText(/purchases|orders/i);
    
    // Test navigation to reports section
    await page.locator('text=Reports').click();
    await expect(page).toHaveURL(/.*reports/);
    await expect(page.locator('h1')).toContainText(/reports|analytics/i);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock an API error scenario
    await page.route('**/api/**', route => {
      if (route.request().url().includes('/api/dashboard-data')) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      }
      route.continue();
    });
    
    await page.goto('/');
    
    // Verify that error handling UI is displayed
    await expect(page.locator('.error-message, .toast-error')).toBeVisible();
    
    // Restore normal API behavior
    await page.unroute('**/api/**');
  });

  test('should maintain responsive behavior across pages', async ({ page }) => {
    const pagesToTest = [
      { url: '/', title: /dashboard|overview/i },
      { url: '/inventory/items', title: /items|inventory/i },
      { url: '/sales', title: /sales|invoices/i },
      { url: '/purchases', title: /purchases|orders/i },
      { url: '/reports', title: /reports|analytics/i }
    ];
    
    for (const pageInfo of pagesToTest) {
      await page.goto(pageInfo.url);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded correctly
      await expect(page.locator('h1')).toContainText(pageInfo.title);
      
      // Check that main content area is visible
      await expect(page.locator('.page-content, .content')).toBeVisible();
      
      // Verify that navigation is accessible
      await expect(page.locator('.sidebar, .mobile-menu')).toBeVisible();
    }
  });
});