# betterTelem

**A beginner-friendly live race companion for the European Le Mans Series (ELMS),
powered by [OpenWEC](https://openwec.com) data.**

betterTelem is not a clone of the official timing screen. It translates raw timing,
stint, pit-stop, gap, pace and race-control data into clear visual explanations:

- Who is actually winning **each class** (class position first, always)
- Which cars are fighting each other, and who is faster right now
- Which cars are on different pit cycles, and who still owes a stop
- What is likely to happen after the next pit-stop cycle ("Effective Position")
- Why a position changed, and what an FCY / Safety Car / pit stop means strategically

Every derived number is labeled **FACT** (observed in timing data), **TREND**
(derived from several laps) or **ESTIMATE** (a projection that may not happen).

## Screens

| Route | Purpose |
| --- | --- |
| `/live` | Main dashboard: race header, YouTube stream embed, estimated track map with livery-coloured number circles, class-first timing tower, battle to watch, pit-cycle strategy view, "What just happened?" feed, race timeline |
| `/car/[carNumber]` | One car: lap chart, gap-to-leader chart, position history, stint breakdown, events, auto-generated plain-language summary |
| `/class/[className]` | Second-screen view for one class (e.g. `/class/LMP2`, `/class/LMGT3`); class names are URL-encoded (`/class/LMP2%20Pro%2FAm`) |

## Local setup

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local   # optional — demo mode works with no key
npm run dev                  # http://localhost:3000
```

The app opens in **DEMO mode** by default: a deterministic simulated 4-hour ELMS race
at Spa-Francorchamps using the real 2025 4 Hours of Spa entry list (public OpenWEC
data) with synthesized timing. No live event or API key is needed to develop or demo.

### Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm test` | Unit/integration tests (Vitest) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

### Environment variables

See `.env.example`:

| Variable | Purpose |
| --- | --- |
| `OPENWEC_API_KEY` | Enables OpenWEC's protected endpoints (laps, stints, race control) in LIVE mode. Request at [openwec.com/api-keys](https://openwec.com/api-keys) — keys need manual approval before activation. Used **server-side only**; never shipped to the browser. |
| `OPENWEC_BASE_URL` | Optional override of the API base URL |

Without a key, LIVE mode still works with public data (entry list + classification)
and clearly explains what is missing. DEMO mode is unaffected.

## OpenWEC API

Endpoints, schemas, auth and limitations are documented in
[`docs/openwec-api.md`](docs/openwec-api.md), written against the live OpenAPI spec
and verified with real requests. Summary:

- **Public** (no key): series → seasons → events → sessions navigation, session
  results, driver/team profiles
- **Protected** (`X-API-Key`): lap-by-lap data, stints, pace, gaps, pit windows,
  race-control periods
- No push/live channel: live following = polling (betterTelem polls every 15 s in
  LIVE mode, with caching, deduplication, retry with backoff, and stale-feed
  detection)

## Architecture

```
src/
  app/                     Next.js App Router pages + API routes
    api/snapshot           full derived race snapshot (demo or live)
    api/car/[carNumber]    per-car chart data + summary
    api/elms/*             ELMS season/event/session navigation (public data)
  lib/
    openwec/               API client (server-only), Zod schemas, normalization
    race/                  internal domain types + formatting helpers
    analytics/             derived racing logic (pure, tested)
      representative-laps  which laps are trusted for pace analysis
      pace                 rolling pace windows (3/5/10 laps)
      standings            positions + gaps from lap-crossing times
      battles              battle detection + conservative catch estimates
      stint-analysis       stint reconstruction, typical stint, pit loss measurement
      pit-window           plain-language pit status
      effective-position   projected order after the pit cycle (ESTIMATE)
      explanations         the "What just happened?" event engine
      snapshot             assembles everything into one RaceSnapshot
    demo/                  deterministic simulated race + scenario presets
    live/                  live-mode data provider (OpenWEC → RaceData)
  components/              UI (timing tower, battle view, strategy, events, charts)
```

Key design decision: demo and live modes converge on one internal type
(`RaceData`) before any analytics run, so **every calculation and UI path is
identical in both modes**. The demo replay clock lives on the client; the server
is stateless and answers "what did the race look like at time T?"

## Analytics methodology

- **Representative laps**: green-flag laps only; pit in-laps, out-laps, caution laps,
  lap 1, laps with missing times and laps slower than 107% of the car's median are
  excluded.
- **Recent pace**: average of the last N representative laps (default 5; 3/10
  windows available in code).
- **Gaps**: measured at the last lap crossing both cars completed (standard timing
  convention); whole laps shown when cars are on different laps.
- **Catch estimates**: least-squares slope over the last 6 common laps, only shown
  when the trend is stable (outlier-guarded, ≥ 4 laps, consistent direction) and the
  closing rate is meaningful (≥ 0.15 s/lap).
- **Pit loss**: measured from data — median of (in-lap + out-lap − 2 × typical lap)
  over green-flag stops; 75 s fallback until enough stops exist.
- **Effective Position** (ESTIMATE): remaining stops per car are inferred from stint
  age vs typical stint length and remaining race time; each owed stop adds one
  measured pit loss to the car's deficit; cars are re-ranked on the adjusted
  deficit. Confidence is reported (LOW until enough completed stints exist) and no
  estimate is shown early in the race or in the final laps.
- **Never claimed**: tyre compound, fuel load, fuel saving, tyre degradation as fact
  — OpenWEC does not provide the data to support them.

## Demo / development mode

- Deterministic seeded simulation (same race every run) — testable and stable.
- Scenario jumps: race start, green running, FCY, Safety Car, pit cycle, final hour,
  finish, stale feed. Replay speed 1×–60×, pausable.
- The simulation includes green-flag stops, FCY opportunistic stops, safety-car
  bunching, driver changes, two retirements, a car with intermittently missing lap
  times, and scripted caution periods — so every UI state is reachable without a
  live race.

## Known limitations

- OpenWEC has no push feed and no "session live now" flag; live mode polls and
  marks the feed stale after 3 minutes without new laps.
- Protected OpenWEC endpoints require a manually-approved API key; without one,
  live mode degrades to entry list + classification.
- Race time remaining in live mode is derived from the session start time and the
  4-hour ELMS format, not an official clock.
- Race-control periods from OpenWEC are lap-indexed, not timestamped.
- Effective Position is an estimate and clearly labeled as such; it does not model
  traffic, tyre warm-up, or fuel-flow differences.

## Attribution & licensing

- Timing data: [OpenWEC](https://openwec.com). Underlying timing originates from
  series timing providers; treat it as personal-use data.
- betterTelem is an independent, unofficial project. It is not affiliated with or
  endorsed by the European Le Mans Series, the FIA WEC, or their timing partners.
  Do not present it as an official timing product.

## Deployment

Standard Next.js deployment:

```bash
npm run build
npm start        # or deploy to Vercel/any Node host
```

Set `OPENWEC_API_KEY` in the host's environment (server-side secret) to enable full
live mode. No other services are required.
