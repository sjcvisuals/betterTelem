import clsx from "clsx";
import type { EventCategory, TrackFlag } from "@/lib/race/types";

/** Small shared presentational atoms. Class identity always includes text. */

export const CLASS_COLOR: Record<string, string> = {
  LMP2: "var(--class-lmp2)",
  "LMP2 Pro/Am": "var(--class-lmp2-proam)",
  LMP3: "var(--class-lmp3)",
  LMGT3: "var(--class-lmgt3)",
};

export const CLASS_SHORT: Record<string, string> = {
  LMP2: "LMP2",
  "LMP2 Pro/Am": "P2 Pro/Am",
  LMP3: "LMP3",
  LMGT3: "LMGT3",
};

export function classColor(className: string): string {
  return CLASS_COLOR[className] ?? "var(--muted)";
}

export function ClassBadge({ className: raceClass, compact = false }: { className: string; compact?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{
        color: classColor(raceClass),
        background: `color-mix(in srgb, ${classColor(raceClass)} 14%, transparent)`,
      }}
    >
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ background: classColor(raceClass) }}
      />
      {compact ? (CLASS_SHORT[raceClass] ?? raceClass) : raceClass}
    </span>
  );
}

const FLAG_STYLE: Record<TrackFlag, { label: string; bg: string; fg: string }> = {
  GREEN: { label: "GREEN", bg: "var(--flag-green)", fg: "#04140b" },
  YELLOW: { label: "YELLOW", bg: "var(--flag-yellow)", fg: "#191202" },
  FCY: { label: "FULL COURSE YELLOW", bg: "var(--flag-yellow)", fg: "#191202" },
  SC: { label: "SAFETY CAR", bg: "var(--flag-sc)", fg: "#1a0e02" },
  RED: { label: "RED FLAG", bg: "var(--flag-red)", fg: "#fff" },
  CHEQUERED: { label: "FINISH", bg: "#e8ecf4", fg: "#0b0e13" },
  UNKNOWN: { label: "—", bg: "var(--border)", fg: "var(--foreground)" },
};

export function FlagBadge({ flag, large = false }: { flag: TrackFlag; large?: boolean }) {
  const style = FLAG_STYLE[flag];
  return (
    <span
      role="status"
      aria-label={`Track status: ${style.label}`}
      className={clsx(
        "inline-flex items-center rounded font-bold uppercase tracking-wider",
        large ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[11px]",
      )}
      style={{ background: style.bg, color: style.fg }}
    >
      {style.label}
    </span>
  );
}

const CATEGORY_STYLE: Record<EventCategory, { bg: string; fg: string; title: string }> = {
  FACT: {
    bg: "color-mix(in srgb, var(--class-lmp2) 16%, transparent)",
    fg: "var(--class-lmp2)",
    title: "Directly observed in the timing data",
  },
  TREND: {
    bg: "color-mix(in srgb, var(--trend-up) 16%, transparent)",
    fg: "var(--trend-up)",
    title: "Derived from several laps of data",
  },
  ESTIMATE: {
    bg: "color-mix(in srgb, var(--flag-yellow) 16%, transparent)",
    fg: "var(--flag-yellow)",
    title: "A projection — it may not happen",
  },
};

export function CategoryBadge({ category }: { category: EventCategory }) {
  const style = CATEGORY_STYLE[category];
  return (
    <span
      className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
      style={{ background: style.bg, color: style.fg }}
      title={style.title}
    >
      {category}
    </span>
  );
}

export function TrendArrow({
  trend,
}: {
  trend: "CATCHING" | "STABLE" | "LOSING" | null;
}) {
  if (trend === "CATCHING") {
    return (
      <span aria-label="catching" className="font-semibold" style={{ color: "var(--trend-up)" }}>
        ↑
      </span>
    );
  }
  if (trend === "LOSING") {
    return (
      <span aria-label="losing time" className="font-semibold" style={{ color: "var(--trend-down)" }}>
        ↓
      </span>
    );
  }
  if (trend === "STABLE") {
    return (
      <span aria-label="gap stable" className="text-muted">
        →
      </span>
    );
  }
  return null;
}

export function Card({
  children,
  className,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section
      className={clsx(
        "rounded-xl border border-line bg-surface p-4",
        className,
      )}
    >
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            {title && (
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] text-muted hover:text-foreground"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg border border-line bg-surface-raised p-3 text-xs leading-relaxed text-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}
