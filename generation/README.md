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
2. Run `pnpm --filter @mockymax/generation generate`
3. Review outputs visually
4. Move winners to `generation/output/_selected/`
5. Run `pnpm --filter @mockymax/generation mask` to generate alpha masks via SAM 3
6. Visually verify masks (each `{basename}-mask.png`)
7. Use Scene Studio (`/studio` in the web app) to author the scene bundle

## Mask generation

The mask script uses Meta's SAM 3 (`fal-ai/sam-3/image`) with prompt
`"screen of the device"`. Outputs:

- `{basename}-mask.png` — the alpha mask
- `{basename}-mask.json` — provenance: model, prompt, timestamp, cost

Idempotent — safe to re-run. Files with existing masks are skipped.

Cost: ~$0.005 per mask.

## Notes

- Outputs are gitignored — only winning scenes get committed to `scenes/`
- API key is required and stays local; never committed
- Rate-limited (1.5s sleep between calls) to be polite
