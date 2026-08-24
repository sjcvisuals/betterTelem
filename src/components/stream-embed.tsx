"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Card } from "./ui";

/**
 * YouTube race-stream embed. ELMS streams races free on YouTube; paste the
 * watch URL (or video id) and the broadcast plays beside the timing data.
 * Plays through YouTube's own embedded player (no rehosting).
 */

const STORAGE_KEY = "bettertelem.streamVideoId";
const STORAGE_EVENT = "bettertelem:stream-change";

/* Hydration-safe localStorage binding: the server snapshot is always null,
   so SSR and first client render agree; the real value appears after mount. */
function subscribeToStream(callback: () => void): () => void {
  window.addEventListener(STORAGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORAGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function readStoredVideoId(): string | null {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved && /^[\w-]{11}$/.test(saved) ? saved : null;
}

function writeStoredVideoId(id: string | null): void {
  if (id) window.localStorage.setItem(STORAGE_KEY, id);
  else window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

/** Accepts full YouTube URLs (watch/live/youtu.be/embed) or a bare video id. */
export function parseYouTubeVideoId(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  if (/^[\w-]{11}$/.test(text)) return text;
  try {
    const url = new URL(text);
    if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)youtube-nocookie\.com$/.test(url.hostname)) {
      return null;
    }
    if (url.hostname.endsWith("youtu.be")) {
      const id = url.pathname.slice(1).split("/")[0];
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    const v = url.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const match = url.pathname.match(/\/(?:live|embed|shorts)\/([\w-]{11})/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function StreamEmbed() {
  const videoId = useSyncExternalStore(
    subscribeToStream,
    readStoredVideoId,
    () => null,
  );
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const id = parseYouTubeVideoId(input);
    if (!id) {
      setInputError("That doesn't look like a YouTube link or video id.");
      return;
    }
    setInputError(null);
    writeStoredVideoId(id);
    setInput("");
  };

  const clear = useCallback(() => writeStoredVideoId(null), []);

  if (!videoId) {
    return (
      <Card
        title="Race broadcast"
        subtitle="ELMS races stream free on YouTube — paste the link to watch alongside the timing."
      >
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
          <label htmlFor="stream-url" className="sr-only">
            YouTube stream URL or video id
          </label>
          <input
            id="stream-url"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-muted"
          />
          <button
            type="submit"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
          >
            Load stream
          </button>
          {inputError && (
            <p className="basis-full text-xs text-flag-red" role="alert">
              {inputError}
            </p>
          )}
        </form>
      </Card>
    );
  }

  return (
    <Card
      title="Race broadcast"
      subtitle="Timing feeds typically run 30–60s ahead of the video stream."
      actions={
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:text-foreground"
        >
          Remove stream
        </button>
      }
    >
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-line bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`}
          title="Race broadcast (YouTube)"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
        />
      </div>
    </Card>
  );
}
