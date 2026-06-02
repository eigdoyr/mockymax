import { compositeCpu, type CompositeOptions } from "./composite-cpu.js";
import { compositeWebgl } from "./composite-webgl.js";

export type { CompositeOptions };

export function composite(canvas: HTMLCanvasElement, opts: CompositeOptions): void {
  if (supportsWebgl2()) {
    try {
      compositeWebgl(canvas, opts);
      return;
    } catch {
      // fall through to CPU
    }
  }
  compositeCpu(canvas, opts);
}

function supportsWebgl2(): boolean {
  if (typeof document === "undefined") return false;
  const test = document.createElement("canvas");
  return !!test.getContext("webgl2");
}
