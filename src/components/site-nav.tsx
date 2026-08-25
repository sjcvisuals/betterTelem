"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function SiteNav() {
  const path = usePathname();
  const onLive = path === "/live" || path.startsWith("/live/") || path === "/";
  const onTrack = path === "/track" || path.startsWith("/track/");

  return (
    <nav aria-label="Main navigation" className="mb-4 flex flex-wrap items-center gap-3 text-sm">
      <Link href="/live" className="text-lg font-black tracking-tight">
        better<span className="text-accent">Telem</span>
      </Link>
      <Link
        href="/live"
        className={clsx(
          "rounded-lg px-2 py-1",
          onLive && !onTrack ? "font-semibold text-foreground" : "text-muted hover:text-foreground",
        )}
      >
        Live
      </Link>
      <Link
        href="/track"
        aria-current={onTrack ? "page" : undefined}
        className={clsx(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold shadow-sm transition-opacity hover:opacity-90",
          onTrack
            ? "bg-foreground text-background ring-2 ring-accent ring-offset-2 ring-offset-background"
            : "bg-accent text-background",
        )}
      >
        Track helper
        <span className="hidden font-semibold opacity-80 sm:inline">tickets · times</span>
      </Link>
      <span className="ml-auto hidden text-xs text-muted sm:inline">
        ELMS race companion • data by OpenWEC
      </span>
    </nav>
  );
}
