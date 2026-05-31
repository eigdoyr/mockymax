import { computeHomography } from "./homography.js";
import type { Quad } from "./types.js";
import type { CompositeOptions } from "./composite-cpu.js";

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_canvasPx;
uniform vec2 u_canvasSize;
void main() {
  v_canvasPx = a_position * u_canvasSize;
  vec2 clip = a_position * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_canvasPx;
out vec4 outColor;

uniform sampler2D u_background;
uniform sampler2D u_screenshot;
uniform mat3 u_homographyInverse;
uniform vec2 u_canvasSize;
uniform vec2 u_screenshotSize;

void main() {
  vec2 bgUV = v_canvasPx / u_canvasSize;
  vec4 bg = texture(u_background, bgUV);

  vec3 src = u_homographyInverse * vec3(v_canvasPx, 1.0);
  vec2 srcPx = src.xy / src.z;
  vec2 srcUV = srcPx / u_screenshotSize;

  if (srcUV.x >= 0.0 && srcUV.x <= 1.0 && srcUV.y >= 0.0 && srcUV.y <= 1.0) {
    outColor = texture(u_screenshot, srcUV);
  } else {
    outColor = bg;
  }
}`;

export function compositeWebgl(canvas: HTMLCanvasElement, opts: CompositeOptions): void {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
  if (!gl) throw new Error("WebGL2 not available");

  const { background, screenshot, screenQuad } = opts;

  const sw = screenshot.width;
  const sh = screenshot.height;
  const screenshotQuad: Quad = [
    [0, 0],
    [sw, 0],
    [sw, sh],
    [0, sh],
  ];
  const h = computeHomography(screenshotQuad, screenQuad);
  const hInv = invert3x3(h);

  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  gl.useProgram(program);

  const positions = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const positionLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  const bgTexture = createTexture(gl, background);
  gl.uniform1i(gl.getUniformLocation(program, "u_background"), 0);

  gl.activeTexture(gl.TEXTURE1);
  const shotTexture = createTexture(gl, screenshot);
  gl.uniform1i(gl.getUniformLocation(program, "u_screenshot"), 1);

  // WebGL is column-major; our matrix is row-major.
  gl.uniformMatrix3fv(
    gl.getUniformLocation(program, "u_homographyInverse"),
    false,
    transposeMat3(hInv),
  );
  gl.uniform2f(gl.getUniformLocation(program, "u_canvasSize"), canvas.width, canvas.height);
  gl.uniform2f(gl.getUniformLocation(program, "u_screenshotSize"), sw, sh);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function createProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}

function compileShader(gl: WebGL2RenderingContext, type: GLenum, src: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Shader compile failed: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

function createTexture(
  gl: WebGL2RenderingContext,
  source: HTMLImageElement | ImageBitmap,
): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error("Failed to create texture");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

function invert3x3(m: readonly number[]): readonly number[] {
  const a = m[0]!,
    b = m[1]!,
    c = m[2]!;
  const d = m[3]!,
    e = m[4]!,
    f = m[5]!;
  const g = m[6]!,
    h = m[7]!,
    i = m[8]!;

  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const I = a * e - b * d;

  const det = a * A + b * B + c * C;
  if (det === 0) throw new Error("Matrix is singular");
  const invDet = 1 / det;

  return [
    A * invDet,
    D * invDet,
    G * invDet,
    B * invDet,
    E * invDet,
    H * invDet,
    C * invDet,
    F * invDet,
    I * invDet,
  ];
}

function transposeMat3(m: readonly number[]): Float32Array {
  return new Float32Array([m[0]!, m[3]!, m[6]!, m[1]!, m[4]!, m[7]!, m[2]!, m[5]!, m[8]!]);
}
