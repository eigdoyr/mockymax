import { sceneManifestSchemaV1, type SceneManifestV1 } from "./schema.js";

/**
 * Parse and validate an unknown value against the v1 scene manifest schema.
 *
 * Returns a typed result on success. Throws a ZodError on failure with
 * detailed information about which fields are invalid.
 *
 * For graceful handling without exceptions, use `safeParseSceneManifest`.
 */
export function parseSceneManifest(input: unknown): SceneManifestV1 {
  return sceneManifestSchemaV1.parse(input);
}

/**
 * Same as `parseSceneManifest` but returns a discriminated union instead
 * of throwing. Useful when validating user-submitted scenes or scene
 * bundles fetched from a CDN.
 */
export function safeParseSceneManifest(input: unknown) {
  return sceneManifestSchemaV1.safeParse(input);
}
