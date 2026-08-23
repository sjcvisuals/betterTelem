"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CarDetailResponse } from "./race-provider";
import { formatLapTime, formatGap } from "@/lib/race/format";

/** Recharts wrappers for the car detail page (dark broadcast styling). */

const AXIS = { stroke: "var(--muted)", fontSize: 11 } as const;
const GRID = { stroke: "var(--border)", strokeDasharray: "3 3" } as const;

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--foreground)",
  },
  labelStyle: { color: "var(--muted)" },
} as const;

export function LapTimeChart({ detail }: { detail: CarDetailResponse["detail"] }) {
  const data = detail.lapChart
    .filter((lap) => lap.lapTimeSeconds != null && !lap.endedInPit)
    .map((lap) => ({
      lapNumber: lap.lapNumber,
      lapTime: lap.lapTimeSeconds,
      flag: lap.flag,
    }));
  const green = data.filter((d) => d.flag === "GREEN").map((d) => d.lapTime as number);
  const min = green.length ? Math.min(...green) : 90;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="lapNumber" {...AXIS} tickLine={false} />
        <YAxis
          {...AXIS}
          tickLine={false}
          domain={[Math.floor(min - 2), Math.ceil(min * 1.12)]}
          tickFormatter={(v: number) => formatLapTime(v).slice(0, -4)}
          width={48}
          allowDataOverflow
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value) => [formatLapTime(value as number), "Lap time"]}
          labelFormatter={(label) => `Lap ${label}`}
        />
        <Line
          type="monotone"
          dataKey="lapTime"
          stroke="var(--accent)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        {detail.stints
          .filter((s) => !s.inProgress)
          .map((s) => {
            const point = data.find((d) => d.lapNumber === s.endLap + 1);
            return point ? (
              <ReferenceDot
                key={s.stintNumber}
                x={point.lapNumber}
                y={point.lapTime as number}
                r={3}
                fill="var(--flag-yellow)"
                stroke="none"
              />
            ) : null;
          })}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GapChart({ detail }: { detail: CarDetailResponse["detail"] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={detail.gapToClassLeader} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="lapNumber" {...AXIS} tickLine={false} />
        <YAxis
          {...AXIS}
          tickLine={false}
          width={48}
          tickFormatter={(v: number) => formatGap(v)}
          reversed
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value) => [formatGap(value as number), "Behind class leader"]}
          labelFormatter={(label) => `Lap ${label}`}
        />
        <Line
          type="monotone"
          dataKey="gapSeconds"
          stroke="var(--trend-up)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PositionChart({ detail }: { detail: CarDetailResponse["detail"] }) {
  const maxPosition = Math.max(4, ...detail.positionHistory.map((p) => p.classPosition));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={detail.positionHistory} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="lapNumber" {...AXIS} tickLine={false} />
        <YAxis
          {...AXIS}
          tickLine={false}
          width={32}
          reversed
          domain={[1, maxPosition]}
          allowDecimals={false}
          tickFormatter={(v: number) => `P${v}`}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value) => [`P${value}`, "Class position"]}
          labelFormatter={(label) => `Lap ${label}`}
        />
        <Line
          type="stepAfter"
          dataKey="classPosition"
          stroke="var(--class-lmp2-proam)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
