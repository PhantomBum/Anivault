import { describe, expect, it } from "vitest";

import {
  extensionFromMime,
  isLikelyHlsUrl,
  isMpegUrlContentType,
  pickExtensionFromUrl,
  safeFileSegment,
} from "./offline-download-helpers";

describe("offline-download-helpers", () => {
  it("detects HLS-like URLs", () => {
    expect(isLikelyHlsUrl("https://cdn.example/v/master.m3u8")).toBe(true);
    expect(isLikelyHlsUrl("https://cdn.example/video.mp4")).toBe(false);
  });

  it("detects HLS content-types", () => {
    expect(isMpegUrlContentType("application/vnd.apple.mpegurl")).toBe(true);
    expect(isMpegUrlContentType("video/mp4")).toBe(false);
  });

  it("picks extension from URL path", () => {
    expect(pickExtensionFromUrl("https://x/a/b.mp4")).toBe(".mp4");
    expect(pickExtensionFromUrl("https://x/a/noext")).toBe(null);
  });

  it("maps common video MIME to extension", () => {
    expect(extensionFromMime("video/webm")).toBe(".webm");
    expect(extensionFromMime("text/plain")).toBe(null);
  });

  it("sanitizes file segments", () => {
    expect(safeFileSegment('foo<>bar/baz', 20)).toBe("foo__bar_baz");
    expect(safeFileSegment("   ", 10)).toBe("show");
  });
});
