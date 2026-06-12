# tldraw-main — READ-ONLY REFERENCE, NOT ACTIVE CODE

This folder is the upstream **tldraw** React monorepo, vendored into this
repo **for analysis and porting only**. It is NOT part of this project's
build, test, lint, or runtime. Do not build it, run it, install its
dependencies, or edit its files.

Agents: use this tree as a **read reference** when converting tldraw
behavior into the Svelte port under `../src` and `../packages`. Read and
grep freely; do not modify.

The upstream agent guide is preserved at [`AGENTS.md`](./AGENTS.md) for
reference, but its instructions (yarn workspaces, `yarn dev`, `yarn build`,
etc.) describe the **upstream React repo** and do **NOT** apply to this
SvelteKit project. It is intentionally NOT imported here (the previous
`@AGENTS.md` import was removed so those rules stop loading as active
session instructions).

The active project rules live in the repo-root `CLAUDE.md`.
