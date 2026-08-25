<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Demo mode is the default and is enough to exercise the product end-to-end (Spa 4h simulation, 44-car 2025 entry list). `npm run dev` serves http://localhost:3000; `/live` is the main dashboard.

Track-map markers are **livery-coloured circles with numbers**. Rounded livery chips and team-crest monograms appear in the timing tower, battle view, map selection panel, and car page. Colours follow Racing Sports Cars appearance notes (`src/lib/liveries`); the official weekend photo source is the ELMS Spotter Guide PDF on each race page. `/track` is the in-person weekend helper (timetable + ticket comparison).

Standard commands live in the README (`npm run lint`, `npm test`, `npm run typecheck`, `npm run build`). Leave `next dev` running in tmux; do not put it in the environment update script.

`next dev` rewrites the Next.js rules block at the top of this file. Keep any extra notes **below** that block so they are not wiped.
