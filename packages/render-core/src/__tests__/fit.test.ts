import { describe, expect, it } from "vitest";
import { computeCoverFit } from "../fit.js";

describe("computeCoverFit", () => {
  it("fills mask exactly when aspect ratios match", () => {
    const mask = { x: 100, y: 50, width: 400, height: 300 };
    const fit = computeCoverFit(800, 600, mask);
    expect(fit).toEqual({ x: 100, y: 50, width: 400, height: 300 });
  });

  it("crops left/right when screenshot is wider than mask", () => {
    const mask = { x: 0, y: 0, width: 100, height: 100 };
    const fit = computeCoverFit(200, 100, mask);
    expect(fit.height).toBe(100);
    expect(fit.width).toBe(200);
    expect(fit.x).toBe(-50);
    expect(fit.y).toBe(0);
  });

  it("crops top/bottom when screenshot is taller than mask", () => {
    const mask = { x: 0, y: 0, width: 100, height: 100 };
    const fit = computeCoverFit(100, 200, mask);
    expect(fit.width).toBe(100);
    expect(fit.height).toBe(200);
    expect(fit.x).toBe(0);
    expect(fit.y).toBe(-50);
  });

  it("offsets to mask position", () => {
    const mask = { x: 200, y: 150, width: 50, height: 50 };
    const fit = computeCoverFit(50, 50, mask);
    expect(fit).toEqual({ x: 200, y: 150, width: 50, height: 50 });
  });
});
