import type { Point, Quad, Matrix3x3 } from "./types.js";

// Maps the source quad to the destination quad.
// Returns a 3x3 matrix you can apply to any point with applyHomography.
//
// Math: solve an 8-equation linear system for the 8 unknowns of the matrix
// (the 9th is fixed at 1 to remove scale ambiguity). Each corner pair gives
// us 2 equations. We use Gaussian elimination.
export function computeHomography(src: Quad, dst: Quad): Matrix3x3 {
  const a: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const [sx, sy] = src[i]!;
    const [dx, dy] = dst[i]!;
    a.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    a.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    b.push(dx);
    b.push(dy);
  }

  const h = solve(a, b);

  return [h[0]!, h[1]!, h[2]!, h[3]!, h[4]!, h[5]!, h[6]!, h[7]!, 1] as const;
}

// Apply a homography to a point.
export function applyHomography(m: Matrix3x3, p: Point): Point {
  const [x, y] = p;
  const w = m[6] * x + m[7] * y + m[8];
  const nx = (m[0] * x + m[1] * y + m[2]) / w;
  const ny = (m[3] * x + m[4] * y + m[5]) / w;
  return [nx, ny] as const;
}

// Gaussian elimination with partial pivoting. Solves Ax = b.
function solve(a: number[][], b: number[]): number[] {
  const n = b.length;
  // Copy so we don't mutate the inputs
  const m: number[][] = a.map((row, i) => [...row, b[i]!]);

  for (let i = 0; i < n; i++) {
    // Find the pivot row
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(m[k]![i]!) > Math.abs(m[maxRow]![i]!)) maxRow = k;
    }
    [m[i], m[maxRow]] = [m[maxRow]!, m[i]!];

    // Eliminate below
    for (let k = i + 1; k < n; k++) {
      const factor = m[k]![i]! / m[i]![i]!;
      for (let j = i; j <= n; j++) {
        m[k]![j]! -= factor * m[i]![j]!;
      }
    }
  }

  // Back-substitute
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = m[i]![n]!;
    for (let j = i + 1; j < n; j++) sum -= m[i]![j]! * x[j]!;
    x[i] = sum / m[i]![i]!;
  }
  return x;
}
