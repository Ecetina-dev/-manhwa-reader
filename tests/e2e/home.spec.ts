import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load home page", async ({ page }) => {
    await page.goto("/");

    // Check title
    await expect(page).toHaveTitle(/ManHau/i);

    // Check hero section
    await expect(page.locator("text=Discover")).toBeVisible();
    await expect(page.locator("text=Amazing Stories")).toBeVisible();

    // Check search bar exists
    await expect(page.locator('input[name="q"]')).toBeVisible();

    // Check navigation exists
    await expect(page.locator("nav")).toBeVisible();
  });

  test("should show popular section", async ({ page }) => {
    await page.goto("/");

    // Check popular section
    await expect(page.locator("text=Popular Now")).toBeVisible();
  });

  test("should have accessible skip links", async ({ page }) => {
    await page.goto("/");

    // Check that page is accessible
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("should navigate between pages", async ({ page }) => {
    await page.goto("/");

    // Click browse link
    await page.click("text=Browse");

    // Should show browse page
    await expect(page.locator("text=Search Results")).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Check h1 exists and is unique
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
  });

  test("should have alt text on images", async ({ page }) => {
    await page.goto("/");

    // Check images have alt attribute
    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).toBeTruthy();
    }
  });

  test("should have proper focus indicators", async ({ page }) => {
    await page.goto("/");

    // Check that interactive elements are focusable
    const searchInput = page.locator('input[name="q"]');
    await searchInput.focus();

    await expect(searchInput).toBeFocused();
  });
});

test.describe("SEO", () => {
  test("should have meta description", async ({ page }) => {
    await page.goto("/");

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /./);
  });

  test("should have OpenGraph tags", async ({ page }) => {
    await page.goto("/");

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /./);

    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveAttribute("content", /./);
  });
});

test.describe("PWA", () => {
  test("should have manifest link", async ({ page }) => {
    await page.goto("/");

    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toBeVisible();
  });

  test("should have theme color", async ({ page }) => {
    await page.goto("/");

    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute("content", /#6366f1/i);
  });
});
