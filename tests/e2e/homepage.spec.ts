import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/ManHau/);
    
    // Check main heading
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Discover');
  });

  test('should show manga grid', async ({ page }) => {
    await page.goto('/');
    
    // Wait for manga to load
    await page.waitForSelector('a[href^="/"]');
    
    // Check that manga cards are present
    const mangaCards = page.locator('a[href^="/"]');
    await expect(mangaCards.first()).toBeVisible();
  });

  test('should have working search', async ({ page }) => {
    await page.goto('/');
    
    // Find search input
    const searchInput = page.getByPlaceholder(/Search/);
    await expect(searchInput).toBeVisible();
    
    // Enter search term
    await searchInput.fill('One Piece');
    await searchInput.press('Enter');
    
    // Should show search results
    await expect(page.getByText('Search Results')).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation links
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse' })).toBeVisible();
  });
});

test.describe('Browse Page', () => {
  test('should load browse page', async ({ page }) => {
    await page.goto('/browse');
    
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Browse');
  });

  test('should show filters', async ({ page }) => {
    await page.goto('/browse');
    
    // Check filter dropdowns
    await expect(page.getByLabel('Type')).toBeVisible();
    await expect(page.getByLabel('Status')).toBeVisible();
    await expect(page.getByLabel('Demographic')).toBeVisible();
  });

  test('should filter by type', async ({ page }) => {
    await page.goto('/browse');
    
    // Select manga type
    await page.getByLabel('Type').selectOption('manga');
    
    // Should update results
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Browse');
  });
});

test.describe('Manga Detail Page', () => {
  test('should load manga detail', async ({ page }) => {
    // Go to first manga (assuming there's at least one)
    await page.goto('/');
    
    // Click first manga card
    const firstManga = page.locator('a[href^="/"]').first();
    await firstManga.click();
    
    // Should show manga title
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should show chapters list', async ({ page }) => {
    await page.goto('/');
    
    // Click first manga
    const firstManga = page.locator('a[href^="/"]').first();
    await firstManga.click();
    
    // Should show chapters section
    await expect(page.getByRole('heading', { name: /Chapter/i })).toBeVisible();
  });
});

test.describe('SEO', () => {
  test('should have meta description', async ({ page }) => {
    await page.goto('/');
    
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
  });

  test('should have OpenGraph tags', async ({ page }) => {
    await page.goto('/');
    
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /.+/);
  });
});
