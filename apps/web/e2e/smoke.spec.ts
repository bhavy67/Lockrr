import { expect, test } from "@playwright/test";

/**
 * Minimum-viable smoke test. Proves that:
 *  1. The landing renders
 *  2. Sign-up creates a local account and lands on the dashboard
 *  3. The upload dialog opens via the `U` shortcut and closes with Escape
 *
 * The mock data layer persists to localStorage / IndexedDB inside the browser
 * context, which Playwright isolates per test, so no cleanup is needed.
 */
test.describe("Lockerr smoke", () => {
  test("signs up and reaches the dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /where is that important document/i,
      }),
    ).toBeVisible();

    await page.getByRole("link", { name: /create your vault/i }).first().click();

    const email = `test-${Date.now()}@example.com`;
    await page.getByLabel("What should we call you?").fill("Test User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /create your vault/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { name: /test user/i }),
    ).toBeVisible();
  });

  test("keyboard shortcut opens the upload dialog", async ({ page }) => {
    await page.goto("/sign-up");
    const email = `test-${Date.now()}@example.com`;
    await page.getByLabel("What should we call you?").fill("Test User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /create your vault/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.keyboard.press("u");
    await expect(
      page.getByRole("dialog", { name: /upload documents/i }),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: /upload documents/i }),
    ).toBeHidden();
  });
});
