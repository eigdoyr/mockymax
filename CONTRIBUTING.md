# Contributing to MockyMax

Thanks for your interest. MockyMax is solo-maintained by [@eigdoyr](https://github.com/eigdoyr) for now, with contributions welcome under the conventions below.

## Workflow

1. **Find or open an issue** describing what you'll work on. Don't open PRs without a tracked issue — it makes the project board meaningful.
2. **Branch from `main`** using the naming convention below.
3. **Commit using conventional commits** with the right scope.
4. **Open a PR** referencing the issue (`Closes #N`). CI must pass before merge.
5. **Wait for review.** As the sole maintainer I will get to it as I can.

## Branch Naming

```
type/short-description
```

Examples: `feat/export-jpeg`, `fix/blank-screenshot`, `chore/dependabot`.

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`, `ci`.

## Commit Convention

[Conventional Commits](https://www.conventionalcommits.org) with **scopes**.

```
type(scope): short imperative summary

Optional longer body explaining what and why.

Closes #N
```

Examples:

```
feat(engine): add homography matrix computation
fix(web): handle blank screenshot upload
chore(ci): cache pnpm store
refactor(scenes): split manifest validation
```

### Scopes

| Scope    | What it covers                                         |
| -------- | ------------------------------------------------------ |
| `repo`   | Repo-level files: README, LICENSE, .gitignore, configs |
| `ci`     | GitHub Actions, workflows                              |
| `web`    | The web app in `apps/web`                              |
| `engine` | Rendering / compositing logic                          |
| `scenes` | Scene library content + manifests                      |
| `gen`    | Scene generation pipeline (Fal.ai scripts)             |
| `docs`   | Documentation site                                     |
| `deps`   | Dependency updates                                     |

## Code Style

- TypeScript strict mode. No `any` without a comment explaining why.
- Prettier handles formatting. Run `pnpm format` before committing.
- ESLint must pass. Run `pnpm lint`.
- Tests where they meaningfully catch regressions. Don't chase coverage numbers.

## Project Board

Issues live here: https://github.com/users/eigdoyr/projects/5

Milestones group issues into shippable releases (`v0.1`, `v0.2`, `v1.0`).

## Definition of Done

Before requesting merge:

- [ ] CI passes (lint, format, typecheck, build)
- [ ] No `console.log` or debug code
- [ ] No new dependencies without justification in PR description
- [ ] Issue referenced via `Closes #N` in commit or PR body

## Questions

Open a [Discussion](https://github.com/eigdoyr/mockymax/discussions) or file an issue.
