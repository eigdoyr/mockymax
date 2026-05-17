import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});

function EditorPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Editor</h1>
      <p className="mt-2 text-neutral-600">Drop a screenshot to begin. (Editor coming soon.)</p>
    </div>
  );
}
