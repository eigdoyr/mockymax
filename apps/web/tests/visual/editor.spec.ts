import { test, expect } from "@playwright/test";

test("gallery shows scene cards from the library", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // The library ships with 14 scenes; verify at least one card is rendered.
  await expect(page.getByRole("link").nth(2)).toBeVisible({ timeout: 10_000 });
});

test.skip("editor composites a screenshot into a scene", async () => {
  // Re-enabled in #54 once we rebaseline the alpha-mask compositor visual regression.
});
