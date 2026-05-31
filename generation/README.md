# Generation

Batch image generation pipeline for MockyMax scenes.

## Setup

1. Copy `.env.example` to `.env` and add your Fal.ai key:

```bash
   cp .env.example .env
```

Get a key at https://fal.ai/dashboard/keys.

2. Edit `prompts.json` to define what to generate.

## Run

From repo root:

```bash
pnpm --filter @mockymax/generation generate
```

Outputs land in `generation/output/{collection}/`.

Each generation produces:

- `{id}-{seed}.jpg` — the image
- `{id}-{seed}.json` — provenance: prompt, seed, timestamp, source URL

## Prompt schema

```json
{
  "schemaVersion": 1,
  "prompts": [
    {
      "id": "scene-id",
      "collection": "studio | soft | leather | hands | plants",
      "prompt": "Full prompt text",
      "aspectRatio": "16:9"
    }
  ]
}
```

## Cost

~$0.06 per image (Flux Pro 1.1 Ultra).

## Approach validation

v0.2 prompt approach was validated by issue #34 (viability test). See `docs/v0.2-viability-test.md` for keep rates per device category and the principles that came out of it.

Key takeaway: editorial-fashion language ("Kinfolk Magazine still life, chiaroscuro lighting, body fragment") works substantially better than product-photography language ("8k, photorealistic, professional product photography") for hitting an editorial mood.

## Workflow

1. Add prompts to `prompts.json`
2. Run the script
3. Review outputs visually
4. Pick winners
5. Use Scene Studio (`/studio` in the web app) to author the scene bundle from the winning image

## Notes

- Outputs are gitignored — only winning scenes get committed to `scenes/`
- API key is required and stays local; never committed
- Rate-limited (1.5s sleep between calls) to be polite
