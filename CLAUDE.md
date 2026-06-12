# Project guide

This is **tldraw-svelte** — a SvelteKit + Svelte 5 port of the tldraw
infinite-canvas editor. The active code lives in `src/`, `packages/`,
`e2e/`, and `scripts/`.

## tldraw-main/ is a read-only reference — do NOT use it as code

`tldraw-main/` is the upstream **tldraw React monorepo**, vendored here
**only** as a reference for converting tldraw behavior into Svelte.

- It is NOT a workspace, NOT built, NOT tested, NOT linted, NOT run.
- All of its config files (package.json, tsconfig, vite/vitest/playwright/
  eslint configs, lockfiles, wrangler/Docker/env) have been deleted, so it
  cannot be installed or run even by accident.
- Agents: **read and grep it freely** when porting, but never edit it,
  never restore its configs, and never run commands inside it.
- Its `AGENTS.md` describes the upstream React repo and does not apply to
  this project. See [tldraw-main/CLAUDE.md](./tldraw-main/CLAUDE.md).

When in doubt, the real project is everything **except** `tldraw-main/`.
