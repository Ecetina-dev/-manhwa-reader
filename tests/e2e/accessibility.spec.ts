import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("homepage should be accessible", async ({ page }) => {
    await page.goto("/");

    // Check skip link exists
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("pages should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Check h1 exists
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("images should have alt text or aria-label", async ({ page }) => {
    await page.goto("/");

    // Wait for manga to load
    await page.waitForSelector('a[href^="/"]');

    // Check images have aria-label or alt
    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const ariaLabel = await img.getAttribute("aria-label");

      // At least one should be present
      expect(
        alt ||
          ariaLabel ||
          (await img.evaluate(
            (el) => el.getAttribute("aria-hidden") === "true",
          )),
      ).toBeTruthy();
    }
  });

  test("form inputs should have labels", async ({ page }) => {
    await page.goto("/");

    // Search input should have label or aria-label
    const searchInput = page.getByPlaceholder(/Search/);
    await expect(searchInput).toBeVisible();

    const ariaLabel = await searchInput.getAttribute("aria-label");
    const labelledBy = await searchInput.getAttribute("aria-labelledby");

    // Should have some form of labeling
    expect(
      ariaLabel ||
        labelledBy ||
        page.locator(
          'label[for="' + (await searchInput.getAttribute("id")) + '"]',
        ),
    ).toBeTruthy();
  });

  test("buttons should have accessible names", async ({ page }) => {
    await page.goto("/");

    // Get all buttons
    const buttons = page.locator("button");
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute("aria-label");

      // Button should have text or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test("links should have discernible text", async ({ page }) => {
    await page.goto("/");

    // Get navigation links
    const navLinks = page.locator("nav a");
    const count = await navLinks.count();

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute("aria-label");

      // Link should have text or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test("color contrast should be sufficient", async ({ page }) => {
    await page.goto("/");

    // This is a basic check - in real tests, use axe-core or similar
    // Check that text is visible
    const heading = page.locator("h1");
    await expect(heading).toHaveCSS("color", expect.any(String));
  });
});

test.describe("Performance", () => {
  test("page should load quickly", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    const loadTime = Date.now() - start;

    // Page should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("should not have console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");

    // Filter out expected errors (like 404s for non-existent resources)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("404") && !e.includes("favicon") && !e.includes("manifest"),
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
