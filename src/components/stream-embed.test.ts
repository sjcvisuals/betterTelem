import { describe, expect, it } from "vitest";
import { parseYouTubeVideoId } from "./stream-embed";

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

  it("rejects non-YouTube URLs and garbage", () => {
    expect(parseYouTubeVideoId("https://vimeo.com/12345")).toBeNull();
    expect(parseYouTubeVideoId("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeVideoId("not a url")).toBeNull();
    expect(parseYouTubeVideoId("")).toBeNull();
    expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=short")).toBeNull();
  });
});
