export type Point = readonly [x: number, y: number];

export type Quad = readonly [
  topLeft: Point,
  topRight: Point,
  bottomRight: Point,
  bottomLeft: Point,
];

// 3x3 matrix stored row-major: [a, b, c, d, e, f, g, h, i]
export type Matrix3x3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];
