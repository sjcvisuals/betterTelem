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
      className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{
        color: classColor(raceClass),
        background: `color-mix(in srgb, ${classColor(raceClass)} 18%, transparent)`,
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
        "flag-cut inline-flex items-center font-black uppercase tracking-wider shadow-sm",
        large ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-0.5 text-[11px]",
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
      className="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
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

export type CardTone = "default" | "live" | "media" | "spotlight" | "battle";

const TONE_MARK: Record<CardTone, string> = {
  default: "var(--accent)",
  live: "var(--accent)",
  media: "var(--flag-red)",
  spotlight: "var(--spotlight)",
  battle: "var(--trend-up)",
};

export function Card({
  children,
  className,
  title,
  subtitle,
  actions,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  tone?: CardTone;
}) {
  return (
    <section
      className={clsx(
        "p-4",
        tone === "media" &&
          "rounded-lg border border-white/10 bg-[#0a0d14] shadow-[0_16px_40px_rgba(0,0,0,0.35)]",
        tone === "spotlight" &&
          "panel rounded-2xl border border-spotlight/35 border-l-4 border-l-spotlight",
        tone === "battle" &&
          "panel rounded-2xl border border-trend-up/25 border-l-4 border-l-trend-up",
        tone === "live" && "panel rounded-2xl border border-line border-l-4 border-l-accent",
        tone === "default" && "panel rounded-2xl border border-line",
        className,
      )}
    >
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            {title && (
              <h2 className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-[2px]"
                  style={{ background: TONE_MARK[tone] }}
                />
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1 text-xs leading-relaxed text-muted">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function ClassFilterChip({
  label,
  selected,
  onClick,
  classNameForColor,
  role = "tab",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  classNameForColor?: string;
  role?: "tab" | "button";
}) {
  const color =
    classNameForColor && classNameForColor !== "All" && classNameForColor !== "All classes"
      ? classColor(classNameForColor)
      : undefined;

  return (
    <button
      type="button"
      role={role}
      aria-selected={role === "tab" ? selected : undefined}
      aria-pressed={role === "button" ? selected : undefined}
      onClick={onClick}
      className={clsx(
        "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
        selected && !color && "bg-foreground text-background",
        !selected && "text-muted hover:bg-white/5 hover:text-foreground",
      )}
      style={
        selected && color
          ? { background: color, color: "#0b0e13" }
          : undefined
      }
    >
      {label}
    </button>
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
