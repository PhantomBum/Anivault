import { describe, expect, it } from "vitest";

import {
  parseMediaPlaylist,
  pickFirstVariantUrl,
  resolveAgainstBase,
} from "@/main/ipc/offline-downloads/hls-offline-concat";

describe("hls-offline-concat", () => {
  it("resolves relative URLs", () => {
    expect(resolveAgainstBase("seg.ts", "https://cdn.example.com/vod/index.m3u8")).toBe(
      "https://cdn.example.com/vod/seg.ts"
    );
  });

  it("picks first variant from master", () => {
    const master = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000,RESOLUTION=1280x720
720/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2560000,RESOLUTION=1920x1080
1080/index.m3u8
`;
    const u = pickFirstVariantUrl(master, "https://ex.com/live/master.m3u8");
    expect(u).toBe("https://ex.com/live/720/index.m3u8");
  });

  it("parses media segments and detects AES", () => {
    const media = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
https://x/a/0.ts
#EXTINF:10.0,
https://x/a/1.ts
`;
    const r = parseMediaPlaylist(media, "https://ignore.example/foo.m3u8");
    expect(r.encrypted).toBe(false);
    expect(r.segmentUrls).toEqual(["https://x/a/0.ts", "https://x/a/1.ts"]);
  });

  it("flags AES-128", () => {
    const media = `#EXTM3U
#EXT-X-KEY:METHOD=AES-128,URI="https://key"
#EXTINF:10,
seg.ts
`;
    const r = parseMediaPlaylist(media, "https://cdn.example.com/hls/main.m3u8");
    expect(r.encrypted).toBe(true);
    expect(r.segmentUrls.length).toBeGreaterThan(0);
  });
});
