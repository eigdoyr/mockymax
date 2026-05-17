import { createFileRoute } from "@tanstack/react-router";
import { useEditorStore } from "../stores/editor-store";

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});

function EditorPage() {
  const sceneId = useEditorStore((state) => state.sceneId);
  const screenshotUrl = useEditorStore((state) => state.screenshotUrl);
  const transform = useEditorStore((state) => state.transform);
  const setScene = useEditorStore((state) => state.setScene);
  const reset = useEditorStore((state) => state.reset);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editor</h1>
        <p className="mt-2 text-neutral-600">Drop a screenshot to begin. (Editor coming soon.)</p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Store state (debug)
        </h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-neutral-600">Scene</dt>
          <dd className="font-mono">{sceneId ?? "—"}</dd>
          <dt className="text-neutral-600">Screenshot</dt>
          <dd className="font-mono">{screenshotUrl ?? "—"}</dd>
          <dt className="text-neutral-600">Transform</dt>
          <dd className="font-mono">
            x:{transform.offsetX} y:{transform.offsetY} ×{transform.scale}
          </dd>
        </dl>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setScene("studio/macbook-concrete-01")}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
          >
            Set demo scene
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
