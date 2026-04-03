import { describe, expect, it } from "vitest";

import type { StreamProvider, StreamUrlResult } from "./stream-provider";

/** Minimal stub to lock the StreamProvider shape (phase 29). */
class StubStreamProvider implements StreamProvider {
  /* eslint-disable @typescript-eslint/no-unused-vars -- interface requires parameters */
  getStreamUrl(
    _showId: string,
    _episode: string,
    _mode: "sub" | "dub"
  ): Promise<StreamUrlResult> {
    return Promise.resolve({
      url: "https://example.com/stream.m3u8",
      referer: "https://ref.example/",
    });
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

describe("StreamProvider contract", () => {
  it("returns url and referer strings", async () => {
    const p: StreamProvider = new StubStreamProvider();
    const r = await p.getStreamUrl("show-id", "1", "sub");
    expect(r.url).toMatch(/^https:/);
    expect(typeof r.referer).toBe("string");
  });
});
