import { test, expect } from "@playwright/test";

test("gallery shows empty state when no scenes exist", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByText("No scenes yet.")).toBeVisible({
    timeout: 10_000,
  });
});

test.skip("editor composites a screenshot into a scene", async () => {
  // Re-enabled in #54 after alpha-mask compositor (#50) and v0.2.5 library (#53) land.
});
