import { describe, expect, it } from "vitest";

import type { StreamProvider, StreamProviderCapabilities, StreamUrlResult } from "./stream-provider";

class StubStreamProvider implements StreamProvider {
  readonly capabilities: StreamProviderCapabilities = {
    name: "Stub",
    supportsSub: true,
    supportsDub: false,
    knownQualities: [720, 1080],
  };

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

  it("exposes capabilities", () => {
    const p: StreamProvider = new StubStreamProvider();
    expect(p.capabilities.name).toBe("Stub");
    expect(p.capabilities.supportsSub).toBe(true);
    expect(p.capabilities.supportsDub).toBe(false);
    expect(p.capabilities.knownQualities).toEqual([720, 1080]);
  });
});
