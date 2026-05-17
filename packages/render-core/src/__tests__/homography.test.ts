import { describe, it, expect } from "vitest";
import { computeHomography, applyHomography } from "../homography.js";
import type { Quad } from "../types.js";

// Helper: assert two points are approximately equal (floating-point tolerance)
function expectPointClose(
  actual: readonly [number, number],
  expected: readonly [number, number],
  tolerance = 1e-6,
) {
  expect(actual[0]).toBeCloseTo(expected[0], 6);
  expect(actual[1]).toBeCloseTo(expected[1], 6);
}

describe("computeHomography", () => {
  it("maps identity quad to identity (matrix is identity-ish)", () => {
    const unit: Quad = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const m = computeHomography(unit, unit);

    // Identity maps every corner to itself
    for (const corner of unit) {
      expectPointClose(applyHomography(m, corner), corner);
    }
  });

  it("maps unit square to a translated square", () => {
    const src: Quad = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const dst: Quad = [
      [10, 20],
      [11, 20],
      [11, 21],
      [10, 21],
    ];
    const m = computeHomography(src, dst);

    expectPointClose(applyHomography(m, [0, 0]), [10, 20]);
    expectPointClose(applyHomography(m, [1, 0]), [11, 20]);
    expectPointClose(applyHomography(m, [1, 1]), [11, 21]);
    expectPointClose(applyHomography(m, [0, 1]), [10, 21]);

    // Center of the source should map to center of the destination
    expectPointClose(applyHomography(m, [0.5, 0.5]), [10.5, 20.5]);
  });

  it("maps unit square to a tilted quad (perspective)", () => {
    const src: Quad = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ];
    // A trapezoid — narrower at the top
    const dst: Quad = [
      [20, 0],
      [80, 0],
      [100, 100],
      [0, 100],
    ];
    const m = computeHomography(src, dst);

    expectPointClose(applyHomography(m, [0, 0]), [20, 0]);
    expectPointClose(applyHomography(m, [100, 0]), [80, 0]);
    expectPointClose(applyHomography(m, [100, 100]), [100, 100]);
    expectPointClose(applyHomography(m, [0, 100]), [0, 100]);
  });

  it("scales a quad to twice its size", () => {
    const src: Quad = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const dst: Quad = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ];
    const m = computeHomography(src, dst);
    expectPointClose(applyHomography(m, [0.5, 0.5]), [1, 1]);
  });
});
