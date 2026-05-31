import { parseSceneManifest, type SceneManifestV1 } from "@mockymax/scene-format";

// Where scenes live relative to the web app's public root
const SCENES_BASE = "/scenes";

export interface LibraryEntry {
  id: string;
  path: string;
}

export interface Library {
  schemaVersion: 1;
  scenes: LibraryEntry[];
}

export async function loadLibrary(): Promise<Library> {
  const res = await fetch(`${SCENES_BASE}/library.json`);
  if (!res.ok) {
    throw new Error(`Failed to load library: ${res.status}`);
  }
  return res.json();
}

export async function loadScene(id: string): Promise<SceneManifestV1> {
  // id is "collection/scene-name", which is also the folder path
  const res = await fetch(`${SCENES_BASE}/${id}/manifest.json`);
  if (!res.ok) {
    throw new Error(`Failed to load scene ${id}: ${res.status}`);
  }
  const json = await res.json();
  return parseSceneManifest(json);
}

export interface LibraryItem {
  manifest: SceneManifestV1;
  thumbUrl: string;
}

export async function loadAllManifests(): Promise<LibraryItem[]> {
  const library = await loadLibrary();
  const items = await Promise.all(
    library.scenes.map(async (entry) => {
      const manifest = await loadScene(entry.id);
      const thumbUrl = `${SCENES_BASE}/${entry.path}/${manifest.assets.thumb}`;
      return { manifest, thumbUrl };
    }),
  );
  return items;
}
