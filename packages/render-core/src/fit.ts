import type { MaskBounds } from "./mask-bounds.js";

export interface FitRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function computeCoverFit(
  screenshotWidth: number,
  screenshotHeight: number,
  maskBounds: MaskBounds,
): FitRect {
  const maskAspect = maskBounds.width / maskBounds.height;
  const shotAspect = screenshotWidth / screenshotHeight;

  let scale: number;
  if (shotAspect > maskAspect) {
    scale = maskBounds.height / screenshotHeight;
  } else {
    scale = maskBounds.width / screenshotWidth;
  }

  const drawWidth = screenshotWidth * scale;
  const drawHeight = screenshotHeight * scale;
  const offsetX = maskBounds.x + (maskBounds.width - drawWidth) / 2;
  const offsetY = maskBounds.y + (maskBounds.height - drawHeight) / 2;

  return {
    x: offsetX,
    y: offsetY,
    width: drawWidth,
    height: drawHeight,
  };
}
