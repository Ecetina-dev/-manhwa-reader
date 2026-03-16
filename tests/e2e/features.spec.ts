import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test('should show login form when not authenticated', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show login form
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('should allow access with correct password', async ({ page }) => {
    await page.goto('/admin');
    
    // Enter password
    await page.getByLabel('Password').fill('manhau_admin_2026');
    await page.getByRole('button', { name: /Login/i }).click();
    
    // Should show admin panel
    await expect(page.getByText('Admin Panel')).toBeVisible({ timeout: 10000 });
  });

  test('should reject wrong password', async ({ page }) => {
    await page.goto('/admin');
    
    // Enter wrong password
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /Login/i }).click();
    
    // Should show error
    await expect(page.getByText('Invalid password')).toBeVisible();
  });
});

test.describe('Favorites Page', () => {
  test('should show favorites page', async ({ page }) => {
    await page.goto('/favorites');
    
    // Should show page title
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Favorites');
  });

  test('should show empty state when no favorites', async ({ page }) => {
    await page.goto('/favorites');
    
    // Should show empty message
    await expect(page.getByText(/No favorites/)).toBeVisible();
  });
});

test.describe('History Page', () => {
  test('should show history page', async ({ page }) => {
    await page.goto('/history');
    
    // Should show page title
    await expect(page.getByRole('heading', { level: 1 })).toContainText('History');
  });

  test('should show empty state when no history', async ({ page }) => {
    await page.goto('/history');
    
    // Should show empty message
    await expect(page.getByText(/No reading history/)).toBeVisible();
  });
});
