import { fal } from "@fal-ai/client";
import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

config({ path: path.join(ROOT, ".env") });

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error("FAL_KEY missing. Add it to generation/.env (see .env.example).");
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

interface PromptEntry {
  id: string;
  collection: string;
  prompt: string;
  aspectRatio?: "16:9" | "4:3" | "1:1" | "3:4" | "9:16";
}

interface PromptFile {
  schemaVersion: 1;
  prompts: PromptEntry[];
}

async function loadPrompts(): Promise<PromptEntry[]> {
  const file = await fs.readFile(path.join(ROOT, "prompts.json"), "utf8");
  const parsed = JSON.parse(file) as PromptFile;
  if (parsed.schemaVersion !== 1) {
    throw new Error(`Unsupported prompt schema version: ${parsed.schemaVersion}`);
  }
  return parsed.prompts;
}

async function downloadImage(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buffer);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateOne(entry: PromptEntry): Promise<void> {
  const collectionDir = path.join(ROOT, "output", entry.collection);
  await fs.mkdir(collectionDir, { recursive: true });

  const seed = Math.floor(Math.random() * 1_000_000_000);
  const baseName = `${entry.id}-${seed}`;
  const imagePath = path.join(collectionDir, `${baseName}.jpg`);
  const metaPath = path.join(collectionDir, `${baseName}.json`);

  console.log(`→ ${entry.id} (seed=${seed})`);

  const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", {
    input: {
      prompt: entry.prompt,
      aspect_ratio: entry.aspectRatio ?? "16:9",
      num_images: 1,
      seed,
    },
  });

  const url = result.data.images?.[0]?.url;
  if (!url) throw new Error(`No image returned for ${entry.id}`);

  await downloadImage(url, imagePath);

  const meta = {
    id: entry.id,
    collection: entry.collection,
    prompt: entry.prompt,
    aspectRatio: entry.aspectRatio ?? "16:9",
    seed,
    generatedAt: new Date().toISOString(),
    sourceUrl: url,
  };
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));

  console.log(`  saved ${path.relative(ROOT, imagePath)}`);
}

async function main(): Promise<void> {
  const prompts = await loadPrompts();
  console.log(`Loaded ${prompts.length} prompts.`);

  for (const entry of prompts) {
    try {
      await generateOne(entry);
    } catch (err) {
      console.error(`  FAILED ${entry.id}:`, err instanceof Error ? err.message : err);
    }
    await sleep(1500);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
