<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Demo mode is the default and is enough to exercise the product end-to-end (Spa 4h simulation, 44-car 2025 entry list). `npm run dev` serves http://localhost:3000; `/live` is the main dashboard.

Track-map **team crests** are hidden in the All-classes view so 44 markers stay readable. Filter to one class (LMP2, LMGT3, …) or click a car to show crests. Car colours are in-app simplified 2025 ELMS palettes (`src/lib/liveries`), not OpenWEC logos/photos.

Standard commands live in the README (`npm run lint`, `npm test`, `npm run typecheck`, `npm run build`). Leave `next dev` running in tmux; do not put it in the environment update script.

`next dev` rewrites the Next.js rules block at the top of this file. Keep any extra notes **below** that block so they are not wiped.
