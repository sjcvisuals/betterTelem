/** Time / gap formatting helpers shared by the UI. */

/** 95.482 -> "1:35.482"; 3601.2 -> "1:00:01.2" (laps never reach an hour in practice). */
export function formatLapTime(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds - mins * 60;
  const secsStr = secs.toFixed(3).padStart(6, "0");
  return `${mins}:${secsStr}`;
}

/** 14.278 -> "14.3s"; 125.4 -> "2m 05s". Used for gaps in prose. */
export function formatGap(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds - mins * 60);
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

/** 5025 -> "01:23:45". */
export function formatClock(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "--:--:--";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

/** 0.42 -> "0.4s/lap". */
export function formatRate(secondsPerLap: number | null | undefined): string {
  if (secondsPerLap == null || !Number.isFinite(secondsPerLap)) return "—";
  return `${Math.abs(secondsPerLap).toFixed(1)}s/lap`;
}

export function driverDisplayName(firstName: string, lastName: string): string {
  const last = lastName
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (m) => m.toUpperCase());
  return `${firstName} ${last}`;
}
