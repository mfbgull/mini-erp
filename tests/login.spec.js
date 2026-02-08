// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Login Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Navigate to login page (assuming it redirects automatically or we need to go to /login)
    await page.goto('/login');
    
    // Fill in login credentials
    await page.locator('[name="username"]').fill('admin');
    await page.locator('[name="password"]').fill('admin123');
    
    // Submit the form
    await page.locator('button[type="submit"]').click();
    
    // Wait for navigation to dashboard or check for successful login elements
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('.dashboard')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.locator('[name="username"]').fill('invalid');
    await page.locator('[name="password"]').fill('wrongpassword');
    
    // Submit the form
    await page.locator('button[type="submit"]').click();
    
    // Check for error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
  });

  test('should navigate to password reset page', async ({ page }) => {
    await page.goto('/login');
    
    // Click on password reset link
    await page.locator('text=Forgot Password').click();
    
    // Check if we're on the password reset page
    await expect(page).toHaveURL(/.*reset-password/);
  });

  test('should successfully logout', async ({ page }) => {
    // First, login with valid credentials
    await page.goto('/login');
    await page.locator('[name="username"]').fill('admin');
    await page.locator('[name="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    
    // Wait for dashboard to load
    await expect(page.locator('.dashboard')).toBeVisible();
    
    // Find and click the logout button (implementation depends on UI)
    await page.locator('button:text("Logout")').click();
    
    // Check if redirected to login page or homepage
    await expect(page).toHaveURL(/.*(login|\/)$/);
  });
});