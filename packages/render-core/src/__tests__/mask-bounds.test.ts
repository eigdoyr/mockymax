import { describe, expect, it, beforeAll, vi } from "vitest";
import { computeMaskBounds } from "../mask-bounds.js";

function makeMaskImage(pixels: number[][]): {
  width: number;
  height: number;
  data: Uint8ClampedArray;
} {
  const height = pixels.length;
  const width = pixels[0]?.length ?? 0;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = pixels[y]?.[x] ?? 0;
      const i = (y * width + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

function stubCanvasFor(image: { width: number; height: number; data: Uint8ClampedArray }) {
  const fakeCtx = {
    drawImage: vi.fn(),
    getImageData: () => ({
      data: image.data,
      width: image.width,
      height: image.height,
    }),
  };
  const fakeCanvas = {
    width: 0,
    height: 0,
    getContext: () => fakeCtx,
  } as unknown as HTMLCanvasElement;

  vi.stubGlobal("document", {
    createElement: () => fakeCanvas,
  });

  return { width: image.width, height: image.height } as unknown as HTMLImageElement;
}

describe("computeMaskBounds", () => {
  beforeAll(() => {
    vi.stubGlobal("document", { createElement: () => null });
  });

  it("returns tight bounds for a centered white square", () => {
    const image = makeMaskImage([
      [0, 0, 0, 0, 0],
      [0, 255, 255, 255, 0],
      [0, 255, 255, 255, 0],
      [0, 255, 255, 255, 0],
      [0, 0, 0, 0, 0],
    ]);
    const mask = stubCanvasFor(image);
    const bounds = computeMaskBounds(mask);
    expect(bounds).toEqual({ x: 1, y: 1, width: 3, height: 3 });
  });

  it("returns single-pixel bounds for a single white pixel", () => {
    const image = makeMaskImage([
      [0, 0, 0],
      [0, 255, 0],
      [0, 0, 0],
    ]);
    const mask = stubCanvasFor(image);
    const bounds = computeMaskBounds(mask);
    expect(bounds).toEqual({ x: 1, y: 1, width: 1, height: 1 });
  });

  it("respects threshold parameter", () => {
    const image = makeMaskImage([
      [0, 0, 0],
      [0, 50, 0],
      [0, 0, 0],
    ]);
    const mask = stubCanvasFor(image);
    expect(() => computeMaskBounds(mask, 100)).toThrow("entirely empty");
    const bounds = computeMaskBounds(mask, 10);
    expect(bounds).toEqual({ x: 1, y: 1, width: 1, height: 1 });
  });

  it("throws on an entirely-empty mask", () => {
    const image = makeMaskImage([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    const mask = stubCanvasFor(image);
    expect(() => computeMaskBounds(mask)).toThrow("entirely empty");
  });
});
