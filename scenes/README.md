# Scenes

The MockyMax scene library. Each scene is a folder containing a `manifest.json` and its image assets.

## Structure

    scenes/
    ├── library.json          # Index of all available scenes
    ├── studio/               # Clean neutral surfaces (concrete, oak, linen, stone, paper)
    │   └── monitor-linen/
    │       ├── manifest.json
    │       ├── background.webp
    │       ├── mask.png
    │       └── thumb.webp
    ├── body/                 # Body context (hand, wrist, pocket)
    ├── tactile/              # Leather and warm tactile materials
    └── soft/                 # Fabric textures (sweater, wool)

## Adding a scene

The recommended workflow is the batch script (`generation/scripts/bundle.ts`). For one-off scenes, use the in-app Scene Studio at `/studio`.

### Batch (recommended for multiple scenes)

1. Add an entry to `generation/scenes-config.json`
2. Drop the source image and its mask into `generation/output/_selected/`
3. Run `pnpm --filter @mockymax/generation bundle`

### Manual via Scene Studio

1. Visit `/studio` in the running app
2. Drop a background and its mask
3. Fill the metadata form
4. Download the bundle ZIP
5. Unzip into `scenes/{collection}/{name}/`
6. Append to `scenes/library.json`

See `packages/scene-format/src/schema.ts` for the v2 manifest schema.

## Collections

Collections are open taxonomy — any kebab-case string is valid. Launch collections:

- `studio` — clean neutral surfaces
- `body` — body context scenes (hand, wrist, pocket)
- `tactile` — leather and warm tactile materials
- `soft` — fabric textures

New collections welcome via the same workflow.

## License

Scene image assets are licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). The schema definitions and code remain MIT.
