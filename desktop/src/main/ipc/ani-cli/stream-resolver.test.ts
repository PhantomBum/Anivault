import { describe, expect, it } from "vitest";

import { normalizeStreamErrorMessage } from "./stream-resolver";

describe("normalizeStreamErrorMessage", () => {
  it("maps no-stream errors to user-facing copy", () => {
    expect(
      normalizeStreamErrorMessage(new Error("No obfuscated allanime sources found for this episode"))
    ).toContain("No playable stream");
  });

  it("maps timeout errors", () => {
    expect(normalizeStreamErrorMessage(new Error("Stream resolution timed out after 42000ms"))).toContain(
      "timed out"
    );
  });

  it("maps AllAnime 4xx API errors (POST/GET) to user-facing copy", () => {
    expect(normalizeStreamErrorMessage(new Error("allanime API error: 403 Forbidden"))).toContain(
      "Could not load episode data"
    );
    expect(normalizeStreamErrorMessage(new Error("allanime request failed: 403 Forbidden"))).toContain(
      "Could not load episode data"
    );
  });

  it("passes through short unknown messages", () => {
    expect(normalizeStreamErrorMessage(new Error("Something else"))).toBe("Something else");
  });
});
