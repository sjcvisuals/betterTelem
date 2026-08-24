import type { Livery, ResolvedIdentity } from "@/lib/liveries/types";
import { resolveIdentity } from "@/lib/liveries";
import { classColor } from "./ui";

/**
 * Team crest (monogram, not an official logo) and livery-painted car marks.
 * Used on the track map, timing tower, and car detail page so viewers can
 * match broadcast colours to a car without hunting for a number.
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

/** Top-down prototype silhouette used on the track map. */
export function LiveryCarMark({
  identity,
  className,
  selected = false,
  headingDeg = 0,
  showNumber = true,
}: {
  identity: ResolvedIdentity;
  className: string;
  selected?: boolean;
  headingDeg?: number;
  showNumber?: boolean;
}) {
  const id = gradientId("map", identity.carNumber, identity.livery.pattern);
  const scale = selected ? 1.35 : 1;
  const vertical = identity.livery.pattern === "split-v" || identity.livery.pattern === "nose";
  return (
    <g transform={`rotate(${headingDeg}) scale(${scale})`} opacity={1}>
      <defs>
        <linearGradient
          id={id}
          x1={vertical ? "0" : "0"}
          y1={vertical ? "0" : "0"}
          x2={vertical ? "1" : "0"}
          y2={vertical ? "0" : "1"}
        >
          <LiveryPaint livery={identity.livery} />
        </linearGradient>
      </defs>
      {/* Class ring so multiclass identity is still readable without colour-only. */}
      <ellipse
        rx={18}
        ry={10}
        fill="none"
        stroke={classColor(className)}
        strokeWidth={selected ? 2.4 : 1.8}
        opacity={0.95}
      />
      <path
        d="M -14 0 C -13 -4.5, -8 -6.2, -3 -6.4 L 7 -5.6 C 10 -5.2, 12 -3.4, 14 -1.2 L 15 0 L 14 1.2 C 12 3.4, 10 5.2, 7 5.6 L -3 6.4 C -8 6.2, -13 4.5, -14 0 Z"
        fill={`url(#${id})`}
        stroke="#0b0e13"
        strokeWidth={0.7}
      />
      {/* Cockpit */}
      <ellipse cx={2} cy={0} rx={3.2} ry={2.1} fill="#0b0e13" opacity={0.55} />
      {showNumber && (
        <text
          y={1.6}
          fontSize={7.2}
          fontWeight={800}
          fill={identity.livery.number}
          textAnchor="middle"
          style={{ fontVariantNumeric: "tabular-nums" }}
          paintOrder="stroke"
          stroke="#0b0e13"
          strokeWidth={0.4}
        >
          {identity.carNumber}
        </text>
      )}
    </g>
  );
}

/** SVG-native crest for use inside the track map. */
export function TeamCrestMark({
  identity,
  x = 0,
  y = 0,
  size = 14,
}: {
  identity: ResolvedIdentity;
  x?: number;
  y?: number;
  size?: number;
}) {
  const fontSize = identity.initials.length > 3 ? size * 0.34 : size * 0.4;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={size / 2} fill={identity.crestBg} stroke="#0b0e13" strokeWidth={0.8} />
      <text
        y={fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={800}
        fill={identity.crestFg}
      >
        {identity.initials}
      </text>
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

/** Compact side-view livery chip for the timing tower. */
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
  const dims = size === "lg" ? { w: 88, h: 40, font: 13 } : size === "sm" ? { w: 44, h: 22, font: 8 } : { w: 56, h: 28, font: 10 };
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
      <path
        d="M 3 18 L 8 10 C 10 7, 14 6, 20 6 L 38 6 C 42 6, 46 8, 50 12 L 53 16 C 54 17, 54 19, 52 20 L 8 20 C 5 20, 3 19, 3 18 Z"
        fill={`url(#${id})`}
        stroke="#0b0e13"
        strokeWidth="0.8"
      />
      <text
        x="28"
        y="17"
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
