import { z } from "zod";

/**
 * Scene Manifest v2 — the contract between scene authors and renderers.
 *
 * A scene bundle is a manifest.json + referenced asset files (background,
 * mask, thumbnail). The manifest tells the renderer everything it needs to
 * composite a user's screenshot into the scene using alpha-mask compositing.
 *
 * v2 supersedes v1 entirely. v1 used quad-based homography compositing,
 * which had limitations on rounded corners and partial-visibility scenes.
 * See docs/v0.2.5-architecture-pivot.md for the migration rationale.
 *
 * Stability: v2 manifests are supported until a future major schema version.
 */

const deviceSchema = z.object({
  type: z.enum(["phone", "tablet", "laptop", "desktop", "watch", "other"]),
  model: z.string().min(1, "Device model is required (e.g. macbook-pro-16, generic)"),
});

const assetsSchema = z.object({
  background: z.string().min(1),
  mask: z.string().min(1),
  thumb: z.string().min(1),
});

const creditSchema = z.object({
  author: z.string().min(1),
  license: z.string().min(1),
  sourceUrl: z.string().url().optional(),
});

export const sceneManifestSchemaV2 = z.object({
  schemaVersion: z.literal(2),
  id: z
    .string()
    .regex(/^[a-z0-9-]+\/[a-z0-9-]+$/, "Scene id must be 'collection/scene-name' in kebab-case"),
  name: z.string().min(1),
  collection: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Collection must be kebab-case (lowercase, digits, hyphens only)"),
  device: deviceSchema,
  tags: z.array(z.string().min(1)).min(1, "At least one tag is required"),
  assets: assetsSchema,
  credit: creditSchema,
});

export type SceneManifestV2 = z.infer<typeof sceneManifestSchemaV2>;
