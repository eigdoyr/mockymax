import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../stores/editor-store";
import { loadScene } from "../lib/scene-loader";
import { composite } from "@mockymax/render-core";
import type { SceneManifestV1 } from "@mockymax/scene-format";

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

  async function handleLoadScene() {
    const id = "studio/macbook-concrete-01";
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
