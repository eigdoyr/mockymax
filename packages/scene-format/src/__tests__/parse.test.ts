import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseSceneManifest, safeParseSceneManifest } from "../parse.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixture = JSON.parse(
  readFileSync(join(__dirname, "../../__fixtures__/display-concrete-01.json"), "utf8"),
);

describe("parseSceneManifest", () => {
  it("parses the canonical v2 fixture", () => {
    const result = parseSceneManifest(fixture);
    expect(result.schemaVersion).toBe(2);
    expect(result.id).toBe("studio/display-concrete-01");
    expect(result.assets.mask).toBe("mask.webp");
  });

  it("rejects a v1 manifest", () => {
    const v1 = { ...fixture, schemaVersion: 1 };
    expect(() => parseSceneManifest(v1)).toThrow();
  });

  it("rejects manifest with missing mask asset", () => {
    const broken = {
      ...fixture,
      assets: { background: "bg.webp", thumb: "thumb.webp" },
    };
    expect(() => parseSceneManifest(broken)).toThrow();
  });

  it("rejects malformed scene id", () => {
    const broken = { ...fixture, id: "not_a_valid_id" };
    expect(() => parseSceneManifest(broken)).toThrow();
  });

  it("rejects empty tags array", () => {
    const broken = { ...fixture, tags: [] };
    expect(() => parseSceneManifest(broken)).toThrow();
  });

  it("rejects malformed collection (uppercase)", () => {
    const broken = { ...fixture, collection: "Studio" };
    expect(() => parseSceneManifest(broken)).toThrow();
  });

  it("accepts new collection names not in the old enum", () => {
    const ok = { ...fixture, collection: "monochrome" };
    expect(() => parseSceneManifest(ok)).not.toThrow();
  });
});

describe("safeParseSceneManifest", () => {
  it("returns success for valid input", () => {
    const result = safeParseSceneManifest(fixture);
    expect(result.success).toBe(true);
  });

  it("returns failure for invalid input without throwing", () => {
    const result = safeParseSceneManifest({ not: "valid" });
    expect(result.success).toBe(false);
  });
});
