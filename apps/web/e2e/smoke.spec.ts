import { expect, test } from "@playwright/test";

/**
 * Minimum-viable smoke test. Proves that:
 *  1. The welcome screen renders on first visit
 *  2. "Open my vault" lands on the vault page
 *  3. The upload dialog opens via the `U` shortcut and closes with Escape
 *
 * The mock data layer persists to localStorage / IndexedDB inside the browser
 * context, which Playwright isolates per test, so no cleanup is needed.
 */
test.describe("LockKaro smoke", () => {
  test("welcome screen renders and opens vault", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /personal.*vault/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /open my vault/i }).click();

    await page.waitForURL(/\/vault/);
    await expect(page).toHaveURL(/\/vault/);
  });

  test("keyboard shortcut opens the upload dialog", async ({ page }) => {
    // Skip welcome by setting onboarded flag
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("lk.onboarded", "true"));
    await page.goto("/vault");

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
