import { useEffect, useState } from "react";
import { exportCanvas, type ExportFormat, type ExportScale } from "../lib/export";

interface ExportDialogProps {
  open: boolean;
  getCanvas: () => HTMLCanvasElement | null;
  defaultFilename: string;
  onClose: () => void;
}

const FORMATS: ExportFormat[] = ["png", "jpg", "webp"];
const SCALES: ExportScale[] = [1, 2, 4];

export function ExportDialog({ open, getCanvas, defaultFilename, onClose }: ExportDialogProps) {
  const [filename, setFilename] = useState(defaultFilename);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState<ExportScale>(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleDownload() {
    const canvas = getCanvas();
    if (!canvas) return;
    setBusy(true);
    try {
      const finalName = ensureExtension(filename, format);
      await exportCanvas(canvas, { filename: finalName, format, scale });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Export</h2>

        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="text-neutral-700">Filename</span>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
          </label>

          <div>
            <div className="text-sm text-neutral-700">Format</div>
            <div className="mt-1 flex gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`rounded-md border px-3 py-1.5 text-sm uppercase ${
                    format === f
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 hover:bg-neutral-100"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-neutral-700">Size</div>
            <div className="mt-1 flex gap-2">
              {SCALES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScale(s)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    scale === s
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 hover:bg-neutral-100"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={busy || filename.trim() === ""}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "Exporting…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ensureExtension(name: string, format: ExportFormat): string {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  if (lower.endsWith(`.${format}`)) return trimmed;
  if (format === "jpg" && lower.endsWith(".jpeg")) return trimmed;
  return `${trimmed}.${format}`;
}
