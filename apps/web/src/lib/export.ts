export type ExportFormat = "png" | "jpg" | "webp";
export type ExportScale = 1 | 2 | 4;

const MIME_TYPES: Record<ExportFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

export interface ExportOptions {
  filename: string;
  format: ExportFormat;
  scale: ExportScale;
}

export async function exportCanvas(source: HTMLCanvasElement, opts: ExportOptions): Promise<void> {
  const { filename, format, scale } = opts;

  const target = scale === 1 ? source : scaleCanvas(source, scale);

  const blob = await new Promise<Blob | null>((resolve) => {
    target.toBlob(resolve, MIME_TYPES[format], format === "jpg" ? 0.9 : undefined);
  });
  if (!blob) throw new Error("Failed to encode canvas");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function scaleCanvas(source: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const target = document.createElement("canvas");
  target.width = source.width * scale;
  target.height = source.height * scale;
  const ctx = target.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context for scaling");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, target.width, target.height);
  return target;
}
