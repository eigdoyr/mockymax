import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useEditorStore } from "../stores/editor-store";
import { loadScene } from "../lib/scene-loader";
import type { SceneManifestV1 } from "@mockymax/scene-format";

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});

function EditorPage() {
  const sceneId = useEditorStore((s) => s.sceneId);
  const setScene = useEditorStore((s) => s.setScene);
  const reset = useEditorStore((s) => s.reset);

  const [status, setStatus] = useState<string>("idle");
  const [manifest, setManifest] = useState<SceneManifestV1 | null>(null);

  async function handleLoad() {
    const id = "studio/macbook-concrete-01";
    setStatus("loading…");
    setManifest(null);
    try {
      const data = await loadScene(id);
      setScene(id);
      setManifest(data);
      setStatus("loaded");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editor</h1>
        <p className="mt-2 text-neutral-600">Drop a screenshot to begin.</p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLoad}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
          >
            Load demo scene
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

        {manifest && (
          <pre className="mt-4 overflow-auto rounded bg-neutral-50 p-3 text-xs">
            {JSON.stringify(manifest, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
