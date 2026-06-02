import { computeMaskBounds } from "./mask-bounds.js";
import { computeCoverFit } from "./fit.js";

export interface CompositeOptions {
  background: HTMLImageElement | ImageBitmap;
  mask: HTMLImageElement | ImageBitmap;
  screenshot: HTMLImageElement | ImageBitmap;
}

export function compositeCpu(canvas: HTMLCanvasElement, opts: CompositeOptions): void {
  const { background, mask, screenshot } = opts;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context");
  }

  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  const bounds = computeMaskBounds(mask);
  const fit = computeCoverFit(screenshot.width, screenshot.height, bounds);

  const offscreen = document.createElement("canvas");
  offscreen.width = canvas.width;
  offscreen.height = canvas.height;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) {
    throw new Error("Failed to get 2D context for offscreen");
  }

  offCtx.drawImage(screenshot, fit.x, fit.y, fit.width, fit.height);
  offCtx.globalCompositeOperation = "destination-in";
  offCtx.drawImage(mask, 0, 0, canvas.width, canvas.height);

  ctx.drawImage(offscreen, 0, 0);
}
