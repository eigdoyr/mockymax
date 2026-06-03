import { test, expect } from "@playwright/test";
import path from "node:path";

test("gallery shows scene cards from the library", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("link").nth(2)).toBeVisible({ timeout: 10_000 });
});

test("editor composites a screenshot into a scene", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  // Click a stable scene (front-facing monitor, large mask area).
  await page.getByRole("link", { name: /Monitor on Linen/i }).click();
  await page.waitForURL("**/editor");
  await expect(page.getByText("status: scene loaded")).toBeVisible({
    timeout: 10_000,
  });

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(import.meta.dirname, "fixtures/test-screenshot.png"));

  await expect(page.getByText("status: rendered")).toBeVisible({
    timeout: 15_000,
  });

  const dataUrl = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("Canvas not found");
    return canvas.toDataURL("image/png");
  });
  const buffer = Buffer.from(dataUrl.split(",")[1]!, "base64");

  expect(buffer).toMatchSnapshot("editor-composite.png", {
    maxDiffPixelRatio: 0.005,
  });
});
