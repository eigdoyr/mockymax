# MockyMax

Free, open-source mockup generator. Drop a screenshot, get a premium device mockup.

> **Status:** v0.2.5 — Alpha Mask Architecture. 14 scenes shipped. Hosting setup pending.

## What it does

Pick a hand-curated scene from the gallery, upload your screenshot, get a polished product mockup ready to use on landing pages, social posts, or pitch decks. No signup, no watermark, no rate limit.

Scenes include partial-visibility compositions (phone in pocket, laptop in alcove) and front-facing layouts (monitor on linen, tablet on book). All scenes are open taxonomy — `studio`, `body`, `tactile`, `soft` collections at launch.

## How it works

Each scene is a background image plus an alpha mask that defines the screen region. The compositor uses the mask to blend your screenshot through the screen area, naturally supporting rounded corners, perspective, and partial visibility. This is the same approach used by Photoshop Smart Object mockups and premium tools like Mockuuups Studio.

Masks are generated automatically using Meta's SAM 3 segmentation model via Fal.ai, then optionally hand-refined.

## Quick start

### Use the hosted app

Deployment URL coming soon. The app will be hosted on Cloudflare Pages.

### Run locally

Requires Node 22+ and pnpm 11+.

    git clone https://github.com/eigdoyr/mockymax.git
    cd mockymax
    pnpm install
    pnpm --filter web dev

Open `http://localhost:5173`.

## Project structure

    mockymax/
    ├── apps/web/              # Vite + React + TanStack Router app
    ├── packages/
    │   ├── scene-format/      # Manifest schema (Zod)
    │   └── render-core/       # Alpha-mask compositor (WebGL + CPU)
    ├── generation/            # Scene generation pipeline (Fal.ai)
    ├── scenes/                # Shipped scene library
    └── docs/                  # Architecture and decision records

## Architecture

See `docs/v0.2.5-architecture-pivot.md` for the pivot from quad-based homography compositing to alpha-mask compositing. See `docs/known-issues.md` for current limitations.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All work goes through GitHub Issues + Pull Requests with conventional commits.

## License

- **Code:** [MIT](./LICENSE)
- **Scenes (image assets):** [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — free for personal and editorial use; commercial use requires permission.

The dual license lets developers freely fork the engine while keeping the curated scene library available for non-commercial use.

## Built by

[eigdoyr](https://github.com/eigdoyr).
