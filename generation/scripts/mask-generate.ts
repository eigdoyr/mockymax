import { fal } from "@fal-ai/client";
import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SELECTED_DIR = path.join(ROOT, "output", "_selected");
const MODEL = "fal-ai/sam-3/image";
const PROMPT = "screen of the device";
const COST_USD = 0.005;

config({ path: path.join(ROOT, ".env") });

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error("FAL_KEY missing. Add it to generation/.env (see .env.example).");
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

interface MaskProvenance {
  source: string;
  model: string;
  prompt: string;
  generatedAt: string;
  costUsd: number;
  sourceUrl: string;
}

async function uploadImage(localPath: string): Promise<string> {
  const buffer = await fs.readFile(localPath);
  const blob = new Blob([buffer], { type: "image/jpeg" });
  const file = new File([blob], path.basename(localPath), { type: "image/jpeg" });
  return await fal.storage.upload(file);
}

async function downloadMask(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buffer);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function listSourceImages(): Promise<string[]> {
  const entries = await fs.readdir(SELECTED_DIR);
  return entries
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
    .filter((name) => !name.includes("-mask."));
}

function maskPathFor(sourceFile: string): string {
  const base = path.basename(sourceFile, path.extname(sourceFile));
  return path.join(SELECTED_DIR, `${base}-mask.png`);
}

function provenancePathFor(sourceFile: string): string {
  const base = path.basename(sourceFile, path.extname(sourceFile));
  return path.join(SELECTED_DIR, `${base}-mask.json`);
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function generateMaskFor(sourceFile: string): Promise<void> {
  const sourcePath = path.join(SELECTED_DIR, sourceFile);
  const maskPath = maskPathFor(sourceFile);
  const provPath = provenancePathFor(sourceFile);

  console.log(`→ uploading ${sourceFile}`);
  const sourceUrl = await uploadImage(sourcePath);

  console.log(`  segmenting…`);
  const result = await fal.subscribe(MODEL, {
    input: {
      image_url: sourceUrl,
      prompt: PROMPT,
    },
  });

  const maskUrl = result.data.masks?.[0]?.url;
  if (!maskUrl) {
    throw new Error("no mask returned");
  }

  await downloadMask(maskUrl, maskPath);

  const provenance: MaskProvenance = {
    source: sourceFile,
    model: MODEL,
    prompt: PROMPT,
    generatedAt: new Date().toISOString(),
    costUsd: COST_USD,
    sourceUrl,
  };
  await fs.writeFile(provPath, JSON.stringify(provenance, null, 2));

  console.log(`  saved ${path.relative(ROOT, maskPath)}`);
}

async function main(): Promise<void> {
  const exists = await fileExists(SELECTED_DIR);
  if (!exists) {
    console.error(`Selected dir not found: ${SELECTED_DIR}`);
    process.exit(1);
  }

  const sources = await listSourceImages();
  if (sources.length === 0) {
    console.log("No source images found in _selected/.");
    return;
  }

  const todo: string[] = [];
  for (const source of sources) {
    if (await fileExists(maskPathFor(source))) {
      console.log(`skip ${source} (mask exists)`);
      continue;
    }
    todo.push(source);
  }

  if (todo.length === 0) {
    console.log("All sources already have masks. Nothing to do.");
    return;
  }

  console.log(`Generating masks for ${todo.length} of ${sources.length} sources.\n`);

  let succeeded = 0;
  let failed = 0;
  for (const source of todo) {
    try {
      await generateMaskFor(source);
      succeeded++;
    } catch (err) {
      console.error(`  FAILED ${source}:`, err instanceof Error ? err.message : err);
      failed++;
    }
    await sleep(1500);
  }

  const totalCost = (succeeded * COST_USD).toFixed(3);
  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed. ~$${totalCost} spent.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
