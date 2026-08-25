import { describe, expect, it } from "vitest";
import {
  ELMS_YOUTUBE_CHANNEL_ID,
  officialElmsLiveEmbedSrc,
  parseYouTubeVideoId,
  youtubeVideoEmbedSrc,
} from "./youtube";

describe("parseYouTubeVideoId", () => {
  it("parses common YouTube URL shapes", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeVideoId("https://www.youtube.com/live/dQw4w9WgXcQ?feature=share")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(parseYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rejects non-YouTube URLs, garbage, and channel live URLs without a video id", () => {
    expect(parseYouTubeVideoId("https://vimeo.com/12345")).toBeNull();
    expect(parseYouTubeVideoId("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeVideoId("not a url")).toBeNull();
    expect(parseYouTubeVideoId("")).toBeNull();
    expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(
      parseYouTubeVideoId(
        "https://www.youtube.com/embed/live_stream?channel=UCU8C8RqGhqH4nhk4mlN1Vwg",
      ),
    ).toBeNull();
  });
});

describe("official ELMS embed", () => {
  it("points the no-cookie player at the official channel live endpoint", () => {
    const src = officialElmsLiveEmbedSrc();
    expect(src.startsWith("https://www.youtube-nocookie.com/embed/live_stream?")).toBe(true);
    expect(src).toContain(`channel=${ELMS_YOUTUBE_CHANNEL_ID}`);
  });

  it("embeds a pasted video by id", () => {
    expect(youtubeVideoEmbedSrc("dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0",
    );
  });
});
