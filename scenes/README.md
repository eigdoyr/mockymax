# Scenes

The MockyMax scene library. Each scene is a folder containing a `manifest.json` and its image assets.

## Structure

```
scenes/
├── library.json          # Index of all available scenes
├── studio/               # Collection
│   └── macbook-concrete-01/
│       ├── manifest.json
│       ├── background.webp
│       ├── reflection.webp
│       └── thumb.webp
├── soft/
├── leather/
├── hands/
└── plants/
```

## Adding a scene

1. Pick the right collection folder
2. Create a kebab-case folder for your scene
3. Add `manifest.json` matching the v1 schema (`@mockymax/scene-format`)
4. Add the referenced image assets
5. Add an entry to `library.json`

See `packages/scene-format/README.md` for the manifest schema.

## License

Scenes are licensed CC BY-NC 4.0.
