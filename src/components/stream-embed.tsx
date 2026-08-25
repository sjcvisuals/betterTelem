"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import {
  officialElmsLiveEmbedSrc,
  parseYouTubeVideoId,
  youtubeVideoEmbedSrc,
  ELMS_YOUTUBE_CHANNEL_URL,
  ELMS_YOUTUBE_LIVE_URL,
} from "@/lib/broadcast/youtube";
import { resolveStreamSource } from "@/lib/broadcast/resolve";
import { broadcastEventFor, formatEventDateRange, type TrackEvent } from "@/lib/track-guide";
import { Card } from "./ui";

/**
 * YouTube race-stream embed. On ELMS weekend days the official channel live
 * player appears automatically. A pasted URL still overrides that.
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

export { parseYouTubeVideoId };

function StreamPasteForm({
  onLoaded,
}: {
  onLoaded: () => void;
}) {
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
    onLoaded();
  };

  return (
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
  );
}

function PlayerFrame({ src, title }: { src: string; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-line bg-black">
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full"
      />
    </div>
  );
}

function IdleBroadcast({ nextEvent }: { nextEvent: TrackEvent | undefined }) {
  const [showPaste, setShowPaste] = useState(false);

  return (
    <Card
      title="Race broadcast"
      subtitle="The official ELMS YouTube stream appears here by itself on race-weekend days — no link to paste."
    >
      <div className="space-y-3 text-sm">
        {nextEvent ? (
          <p>
            Next up: <span className="font-semibold">{nextEvent.name}</span>
            <span className="text-muted"> · {formatEventDateRange(nextEvent)}</span>
          </p>
        ) : (
          <p className="text-muted">No upcoming ELMS round is listed yet.</p>
        )}
        <p className="text-muted">
          Practice, qualifying and the 4-hour race are streamed free on the official channel. When
          that weekend starts, this panel loads the live player automatically.
        </p>
        <a
          href={ELMS_YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-sm font-semibold text-accent hover:underline"
        >
          Official ELMS YouTube
        </a>
        <div>
          <button
            type="button"
            onClick={() => setShowPaste((open) => !open)}
            className="text-xs font-semibold text-muted hover:text-foreground"
          >
            {showPaste ? "Hide paste box" : "Paste a replay or a different stream"}
          </button>
          {showPaste && (
            <div className="mt-2">
              <StreamPasteForm onLoaded={() => undefined} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function StreamEmbed({ now = new Date() }: { now?: Date }) {
  const videoId = useSyncExternalStore(
    subscribeToStream,
    readStoredVideoId,
    () => null,
  );
  const [showPaste, setShowPaste] = useState(false);
  const source = resolveStreamSource(videoId, now);
  const clear = useCallback(() => writeStoredVideoId(null), []);

  if (source.mode === "idle") {
    return <IdleBroadcast nextEvent={source.nextEvent} />;
  }

  if (source.mode === "official-live") {
    return (
      <Card
        title="Race broadcast"
        subtitle={`${source.event.name} · official ELMS YouTube, loaded automatically for this weekend`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={ELMS_YOUTUBE_LIVE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-accent hover:underline"
            >
              Open on YouTube
            </a>
            <button
              type="button"
              onClick={() => setShowPaste((open) => !open)}
              className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:text-foreground"
            >
              {showPaste ? "Hide paste box" : "Use a different stream"}
            </button>
          </div>
        }
      >
        <PlayerFrame
          src={officialElmsLiveEmbedSrc()}
          title={`${source.event.name} (official ELMS YouTube)`}
        />
        <p className="mt-2 text-xs text-muted">
          If the player says nothing is live yet, ELMS has not gone on air. Timing feeds typically
          run 30–60s ahead of the pictures.
        </p>
        {showPaste && (
          <div className="mt-3">
            <StreamPasteForm onLoaded={() => setShowPaste(false)} />
          </div>
        )}
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
          {broadcastEventFor(now) ? "Back to official stream" : "Remove stream"}
        </button>
      }
    >
      <PlayerFrame src={youtubeVideoEmbedSrc(source.videoId)} title="Race broadcast (YouTube)" />
    </Card>
  );
}
