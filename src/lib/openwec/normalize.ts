import type {
  Car,
  Lap,
  RaceControlPeriod,
  TrackFlag,
} from "@/lib/race/types";
import type { LapOut, RaceControlPeriodOut, ResultOut } from "./schemas";

/**
 * Normalization layer: raw OpenWEC responses -> internal domain types.
 * Nothing outside src/lib/openwec should touch raw API field names.
 */

export function normalizeFlag(raw: string | null | undefined): TrackFlag {
  if (!raw) return "UNKNOWN";
  const value = raw.trim().toUpperCase();
  if (value.includes("FCY") || value.includes("FULL COURSE")) return "FCY";
  if (value === "SC" || value.includes("SAFETY")) return "SC";
  if (value.includes("RED")) return "RED";
  if (value.includes("CHK") || value.includes("CHEQ") || value.includes("CHECK")) {
    return "CHEQUERED";
  }
  if (value.includes("YELLOW") || value === "YF" || value === "Y") return "YELLOW";
  if (value.includes("GREEN") || value === "GF" || value === "G") return "GREEN";
  return "UNKNOWN";
}

/**
 * Parses OpenWEC raw elapsed strings such as "1:23:45.678", "23:45.678"
 * or plain seconds into seconds.
 */
export function parseElapsed(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;
  const parts = text.split(":");
  if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) return null;
  const numbers = parts.map(Number);
  let seconds = 0;
  for (const value of numbers) seconds = seconds * 60 + value;
  return Number.isFinite(seconds) ? seconds : null;
}

/**
 * Parses OpenWEC session timestamps like "2025-08-24 13:00:00+00" into epoch
 * ms. Date.parse rejects the space separator and the bare "+00" offset.
 */
export function parseSessionStartMs(raw: string | null | undefined): number | null {
  if (!raw) return null;
  let text = raw.trim().replace(" ", "T");
  text = text.replace(/([+-]\d{2})$/, "$1:00");
  const ms = Date.parse(text);
  return Number.isFinite(ms) ? ms : null;
}

export function normalizeCar(result: ResultOut): Car {
  return {
    carNumber: result.car_number,
    team: result.team ?? "Unknown team",
    vehicle: result.vehicle,
    className: result.car_class ?? "UNKNOWN",
    drivers: result.drivers.map((d) => ({
      slot: d.slot,
      firstName: d.first_name,
      lastName: d.last_name,
    })),
  };
}

export function normalizeLap(lap: LapOut): Lap {
  return {
    carNumber: lap.car_number,
    lapNumber: lap.lap_number,
    lapTimeSeconds: lap.lap_time_s,
    flag: normalizeFlag(lap.flag_at_fl),
    endedInPit: lap.crossing_finish_in_pit,
    pitTimeSeconds: lap.pit_time_s,
    driverName: lap.driver_name,
    elapsedSeconds: parseElapsed(lap.elapsed_raw),
  };
}

export function normalizeRaceControl(period: RaceControlPeriodOut): RaceControlPeriod | null {
  const flag = normalizeFlag(period.flag);
  if (flag === "GREEN" || flag === "UNKNOWN") return null;
  return {
    flag,
    label: period.label,
    startLap: period.start_lap,
    endLap: period.end_lap,
  };
}

/** Groups laps by car and sorts by lap number, filling in elapsed when derivable. */
export function groupLapsByCar(laps: Lap[]): Record<string, Lap[]> {
  const byCar: Record<string, Lap[]> = {};
  for (const lap of laps) {
    (byCar[lap.carNumber] ??= []).push(lap);
  }
  for (const carLaps of Object.values(byCar)) {
    carLaps.sort((a, b) => a.lapNumber - b.lapNumber);
    // Derive missing cumulative elapsed from lap times when possible.
    let cumulative = 0;
    let cumulativeValid = true;
    for (const lap of carLaps) {
      if (lap.lapTimeSeconds == null) {
        cumulativeValid = false;
      } else {
        cumulative += lap.lapTimeSeconds;
      }
      if (lap.elapsedSeconds == null && cumulativeValid) {
        lap.elapsedSeconds = cumulative;
      } else if (lap.elapsedSeconds != null) {
        cumulative = lap.elapsedSeconds;
        cumulativeValid = true;
      }
    }
  }
  return byCar;
}
