import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadAllManifests, type LibraryItem } from "../lib/scene-loader";
import { useEditorStore } from "../stores/editor-store";

export const Route = createFileRoute("/")({
  component: GalleryPage,
});

function GalleryPage() {
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setScene = useEditorStore((s) => s.setScene);

  useEffect(() => {
    let cancelled = false;
    loadAllManifests()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        Failed to load scene library: {error}
      </div>
    );
  }

  if (!items) {
    return <p className="text-neutral-500">Loading scenes…</p>;
  }

  if (items.length === 0) {
    return <p className="text-neutral-500">No scenes yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
        <p className="mt-2 text-neutral-600">
          {items.length} {items.length === 1 ? "scene" : "scenes"}. Pick one to begin.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ manifest, thumbUrl }) => (
          <li key={manifest.id}>
            <Link
              to="/editor"
              onClick={() => setScene(manifest.id)}
              className="group block overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:border-neutral-400"
            >
              <div className="aspect-video overflow-hidden bg-neutral-100">
                <img
                  src={thumbUrl}
                  alt={manifest.name}
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  {manifest.collection}
                </p>
                <p className="mt-1 font-medium text-neutral-900">{manifest.name}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
