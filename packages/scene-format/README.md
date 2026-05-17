# @mockymax/scene-format

Type-safe definition and runtime validation for MockyMax scene manifests.

## What is a scene manifest?

A scene manifest is a JSON file that describes a single scene in the MockyMax library. It tells the renderer everything it needs to composite a user's screenshot into the scene: which images to load, where the device's screen lives in the background image (the four corners of the screen quad), and how to blend optional reflection/overlay layers.

## Stability

The v1 schema is stable. Future breaking changes will ship as v2 with a new `schemaVersion`. **v1 manifests are supported forever.** Old scenes will never stop working.

## Usage

```ts
import { parseSceneManifest } from "@mockymax/scene-format";

const manifest = parseSceneManifest(jsonFromDisk);
// manifest is typed as SceneManifestV1
```

For non-throwing validation:

```ts
import { safeParseSceneManifest } from "@mockymax/scene-format";

const result = safeParseSceneManifest(jsonFromDisk);
if (result.success) {
  // use result.data
} else {
  // inspect result.error.issues
}
```

## Schema reference (v1)

| Field                        | Type             | Description                                                                    |
| ---------------------------- | ---------------- | ------------------------------------------------------------------------------ |
| `schemaVersion`              | `1`              | Must be `1` for v1.                                                            |
| `id`                         | `string`         | `collection/scene-name` in kebab-case.                                         |
| `name`                       | `string`         | Human-readable scene name.                                                     |
| `collection`                 | enum             | One of: `studio`, `soft`, `leather`, `hands`, `plants`.                        |
| `device.type`                | enum             | One of: `phone`, `tablet`, `laptop`, `desktop`, `watch`, `other`.              |
| `device.model`               | `string`         | Device model identifier (e.g. `macbook-pro-16`).                               |
| `device.screenAspectRatio`   | `string`         | Format `N:M` (e.g. `16:10`).                                                   |
| `tags`                       | `string[]`       | At least one tag. Used for filtering.                                          |
| `assets.background`          | `string`         | Filename of the background plate image.                                        |
| `assets.overlay`             | `string \| null` | Optional foreground overlay (hand, object in front of device).                 |
| `assets.reflection`          | `string \| null` | Optional reflection/glare layer above the screen.                              |
| `assets.thumb`               | `string`         | Thumbnail filename.                                                            |
| `screenQuad`                 | object           | Four `[x, y]` corners of the device screen in the background image.            |
| `render.reflectionBlendMode` | enum             | Blend mode for reflection layer.                                               |
| `render.reflectionOpacity`   | `0..1`           | Reflection layer opacity.                                                      |
| `render.screenFit`           | enum             | How the screenshot fits inside the screen quad: `cover`, `contain`, `stretch`. |
| `credit.author`              | `string`         | Scene author.                                                                  |
| `credit.license`             | `string`         | License identifier (e.g. `CC-BY-NC-4.0`).                                      |
| `credit.sourceUrl`           | `string?`        | Optional source URL.                                                           |

## Example

See [`__fixtures__/macbook-concrete-01.json`](./__fixtures__/macbook-concrete-01.json) for a complete valid manifest.
