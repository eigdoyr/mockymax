import { test, expect } from "@playwright/test";
import path from "node:path";

test("editor composites a screenshot into the demo scene", async ({ page }) => {
  await page.goto("/editor", { waitUntil: "networkidle" });

  const loadButton = page.getByRole("button", { name: "Load demo scene" });
  await loadButton.waitFor({ state: "visible", timeout: 30_000 });
  await loadButton.click();

  await expect(page.getByText("status: scene loaded")).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(import.meta.dirname, "fixtures/test-screenshot.png"));

  await expect(page.getByText("status: rendered")).toBeVisible({
    timeout: 10_000,
  });

  // Grab the canvas pixels at native resolution
  const dataUrl = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("Canvas not found");
    return canvas.toDataURL("image/png");
  });

  const buffer = Buffer.from(dataUrl.split(",")[1]!, "base64");

  expect(buffer).toMatchSnapshot("editor-composite.png");
});
