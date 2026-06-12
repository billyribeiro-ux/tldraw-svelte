# tldraw-main — READ-ONLY REFERENCE, NOT ACTIVE CODE

This folder is the upstream **tldraw** React monorepo, vendored into this
repo **for analysis and porting only**. It exists so agents can read and
grep tldraw's source when converting its behavior into the SvelteKit
project under `../src` and `../packages`.

It is NOT part of this project's build, test, lint, or runtime:

- All config files have been **deleted** (no `package.json`, `tsconfig`,
  `vite`/`vitest`/`playwright`/`eslint` configs, lockfiles, `wrangler.toml`,
  Dockerfiles, etc.). This tree **cannot be installed, built, or run** —
  by design. Do not try.
- Do not edit, build, run, or restore configs for these files. Read only.

The upstream agent guide is preserved at [`AGENTS.md`](./AGENTS.md) for
reference, but its instructions (yarn workspaces, `yarn dev`, `yarn build`,
etc.) describe the **upstream React repo** and do **NOT** apply to this
SvelteKit project. It is intentionally NOT imported here (the previous
`@AGENTS.md` import was removed so those rules stop loading as active
session instructions).

The active project rules live in the repo-root `CLAUDE.md`.
