import type { Livery, ResolvedIdentity } from "@/lib/liveries/types";
import { resolveIdentity } from "@/lib/liveries";
import { classColor } from "./ui";

/**
 * Team crest (monogram, not an official logo), rounded livery chips, and
 * circular track-map dots. Used on the track map, timing tower, and car
 * detail page so viewers can match broadcast colours to a car without
 * hunting for a number.
 */

function gradientId(prefix: string, carNumber: string, pattern: string): string {
  return `${prefix}-${carNumber}-${pattern}`.replace(/[^A-Za-z0-9_-]/g, "");
}

function LiveryPaint({ livery }: { livery: Livery }) {
  if (livery.pattern === "solid") {
    return <stop offset="0%" stopColor={livery.base} />;
  }
  if (livery.pattern === "split-h") {
    return (
      <>
        <stop offset="0%" stopColor={livery.base} />
        <stop offset="48%" stopColor={livery.base} />
        <stop offset="48%" stopColor={livery.accent} />
        <stop offset="100%" stopColor={livery.accent} />
      </>
    );
  }
  if (livery.pattern === "split-v") {
    return (
      <>
        <stop offset="0%" stopColor={livery.base} />
        <stop offset="55%" stopColor={livery.base} />
        <stop offset="55%" stopColor={livery.accent} />
        <stop offset="100%" stopColor={livery.accent} />
      </>
    );
  }
  if (livery.pattern === "stripe") {
    return (
      <>
        <stop offset="0%" stopColor={livery.base} />
        <stop offset="32%" stopColor={livery.base} />
        <stop offset="32%" stopColor={livery.accent} />
        <stop offset="68%" stopColor={livery.accent} />
        <stop offset="68%" stopColor={livery.base} />
        <stop offset="100%" stopColor={livery.base} />
      </>
    );
  }
  if (livery.pattern === "nose") {
    return (
      <>
        <stop offset="0%" stopColor={livery.accent} />
        <stop offset="28%" stopColor={livery.accent} />
        <stop offset="28%" stopColor={livery.base} />
        <stop offset="100%" stopColor={livery.base} />
      </>
    );
  }
  const third = livery.tertiary ?? livery.accent;
  return (
    <>
      <stop offset="0%" stopColor={livery.base} />
      <stop offset="33%" stopColor={livery.base} />
      <stop offset="33%" stopColor={livery.accent} />
      <stop offset="66%" stopColor={livery.accent} />
      <stop offset="66%" stopColor={third} />
      <stop offset="100%" stopColor={third} />
    </>
  );
}

/** Circular track-map marker: team colours + number, easy to read. */
export function LiveryMapDot({
  identity,
  className,
  selected = false,
  showNumber = true,
}: {
  identity: ResolvedIdentity;
  className: string;
  selected?: boolean;
  showNumber?: boolean;
}) {
  const id = gradientId("map", identity.carNumber, identity.livery.pattern);
  const r = selected ? 14 : 11.5;
  const vertical = identity.livery.pattern === "split-v" || identity.livery.pattern === "nose";
  const fontSize = identity.carNumber.length > 2 ? 8 : 10;
  return (
    <g>
      <defs>
        <linearGradient
          id={id}
          x1="0"
          y1="0"
          x2={vertical ? "1" : "0"}
          y2={vertical ? "0" : "1"}
        >
          <LiveryPaint livery={identity.livery} />
        </linearGradient>
      </defs>
      <circle
        r={r + 2.4}
        fill="none"
        stroke={classColor(className)}
        strokeWidth={selected ? 2.4 : 1.8}
        opacity={0.95}
      />
      <circle r={r} fill={`url(#${id})`} stroke="#0b0e13" strokeWidth={0.8} />
      {showNumber && (
        <text
          y={0}
          dominantBaseline="central"
          fontSize={fontSize}
          fontWeight={800}
          fill={identity.livery.number}
          textAnchor="middle"
          style={{ fontVariantNumeric: "tabular-nums" }}
          paintOrder="stroke"
          stroke="#0b0e13"
          strokeWidth={0.45}
        >
          {identity.carNumber}
        </text>
      )}
    </g>
  );
}

export function TeamCrest({
  identity,
  size = 28,
  title,
}: {
  identity: ResolvedIdentity;
  size?: number;
  title?: string;
}) {
  const fontSize = identity.initials.length > 3 ? size * 0.32 : size * 0.38;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
      className="shrink-0"
    >
      <circle cx="16" cy="16" r="15" fill={identity.crestBg} stroke="#0b0e13" strokeWidth="1.2" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={800}
        fill={identity.crestFg}
        style={{ letterSpacing: identity.initials.length > 3 ? "-0.4px" : "0" }}
      >
        {identity.initials}
      </text>
    </svg>
  );
}

/** Compact rounded-rectangle livery chip for the timing tower. */
export function LiveryChip({
  carNumber,
  team,
  size = "md",
}: {
  carNumber: string;
  team: string;
  size?: "sm" | "md" | "lg";
}) {
  const identity = resolveIdentity(carNumber, team);
  const dims =
    size === "lg"
      ? { w: 88, h: 40, font: 14 }
      : size === "sm"
        ? { w: 44, h: 22, font: 9 }
        : { w: 56, h: 28, font: 11 };
  const id = gradientId("chip", carNumber, identity.livery.pattern);
  const vertical = identity.livery.pattern === "split-v" || identity.livery.pattern === "nose";
  return (
    <svg
      width={dims.w}
      height={dims.h}
      viewBox="0 0 56 28"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2={vertical ? "1" : "0"} y2={vertical ? "0" : "1"}>
          <LiveryPaint livery={identity.livery} />
        </linearGradient>
      </defs>
      <rect
        x="0.6"
        y="0.6"
        width="54.8"
        height="26.8"
        rx="7"
        ry="7"
        fill={`url(#${id})`}
        stroke="#0b0e13"
        strokeWidth="1"
      />
      <text
        x="28"
        y="14"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={dims.font}
        fontWeight={800}
        fill={identity.livery.number}
        style={{ fontVariantNumeric: "tabular-nums" }}
        paintOrder="stroke"
        stroke="#0b0e13"
        strokeWidth="0.5"
      >
        {carNumber}
      </text>
    </svg>
  );
}

export function identityFor(carNumber: string, team: string): ResolvedIdentity {
  return resolveIdentity(carNumber, team);
}
