import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: GalleryPage,
});

function GalleryPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
      <p className="mt-2 text-neutral-600">Pick a scene to start. (Scene library coming soon.)</p>
    </div>
  );
}
