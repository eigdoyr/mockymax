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
  console.error("FAL_KEY missing.");
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

const TEST_IMAGES = [
  "_selected/monitor-linen-overcast-01-356861249.jpg",
  "_selected/phone-pocket-denim-01-404099711.jpg",
  "_selected/laptop-alcove-tungsten-01-105002863.jpg",
];

async function uploadImage(localPath: string): Promise<string> {
  const buffer = await fs.readFile(localPath);
  const blob = new Blob([buffer], { type: "image/jpeg" });
  const file = new File([blob], path.basename(localPath), { type: "image/jpeg" });
  return await fal.storage.upload(file);
}

async function downloadMask(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buffer);
}

async function segmentOne(imagePath: string): Promise<void> {
  const fullPath = path.join(ROOT, "output", imagePath);
  const outDir = path.join(ROOT, "output", "_masks");
  await fs.mkdir(outDir, { recursive: true });

  const baseName = path.basename(imagePath, path.extname(imagePath));
  const outPath = path.join(outDir, `${baseName}-mask.png`);

  console.log(`→ uploading ${path.basename(imagePath)}`);
  const imageUrl = await uploadImage(fullPath);

  console.log(`  segmenting...`);
  const result = await fal.subscribe("fal-ai/sam-3/image", {
    input: {
      image_url: imageUrl,
      prompt: "screen of the device",
    },
  });

  const maskUrl = result.data.masks?.[0]?.url;
  if (!maskUrl) {
    console.error(`  no mask returned`);
    return;
  }

  await downloadMask(maskUrl, outPath);
  console.log(`  saved ${path.relative(ROOT, outPath)}`);
}

async function main(): Promise<void> {
  console.log(`Testing SAM 3 on ${TEST_IMAGES.length} images.\n`);
  for (const image of TEST_IMAGES) {
    try {
      await segmentOne(image);
    } catch (err) {
      console.error(`  FAILED:`, err instanceof Error ? err.message : err);
    }
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
