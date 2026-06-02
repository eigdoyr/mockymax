import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEN_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(GEN_ROOT, "..");
const SELECTED_DIR = path.join(GEN_ROOT, "output", "_selected");
const SCENES_DIR = path.join(REPO_ROOT, "scenes");
const CONFIG_PATH = path.join(GEN_ROOT, "scenes-config.json");
const LIBRARY_PATH = path.join(SCENES_DIR, "library.json");

interface SceneConfig {
  id: string;
  source: string;
  name: string;
  collection: string;
  device: {
    type: string;
    model: string;
  };
  tags: string[];
  credit?: {
    author: string;
    license: string;
  };
}

interface ScenesConfigFile {
  schemaVersion: 1;
  defaultCredit: {
    author: string;
    license: string;
  };
  scenes: SceneConfig[];
}

interface LibraryEntry {
  id: string;
  path: string;
}

interface LibraryFile {
  schemaVersion: 2;
  scenes: LibraryEntry[];
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function maskPathFor(sourceFile: string): string {
  const base = path.basename(sourceFile, path.extname(sourceFile));
  return path.join(SELECTED_DIR, `${base}-mask.png`);
}

async function processScene(
  scene: SceneConfig,
  defaultCredit: ScenesConfigFile["defaultCredit"],
): Promise<void> {
  const sourcePath = path.join(SELECTED_DIR, scene.source);
  const maskPath = maskPathFor(scene.source);

  if (!(await fileExists(sourcePath))) {
    throw new Error(`source not found: ${scene.source}`);
  }
  if (!(await fileExists(maskPath))) {
    throw new Error(`mask not found for: ${scene.source}`);
  }

  const sceneSlug = scene.id.split("/")[1];
  if (!sceneSlug) {
    throw new Error(`malformed scene id: ${scene.id}`);
  }
  const outDir = path.join(SCENES_DIR, scene.collection, sceneSlug);
  await fs.mkdir(outDir, { recursive: true });

  await sharp(sourcePath).webp({ quality: 85 }).toFile(path.join(outDir, "background.webp"));

  await fs.copyFile(maskPath, path.join(outDir, "mask.png"));

  await sharp(sourcePath)
    .resize({ width: 480 })
    .webp({ quality: 85 })
    .toFile(path.join(outDir, "thumb.webp"));

  const manifest = {
    schemaVersion: 2 as const,
    id: scene.id,
    name: scene.name,
    collection: scene.collection,
    device: scene.device,
    tags: scene.tags,
    assets: {
      background: "background.webp",
      mask: "mask.png",
      thumb: "thumb.webp",
    },
    credit: scene.credit ?? defaultCredit,
  };
  await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`  ✓ ${scene.id}`);
}

async function updateLibrary(scenes: SceneConfig[]): Promise<void> {
  const existing: LibraryFile = (await fileExists(LIBRARY_PATH))
    ? JSON.parse(await fs.readFile(LIBRARY_PATH, "utf8"))
    : { schemaVersion: 2, scenes: [] };

  const byId = new Map<string, LibraryEntry>();
  for (const entry of existing.scenes) {
    byId.set(entry.id, entry);
  }
  for (const scene of scenes) {
    const sceneSlug = scene.id.split("/")[1];
    if (!sceneSlug) continue;
    byId.set(scene.id, {
      id: scene.id,
      path: `${scene.collection}/${sceneSlug}`,
    });
  }

  const sorted = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  const next: LibraryFile = { schemaVersion: 2, scenes: sorted };
  await fs.writeFile(LIBRARY_PATH, JSON.stringify(next, null, 2) + "\n");
}

async function main(): Promise<void> {
  if (!(await fileExists(CONFIG_PATH))) {
    console.error(`Config not found: ${CONFIG_PATH}`);
    process.exit(1);
  }

  const raw = await fs.readFile(CONFIG_PATH, "utf8");
  const config: ScenesConfigFile = JSON.parse(raw);

  if (config.schemaVersion !== 1) {
    console.error(`Unsupported config schemaVersion: ${config.schemaVersion}`);
    process.exit(1);
  }

  console.log(`Bundling ${config.scenes.length} scenes.\n`);

  let succeeded = 0;
  let failed = 0;
  const okScenes: SceneConfig[] = [];
  for (const scene of config.scenes) {
    try {
      await processScene(scene, config.defaultCredit);
      okScenes.push(scene);
      succeeded++;
    } catch (err) {
      console.error(`  ✗ ${scene.id}: ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  if (okScenes.length > 0) {
    await updateLibrary(okScenes);
  }

  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
