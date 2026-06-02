import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../stores/editor-store";
import { loadScene } from "../lib/scene-loader";
import { composite } from "@mockymax/render-core";
import type { SceneManifestV2 } from "@mockymax/scene-format";
import { exportCanvasAsPng } from "../lib/export";

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});

function EditorPage() {
  const sceneId = useEditorStore((s) => s.sceneId);
  const setScreenshot = useEditorStore((s) => s.setScreenshot);
  const screenshotUrl = useEditorStore((s) => s.screenshotUrl);
  const reset = useEditorStore((s) => s.reset);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [manifest, setManifest] = useState<SceneManifestV2 | null>(null);
  const [status, setStatus] = useState<string>("idle");

  useEffect(() => {
    if (!sceneId) return;
    let cancelled = false;

    (async () => {
      setStatus("loading scene…");
      try {
        const data = await loadScene(sceneId);
        if (cancelled) return;
        setManifest(data);
        setStatus("scene loaded");
      } catch (err) {
        if (cancelled) return;
        setStatus(err instanceof Error ? err.message : "failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sceneId]);

  useEffect(() => {
    if (!manifest || !screenshotUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    let cancelled = false;

    (async () => {
      try {
        const bgUrl = `/scenes/${manifest.id}/${manifest.assets.background}`;
        const maskUrl = `/scenes/${manifest.id}/${manifest.assets.mask}`;
        const [bg, mask, shot] = await Promise.all([
          loadImage(bgUrl),
          loadImage(maskUrl),
          loadImage(screenshotUrl),
        ]);
        if (cancelled) return;
        canvas.width = bg.width;
        canvas.height = bg.height;
        composite(canvas, { background: bg, mask, screenshot: shot });
        setStatus("rendered");
      } catch (err) {
        if (cancelled) return;
        setStatus(err instanceof Error ? err.message : "render failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [manifest, screenshotUrl]);

  async function handleExport() {
    if (!canvasRef.current) return;
    try {
      await exportCanvasAsPng(canvasRef.current);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "export failed");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setScreenshot(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editor</h1>
        <p className="mt-2 text-neutral-600">
          Pick a scene from the gallery, then drop a screenshot.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
          <button
            type="button"
            onClick={handleExport}
            disabled={status !== "rendered"}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export PNG
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setManifest(null);
              setStatus("idle");
            }}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
          >
            Reset
          </button>
          <span className="text-sm text-neutral-500">
            scene: <span className="font-mono">{sceneId ?? "—"}</span>
          </span>
          <span className="text-sm text-neutral-500">
            status: <span className="font-mono">{status}</span>
          </span>
        </div>

        <div className="mt-4 overflow-auto rounded border border-neutral-200 bg-neutral-50">
          <canvas ref={canvasRef} className="block max-w-full" />
        </div>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
