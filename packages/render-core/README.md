# @mockymax/render-core

Rendering math and compositing primitives for MockyMax.

## What's here

- `computeHomography(src, dst)` — returns a 3×3 matrix that maps the source quad to the destination quad
- `applyHomography(matrix, point)` — apply the matrix to a single point
- `Point`, `Quad`, `Matrix3x3` types

## Why a homography

The scene manifest tells us where a device's screen lives in the background image as four corner coordinates. The user's screenshot is a flat rectangle. We need to warp that rectangle so it lines up with those four corners.

A homography is the 3×3 matrix that does exactly that — it's the projective transform between two planes. The same math behind AR and OpenCV's `findHomography()`.

## Example

```ts
import { computeHomography, applyHomography } from "@mockymax/render-core";

const screenshot = [
  [0, 0],
  [1920, 0],
  [1920, 1080],
  [0, 1080],
] as const;

const screenInScene = [
  [412, 280],
  [1508, 290],
  [1518, 938],
  [402, 928],
] as const;

const m = computeHomography(screenshot, screenInScene);

// Where does the screenshot's center land in the scene?
const center = applyHomography(m, [960, 540]);
```
