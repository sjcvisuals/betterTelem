"use client";

import { useSearchParams } from "next/navigation";
import { parseGuideDate } from "@/lib/track-guide";

/** Optional `?asOf=YYYY-MM-DD` previews weekend UI (auto-stream, this-weekend copy). */
export function useGuideNow(): Date {
  const asOf = useSearchParams().get("asOf");
  return parseGuideDate(asOf) ?? new Date();
}
