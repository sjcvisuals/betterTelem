# OpenWEC API

This document describes the [OpenWEC](https://openwec.com) REST API as used by betterTelem.
It was written against the live OpenAPI 3.1 spec served at
`https://api.openwec.com/openapi.json` (API version `0.1.0`) and verified with live requests
against the ELMS 2025 season (August 2026).

- Interactive reference: <https://api.openwec.com/docs>
- Base URL: `https://api.openwec.com/api/v1`
- All endpoints are `GET` (plus one `POST` for requesting an API key)
- All responses are JSON

## Authentication

Two tiers:

| Tier | Endpoints | Auth |
| --- | --- | --- |
| Public | series, seasons, events, sessions, season stats, session results, driver profiles/results, team profiles/history | none |
| Protected | laps, stints, pace, gaps, pit-window, race-control, driver consistency | `X-API-Key` header |

Keys are requested via `POST /api/v1/api-keys/request` (`{name, email, intended_use}`).
The key is returned immediately but **stays inactive until manually approved** by the
maintainer, so a key cannot be provisioned fully automatically.

betterTelem keeps the key server-side only (`OPENWEC_API_KEY` env var, used inside
Next.js route handlers). It is never shipped to the browser.

Calling a protected endpoint without a key returns:

```json
{ "detail": "Missing API key. Pass X-API-Key header." }
```

## Navigation endpoints (public)

### `GET /series`

Lists available series. Verified live response includes ELMS:

```json
[
  { "id": 1, "key": "WEC",       "name": "FIA World Endurance Championship" },
  { "id": 2, "key": "ELMS",      "name": "European Le Mans Series" },
  { "id": 3, "key": "ALMS",      "name": "Asian Le Mans Series" },
  { "id": 4, "key": "LEMANSCUP", "name": "Michelin Le Mans Cup" },
  { "id": 5, "key": "IMSA",      "name": "IMSA WeatherTech SportsCar Championship" }
]
```

### `GET /series/{series_key}/seasons`

Seasons per series (`SeasonOut`: `id`, `raw_id`, `year`, `label`). ELMS coverage: 2012–2026.

### `GET /series/{series_key}/seasons/{year}/events`

Events per season (`EventOut`: `id`, `raw_id`, `name`, `round`). Example ELMS 2025:
`BARCELONA-CATALUNYA`, `PAUL RICARD`, `IMOLA`, `SPA FRANCORCHAMPS`, `SILVERSTONE`,
`AUTODROMO DO ALGARVE` (plus round 0 official test).

Event names are circuit names in upper case — there is no separate "circuit" field, so
betterTelem uses the event name as the circuit.

### `GET /series/{series_key}/seasons/{year}/events/{event_id}/sessions`

Sessions per event (`SessionOut`):

| Field | Notes |
| --- | --- |
| `id` | numeric session id used by all data endpoints |
| `raw_id` | e.g. `202508241300_Race` |
| `name` | e.g. `Race`, `Free Practice 1`, `Qualifying Practice - LMGT3` |
| `session_type` | `Race`, `Practice`, `Qualifying`, `Test` |
| `session_at` | UTC start, e.g. `2025-08-24 13:00:00+00` (space-separated, `+00` offset) |
| `imsa_series`, `snapshot_hour` | IMSA-only, `null` for ELMS |

### `GET /events/{event_id}`

Event detail with sessions grouped, including `series`, `season`, `round`, and per-session
`result_count` / `lap_count` (useful for detecting whether data has landed for a session).

### `GET /sessions/{session_id}`

Single session details (same shape as `SessionOut`).

## Results (public)

### `GET /sessions/{session_id}/results`

Classification for a session. Array of `ResultOut`:

| Field | Type | Notes |
| --- | --- | --- |
| `position` | int \| null | overall classification |
| `car_number` | string | e.g. `"43"` |
| `car_class` | string \| null | ELMS values observed: `LMP2`, `LMP2 Pro/Am`, `LMP3`, `LMGT3` |
| `vehicle` | string \| null | e.g. `Oreca 07 - Gibson` |
| `team` | string \| null | e.g. `Inter Europol Competition` |
| `tyre_supplier` | string \| null | observed `null` for ELMS 2025 |
| `status` | string | e.g. `Classified` |
| `laps_completed` | int \| null | |
| `total_time_s` | number \| null | |
| `gap_to_first_s` | number \| null | `null` for the winner |
| `fl_lap_number` / `fl_time_s` / `fl_kph` | fastest-lap info | |
| `drivers` | `DriverSlot[]` | `{slot, first_name, last_name, country, imsa_rating}` |

betterTelem uses this endpoint as the **entry list** source (car number, team, vehicle,
class, drivers) because it is public.

## Laps (protected)

### `GET /sessions/{session_id}/laps?car=&page=&page_size=`

Paginated lap-by-lap data (`PaginatedLaps` wrapper: `session_id`, `car_number`, `total`,
`page`, `page_size`, `results`). Max `page_size` is 500.

### `GET /sessions/{session_id}/laps/{car_number}`

All laps for one car. `LapOut` fields:

| Field | Type | Notes |
| --- | --- | --- |
| `car_number` | string | |
| `driver_name` | string \| null | driver on that lap (endurance-specific) |
| `lap_number` | int | |
| `lap_time_s` | number \| null | |
| `s1_s`, `s2_s`, `s3_s` | number \| null | sector times |
| `kph`, `top_speed_kph` | number \| null | |
| `lap_improvement` | bool | |
| `crossing_finish_in_pit` | bool | lap ended in the pit lane (in-lap) |
| `flag_at_fl` | string \| null | track flag at the finish line for that lap (e.g. green / FCY / SC) |
| `pit_time_s` | number \| null | pit stop duration when applicable |
| `elapsed_raw` | string \| null | cumulative race time as raw string |
| `hour_raw` | string \| null | wall-clock time as raw string |

`flag_at_fl`, `crossing_finish_in_pit`, `pit_time_s` and `elapsed_raw` are the key inputs
for representative-lap filtering, stint reconstruction and gap analysis.

## Analytics endpoints (protected)

### `GET /sessions/{session_id}/stints?car=&car_class=`

Stint breakdown per car (`StintOut`): `car_number`, `car_class`, `team`, `stint_number`,
`start_lap`, `end_lap`, `lap_count`, `tyre_age_laps`, `baseline_pace_s`,
`degradation_s_per_lap`, `consistency_s`, `is_final_stint`.

### `GET /sessions/{session_id}/pace?car_class=`

Average green-flag pace per car, fastest first (`PaceOut`): `total_laps`,
`green_flag_laps`, `pit_stops`, `best_lap_s`, `avg_pace_s`, `consistency_s`.

### `GET /sessions/{session_id}/gaps?car_class=&car=&max_laps=`

Gap evolution as cumulative lap time per car per lap (`GapPoint`): `lap_number`,
`car_number`, `car_class`, `lap_time_s`, `cumulative_s`. `max_laps` caps at 500.

### `GET /sessions/{session_id}/pit-window?car=&car_class=&pit_loss_s=`

Estimated pit window per stint per car (`CarPitWindow` with `StintPitWindow[]`):
`pit_loss_s`, per-stint `early_lap` / `ideal_lap` / `late_lap` (relative and `_abs`
variants) and a `recommendation` string. Based on degradation rate vs pit loss.

### `GET /sessions/{session_id}/race-control`

Detected safety car / FCY periods (`RaceControlPeriod`): `flag`, `label`, `start_lap`,
`end_lap`, `duration_laps`. Derived from the most common `flag_at_fl` across cars per lap.
Note: lap-indexed, not timestamped.

### `GET /drivers/{driver_id}/consistency?series=&session_type=&limit=`

Cross-session consistency stats for a driver (not currently used by betterTelem).

## Drivers & teams (public)

- `GET /drivers/{driver_id}` — `DriverProfile` (career summary)
- `GET /drivers/{driver_id}/results?series=&limit=` — `DriverResult[]`
- `GET /teams/{team_id}` — `TeamProfile`
- `GET /teams/{team_id}/history?series=&limit=` — `TeamSeasonEntry[]`

Note: session results embed drivers **by name only** (`DriverSlot` has no id), so linking
a session driver to a `driver_id` requires a separate lookup that the API does not
currently expose (no search endpoint in the spec).

## Polling / update behavior

- The API is a request/response REST API. There is **no websocket, SSE, or push channel**
  and no "current live session" discovery endpoint in the spec.
- Data for a session accumulates in the same endpoints (`laps`, `stints`, ...) — a client
  follows a live session by re-polling them and diffing.
- No documented rate limit was found; betterTelem polls conservatively:
  one snapshot refresh every **15 seconds** in live mode (a full lap in ELMS takes
  ≥ ~90 s, so this loses no information), with request deduplication, retry with
  exponential backoff, and stale-feed detection on top.

## Example normalized objects used by betterTelem

External responses are validated with Zod (`src/lib/openwec/schemas.ts`) and normalized
(`src/lib/openwec/normalize.ts`) into internal types (`src/lib/race/types.ts`), e.g.:

```ts
type Car = {
  carNumber: string        // ResultOut.car_number
  team: string             // ResultOut.team ?? "Unknown team"
  vehicle: string | null   // ResultOut.vehicle
  className: string        // ResultOut.car_class ?? "UNKNOWN"
  drivers: { firstName: string; lastName: string; slot: number }[]
}

type Lap = {
  carNumber: string
  lapNumber: number             // LapOut.lap_number
  lapTimeSeconds: number | null // LapOut.lap_time_s
  flag: "GREEN" | "YELLOW" | "FCY" | "SC" | "RED" | "CHEQUERED" | "UNKNOWN"
                                // parsed from LapOut.flag_at_fl
  endedInPit: boolean           // LapOut.crossing_finish_in_pit
  pitTimeSeconds: number | null // LapOut.pit_time_s
  driverName: string | null     // LapOut.driver_name
  elapsedSeconds: number | null // parsed from LapOut.elapsed_raw
}
```

## Limitations and gaps (and how betterTelem handles them)

| Missing in OpenWEC | Impact | Handling |
| --- | --- | --- |
| No push/live feed or "session in progress" flag | Live mode must poll and infer liveness | Poll every 15 s; feed is marked stale when no new lap arrives for > 3 minutes |
| Protected endpoints need a manually-approved key | Laps/stints unavailable without approval | Demo mode is fully functional without a key; live mode degrades to entry list + classification via public `results` |
| No time-remaining / race clock endpoint | Cannot show official remaining time in live mode | Derived from `session_at` + assumed 4 h ELMS race length, labeled as estimate |
| No tyre compound, fuel, or weather data | Cannot make tyre/fuel claims | UI never claims tyre compound or fuel state; stint age is used instead |
| No team logos, livery photos or GPS | Cannot show official artwork or true track position | Track map uses estimated lap progress and a simplified in-app livery palette; crests are monograms, not official logos |
| Race-control periods are lap-indexed, not timestamped | FCY timing is approximate | Periods are mapped to laps, matching how the timing tower reasons |
| `tyre_supplier`, `country`, `imsa_rating` observed `null` for ELMS | Cosmetic | Fields hidden when null |
| No overall/class position per lap | Position history must be computed | Positions are derived from cumulative elapsed time per lap crossing |
| No driver→id mapping from session results | No driver profile links from the dashboard | Driver names shown as text only |

## Verified sample identifiers (useful for development)

- Series key: `ELMS`
- ELMS 2025 season: year `2025`
- Event 202: `SPA FRANCORCHAMPS`, round 4 (ELMS 2025)
- Session 1960: the 4 Hours of Spa race (`202508241300_Race`, 88 laps, 44 finishers)
- Real entry sample: `#48 VDS Panis Racing` (LMP2 winner), `#43 Inter Europol Competition`
