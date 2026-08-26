"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  useRaceControls,
  type DemoScenarioInfo,
} from "./race-provider";
import { LiveSessionPicker } from "./live-session-picker";

/**
 * Development / demo control strip: LIVE vs DEMO mode, replay speed and
 * scenario jumps (pit cycle, FCY, Safety Car, stale feed...).
 */
export function DemoControls({ scenarios }: { scenarios: DemoScenarioInfo[] | null }) {
  const controls = useRaceControls();
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-white/8 bg-black/25">
      <div className="flex flex-wrap items-center gap-2 p-2.5">
        <div
          className="flex overflow-hidden rounded-lg border border-line"
          role="group"
          aria-label="Data source"
        >
          {(["DEMO", "LIVE"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => controls.setMode(mode)}
              aria-pressed={controls.mode === mode}
              className={clsx(
                "px-3 py-1 text-xs font-bold tracking-wider",
                controls.mode === mode
                  ? mode === "LIVE"
                    ? "bg-flag-green text-[#04140b]"
                    : "bg-accent text-[#04222f]"
                  : "text-muted hover:text-foreground",
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        {controls.mode === "DEMO" && (
          <>
            <button
              type="button"
              onClick={controls.togglePause}
              className="rounded-lg border border-line px-3 py-1 text-xs font-semibold text-foreground hover:bg-surface"
            >
              {controls.demoClock.paused ? "▶ Resume" : "❚❚ Pause"}
            </button>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              Replay speed
              <select
                value={controls.demoClock.speed}
                onChange={(event) => controls.setSpeed(Number(event.target.value))}
                className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-foreground"
              >
                {[1, 5, 15, 30, 60].map((speed) => (
                  <option key={speed} value={speed}>
                    {speed}×
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="ml-auto rounded-lg px-2 py-1 text-xs text-muted hover:text-foreground"
        >
          {expanded ? "Hide options ▲" : "Show options ▼"}
        </button>
      </div>

      {expanded && controls.mode === "DEMO" && scenarios && (
        <div className="border-t border-line p-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Jump to scenario
          </p>
          <div className="flex flex-wrap gap-1.5">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                title={scenario.description}
                onClick={() => controls.jumpToScenario(scenario)}
                className={clsx(
                  "rounded-lg border px-2.5 py-1 text-xs",
                  controls.demoClock.stale && scenario.stale
                    ? "border-flag-red text-flag-red"
                    : "border-line text-foreground hover:bg-surface",
                )}
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {expanded && controls.mode === "LIVE" && (
        <div className="border-t border-line p-2.5">
          <LiveSessionPicker />
        </div>
      )}
    </div>
  );
}
