import { computeMaskBounds } from "./mask-bounds.js";
import { computeCoverFit } from "./fit.js";
import type { CompositeOptions } from "./composite-cpu.js";

const VERTEX_SHADER = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos;
  vec2 clip = a_pos * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_background;
uniform sampler2D u_mask;
uniform sampler2D u_screenshot;
uniform vec2 u_canvasSize;
uniform vec4 u_fitRect;

void main() {
  vec4 bg = texture(u_background, v_uv);
  float maskValue = texture(u_mask, v_uv).r;

  vec2 px = v_uv * u_canvasSize;
  vec2 shotUV = (px - u_fitRect.xy) / u_fitRect.zw;

  if (shotUV.x < 0.0 || shotUV.x > 1.0 || shotUV.y < 0.0 || shotUV.y > 1.0) {
    outColor = bg;
    return;
  }

  vec4 shot = texture(u_screenshot, shotUV);
  outColor = mix(bg, shot, maskValue);
}`;

export function compositeWebgl(canvas: HTMLCanvasElement, opts: CompositeOptions): void {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
  if (!gl) throw new Error("WebGL2 not available");

  const { background, mask, screenshot } = opts;

  const bounds = computeMaskBounds(mask);
  const fit = computeCoverFit(screenshot.width, screenshot.height, bounds);

  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  gl.useProgram(program);

  const positions = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  const bgTex = createTexture(gl, background);
  gl.uniform1i(gl.getUniformLocation(program, "u_background"), 0);

  gl.activeTexture(gl.TEXTURE1);
  const maskTex = createTexture(gl, mask);
  gl.uniform1i(gl.getUniformLocation(program, "u_mask"), 1);

  gl.activeTexture(gl.TEXTURE2);
  const shotTex = createTexture(gl, screenshot);
  gl.uniform1i(gl.getUniformLocation(program, "u_screenshot"), 2);

  gl.uniform2f(gl.getUniformLocation(program, "u_canvasSize"), canvas.width, canvas.height);
  gl.uniform4f(gl.getUniformLocation(program, "u_fitRect"), fit.x, fit.y, fit.width, fit.height);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  gl.deleteTexture(bgTex);
  gl.deleteTexture(maskTex);
  gl.deleteTexture(shotTex);
  gl.deleteBuffer(buffer);
  gl.deleteProgram(program);
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
