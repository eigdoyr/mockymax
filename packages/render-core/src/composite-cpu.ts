import { computeHomography, applyHomography } from "./homography.js";
import type { Quad } from "./types.js";

export interface CompositeOptions {
  // Where the device screen lives in the background image
  screenQuad: Quad;
  // The user's screenshot
  screenshot: HTMLImageElement | ImageBitmap;
  // The background image (already loaded)
  background: HTMLImageElement | ImageBitmap;
  // Optional: how finely to slice the screenshot (more = smoother but slower)
  // 40 is a good default — fast and visually clean
  resolution?: number;
}

// Draws background, then warps screenshot into the screen quad, onto the canvas.
// Canvas should already be sized to the background's dimensions.
export function compositeCpu(canvas: HTMLCanvasElement, opts: CompositeOptions): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  const { background, screenshot, screenQuad, resolution = 40 } = opts;

  // Step 1: draw the background
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // Step 2: build the homography from screenshot pixel space to the screen quad
  const sw = screenshot.width;
  const sh = screenshot.height;
  const screenshotQuad: Quad = [
    [0, 0],
    [sw, 0],
    [sw, sh],
    [0, sh],
  ];
  const h = computeHomography(screenshotQuad, screenQuad);

  // Step 3: slice the screenshot into a grid of cells; draw each as two
  // triangles using affine approximation. More cells = better perspective.
  const cols = resolution;
  const rows = resolution;
  const cellW = sw / cols;
  const cellH = sh / rows;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const sx = x * cellW;
      const sy = y * cellH;

      // Corners in screenshot space
      const tl: [number, number] = [sx, sy];
      const tr: [number, number] = [sx + cellW, sy];
      const br: [number, number] = [sx + cellW, sy + cellH];
      const bl: [number, number] = [sx, sy + cellH];

      // Same corners projected into scene space
      const ptl = applyHomography(h, tl);
      const ptr = applyHomography(h, tr);
      const pbr = applyHomography(h, br);
      const pbl = applyHomography(h, bl);

      drawTriangle(ctx, screenshot, tl, tr, bl, ptl, ptr, pbl);
      drawTriangle(ctx, screenshot, tr, br, bl, ptr, pbr, pbl);
    }
  }
}

// Draw a single textured triangle.
// Source: triangle in the screenshot. Destination: same triangle warped.
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | ImageBitmap,
  s0: readonly [number, number],
  s1: readonly [number, number],
  s2: readonly [number, number],
  d0: readonly [number, number],
  d1: readonly [number, number],
  d2: readonly [number, number],
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d0[0], d0[1]);
  ctx.lineTo(d1[0], d1[1]);
  ctx.lineTo(d2[0], d2[1]);
  ctx.closePath();
  ctx.clip();

  // Compute the affine transform that maps source triangle to dest triangle
  const [sx0, sy0] = s0;
  const [sx1, sy1] = s1;
  const [sx2, sy2] = s2;
  const [dx0, dy0] = d0;
  const [dx1, dy1] = d1;
  const [dx2, dy2] = d2;

  const denom = sx0 * (sy2 - sy1) + sx1 * (sy0 - sy2) + sx2 * (sy1 - sy0);
  const a = (dx0 * (sy2 - sy1) + dx1 * (sy0 - sy2) + dx2 * (sy1 - sy0)) / denom;
  const b = (dy0 * (sy2 - sy1) + dy1 * (sy0 - sy2) + dy2 * (sy1 - sy0)) / denom;
  const c = (dx0 * (sx1 - sx2) + dx1 * (sx2 - sx0) + dx2 * (sx0 - sx1)) / denom;
  const d = (dy0 * (sx1 - sx2) + dy1 * (sx2 - sx0) + dy2 * (sx0 - sx1)) / denom;
  const e =
    (dx0 * (sx2 * sy1 - sx1 * sy2) +
      dx1 * (sx0 * sy2 - sx2 * sy0) +
      dx2 * (sx1 * sy0 - sx0 * sy1)) /
    denom;
  const f =
    (dy0 * (sx2 * sy1 - sx1 * sy2) +
      dy1 * (sx0 * sy2 - sx2 * sy0) +
      dy2 * (sx1 * sy0 - sx0 * sy1)) /
    denom;

  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}
