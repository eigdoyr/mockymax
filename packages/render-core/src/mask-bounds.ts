export interface MaskBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function computeMaskBounds(
  mask: HTMLImageElement | ImageBitmap,
  threshold = 16,
): MaskBounds {
  const canvas = document.createElement("canvas");
  canvas.width = mask.width;
  canvas.height = mask.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context for mask bounds");
  }
  ctx.drawImage(mask, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, mask.width, mask.height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i] ?? 0;
      if (r > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) {
    throw new Error("Mask is entirely empty (no white pixels)");
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}
