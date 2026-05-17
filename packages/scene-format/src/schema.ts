import { z } from "zod";

/**
 * Scene Manifest v1 — the contract between scene authors and renderers.
 *
 * A scene bundle is a manifest.json + referenced asset files (background,
 * optional overlay/reflection, thumbnail). The manifest tells the renderer
 * everything it needs to composite a user's screenshot into the scene.
 *
 * Stability promise: v1 manifests will be supported forever. Breaking
 * changes ship as v2 with a new schemaVersion. Old scenes never break.
 */

const point2DSchema = z.tuple([z.number(), z.number()], {
  description: "A 2D point in image pixel coordinates, [x, y].",
});

const screenQuadSchema = z.object({
  topLeft: point2DSchema,
  topRight: point2DSchema,
  bottomLeft: point2DSchema,
  bottomRight: point2DSchema,
});

const deviceSchema = z.object({
  type: z.enum(["phone", "tablet", "laptop", "desktop", "watch", "other"]),
  model: z.string().min(1, "Device model is required (e.g. macbook-pro-16)"),
  screenAspectRatio: z.string().regex(/^\d+:\d+$/, "Expected format like '16:10' or '19.5:9'"),
});

const assetsSchema = z.object({
  background: z.string().min(1),
  overlay: z.string().nullable(),
  reflection: z.string().nullable(),
  thumb: z.string().min(1),
});

const renderHintsSchema = z.object({
  reflectionBlendMode: z.enum(["screen", "overlay", "soft-light", "normal"]),
  reflectionOpacity: z.number().min(0).max(1),
  screenFit: z.enum(["cover", "contain", "stretch"]),
});

const creditSchema = z.object({
  author: z.string().min(1),
  license: z.string().min(1),
  sourceUrl: z.string().url().optional(),
});

export const sceneManifestSchemaV1 = z.object({
  schemaVersion: z.literal(1),
  id: z
    .string()
    .regex(/^[a-z0-9-]+\/[a-z0-9-]+$/, "Scene id must be 'collection/scene-name' in kebab-case"),
  name: z.string().min(1),
  collection: z.enum(["studio", "soft", "leather", "hands", "plants"]),
  device: deviceSchema,
  tags: z.array(z.string().min(1)).min(1, "At least one tag is required"),
  assets: assetsSchema,
  screenQuad: screenQuadSchema,
  render: renderHintsSchema,
  credit: creditSchema,
});

export type SceneManifestV1 = z.infer<typeof sceneManifestSchemaV1>;
