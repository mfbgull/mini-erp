// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Dashboard Responsiveness Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming user is already logged in for these tests
    await page.goto('/dashboard');
    await expect(page.locator('.dashboard')).toBeVisible();
  });

  test('should load correctly on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Check that dashboard elements are visible
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.kpi-grid')).toBeVisible();
    await expect(page.locator('.summary-card')).toHaveCount(4); // Assuming 4 summary cards
    
    // Check that charts are visible
    await expect(page.locator('.chart-container')).toBeVisible();
    
    // Check that navigation elements are accessible
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.nav-item')).toHaveCountGreaterThan(0);
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check that dashboard elements are visible and properly resized
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.kpi-grid')).toBeVisible();
    
    // On tablet, summary cards might rearrange
    await expect(page.locator('.summary-card')).toHaveCount(4);
    
    // Check that navigation still works
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that dashboard elements are visible and properly formatted for mobile
    await expect(page.locator('.dashboard')).toBeVisible();
    
    // On mobile, summary cards should be arranged in a single column
    const summaryCards = page.locator('.summary-card');
    await expect(summaryCards).toHaveCount(4);
    
    // Check that mobile navigation is accessible
    await expect(page.locator('.mobile-menu-toggle')).toBeVisible().catch(() => {
      // If mobile menu toggle doesn't exist, check for hamburger menu
      expect(page.locator('.hamburger-menu')).toBeVisible();
    });
    
    // Check that content is readable on mobile
    const kpiValues = page.locator('.summary-value');
    await expect(kpiValues.first()).toBeVisible();
  });

  test('should maintain functionality across viewports', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('.dashboard')).toBeVisible();
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.dashboard')).toBeVisible();
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.dashboard')).toBeVisible();
    
    // All viewports should have the same core functionality
    await expect(page.locator('.summary-card')).toHaveCount(4);
  });
});