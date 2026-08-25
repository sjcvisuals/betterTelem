/**
 * Official ELMS YouTube channel. Races are streamed free; we embed YouTube's
 * own player (no rehosting). Channel live embed needs no video id.
 */
export const ELMS_YOUTUBE_CHANNEL_ID = "UCU8C8RqGhqH4nhk4mlN1Vwg";
export const ELMS_YOUTUBE_CHANNEL_URL =
  "https://www.youtube.com/@EuropeanLeMansSeriesOfficial";
export const ELMS_YOUTUBE_LIVE_URL =
  "https://www.youtube.com/@EuropeanLeMansSeriesOfficial/live";

const YOUTUBE_VIDEO_ID = /^[\w-]{11}$/;

function isYouTubeVideoId(id: string): boolean {
  return YOUTUBE_VIDEO_ID.test(id) && id !== "live_stream";
}

/** Accepts full YouTube URLs (watch/live/youtu.be/embed) or a bare video id. */
export function parseYouTubeVideoId(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  if (isYouTubeVideoId(text)) return text;
  try {
    const url = new URL(text);
    if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)youtube-nocookie\.com$/.test(url.hostname)) {
      return null;
    }
    if (url.hostname.endsWith("youtu.be")) {
      const id = url.pathname.slice(1).split("/")[0];
      return isYouTubeVideoId(id) ? id : null;
    }
    const v = url.searchParams.get("v");
    if (v && isYouTubeVideoId(v)) return v;
    const match = url.pathname.match(/\/(?:live|embed|shorts)\/([\w-]{11})/);
    return match && isYouTubeVideoId(match[1]) ? match[1] : null;
  } catch {
    return null;
  }
}

/** Channel live player — YouTube swaps in whichever stream is on air. */
export function officialElmsLiveEmbedSrc(): string {
  const params = new URLSearchParams({
    channel: ELMS_YOUTUBE_CHANNEL_ID,
    rel: "0",
  });
  return `https://www.youtube-nocookie.com/embed/live_stream?${params.toString()}`;
}

export function youtubeVideoEmbedSrc(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`;
}
