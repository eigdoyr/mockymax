import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../stores/editor-store";
import { loadScene } from "../lib/scene-loader";
import { composite } from "@mockymax/render-core";
import type { SceneManifestV1 } from "@mockymax/scene-format";
import { exportCanvasAsPng } from "../lib/export";

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});

function EditorPage() {
  const sceneId = useEditorStore((s) => s.sceneId);
  const setScene = useEditorStore((s) => s.setScene);
  const screenshotUrl = useEditorStore((s) => s.screenshotUrl);
  const setScreenshot = useEditorStore((s) => s.setScreenshot);
  const reset = useEditorStore((s) => s.reset);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [manifest, setManifest] = useState<SceneManifestV1 | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [pickingCorners, setPickingCorners] = useState(false);
  const [pickedCorners, setPickedCorners] = useState<Array<[number, number]>>([]);

  async function handleLoadScene() {
    const id = "studio/display-concrete-01";
    setStatus("loading scene…");
    try {
      const data = await loadScene(id);
      setScene(id);
      setManifest(data);
      setStatus("scene loaded");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "failed");
    }
  }

  async function handleExport() {
    if (!canvasRef.current) return;
    try {
      await exportCanvasAsPng(canvasRef.current);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "export failed");
    }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!pickingCorners) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    // Scale click position from display size to canvas pixel size
    const x = Math.round(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * canvas.height);
    const next = [...pickedCorners, [x, y] as [number, number]];
    setPickedCorners(next);
    if (next.length === 4) {
      const [tl, tr, br, bl] = next;
      console.log(
        "Screen quad:",
        JSON.stringify({ topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl }, null, 2),
      );
      setPickingCorners(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setScreenshot(url);
  }

  // Render whenever both scene and screenshot are ready
  useEffect(() => {
    if (!manifest || !screenshotUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    setStatus("rendering…");

    (async () => {
      try {
        const sceneId = manifest.id;
        const bgUrl = `/scenes/${sceneId}/${manifest.assets.background}`;

        const [bg, shot] = await Promise.all([loadImage(bgUrl), loadImage(screenshotUrl)]);

        canvas.width = bg.width;
        canvas.height = bg.height;

        composite(canvas, {
          background: bg,
          screenshot: shot,
          screenQuad: [
            manifest.screenQuad.topLeft,
            manifest.screenQuad.topRight,
            manifest.screenQuad.bottomRight,
            manifest.screenQuad.bottomLeft,
          ],
        });
        setStatus("rendered");
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "render failed");
      }
    })();
  }, [manifest, screenshotUrl]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editor</h1>
        <p className="mt-2 text-neutral-600">Drop a screenshot to begin.</p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleLoadScene}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
          >
            Load demo scene
          </button>
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
              setPickingCorners(true);
              setPickedCorners([]);
            }}
            className="rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm text-amber-900 hover:bg-amber-100"
          >
            Pick corners
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
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className={`block max-w-full ${pickingCorners ? "cursor-crosshair" : ""}`}
          />
          {pickingCorners && (
            <div className="bg-amber-50 px-4 py-2 text-sm text-amber-900">
              Click the screen corners in this order:{" "}
              <strong>top-left → top-right → bottom-right → bottom-left</strong>. Picked{" "}
              {pickedCorners.length} of 4. Output goes to browser console.
            </div>
          )}
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
