"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function SiteNav() {
  const path = usePathname();
  const onLive = path === "/live" || path.startsWith("/live/") || path === "/";
  const onTrack = path === "/track" || path.startsWith("/track/");

  return (
    <nav
      aria-label="Main navigation"
      className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] px-3 py-2 shadow-[0_10px_36px_rgba(0,0,0,0.35)] backdrop-blur-md"
    >
      <Link href="/live" className="mr-1 text-lg font-black tracking-tight">
        better<span className="text-accent">Telem</span>
      </Link>
      <Link
        href="/live"
        className={clsx(
          "rounded-md px-2.5 py-1 text-sm",
          onLive && !onTrack
            ? "bg-accent/15 font-semibold text-accent"
            : "text-muted hover:text-foreground",
        )}
      >
        Live
      </Link>
      <Link
        href="/track"
        aria-current={onTrack ? "page" : undefined}
        className={clsx(
          "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold shadow-sm transition-transform hover:scale-[1.02]",
          onTrack
            ? "bg-spotlight-ink text-spotlight ring-2 ring-spotlight"
            : "bg-spotlight text-spotlight-ink",
        )}
      >
        Track helper
        <span className="hidden font-semibold opacity-75 sm:inline">tickets · times</span>
      </Link>
      <span className="ml-auto hidden text-xs text-muted sm:inline">
        ELMS race companion • data by OpenWEC
      </span>
    </nav>
  );
}
