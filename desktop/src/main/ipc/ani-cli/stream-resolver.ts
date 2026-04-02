/**
 * Orchestrates AllAnime stream resolution: overall timeout, retries on transient failures,
 * and user-facing error messages.
 */
import { AllAnimeStreamProvider } from "./stream-providers/allanime-stream-provider";
import type { StreamUrlResult } from "./stream-providers/stream-provider";

const provider = new AllAnimeStreamProvider();

const STREAM_TOTAL_MS = 90_000;
const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, rej) => {
        timer = setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function rawMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isNoStreamError(msg: string): boolean {
  return /No obfuscated|No valid stream/i.test(msg);
}

function isRetryable(msg: string): boolean {
  if (isNoStreamError(msg)) return false;
  return true;
}

/** Maps technical errors to short UI copy (Settings / watch overlay). */
export function normalizeStreamErrorMessage(err: unknown): string {
  const raw = rawMessage(err);
  if (isNoStreamError(raw)) {
    return "No playable stream for this episode from current sources. Try another episode or switch sub/dub if available.";
  }
  if (/timed out|timeout|AbortError|timed out after/i.test(raw)) {
    return "Connection timed out or the service was busy. Retry, or wait a moment and try again.";
  }
  if (/allanime request failed: 4\d\d/.test(raw)) {
    return "Could not load episode data from the source. Try again later.";
  }
  if (/allanime request failed: 5\d\d/.test(raw)) {
    return "Source server error. Try again in a few minutes.";
  }
  return raw.length > 220 ? `${raw.slice(0, 217)}…` : raw;
}

export async function getStreamUrl(
  showId: string,
  episode: string,
  mode: "sub" | "dub" = "sub"
): Promise<StreamUrlResult> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await withTimeout(
        provider.getStreamUrl(showId, episode, mode),
        STREAM_TOTAL_MS,
        "Stream resolution"
      );
    } catch (e) {
      lastErr = e;
      const msg = rawMessage(e);
      if (!isRetryable(msg)) break;
      if (attempt < MAX_ATTEMPTS) await delay(BACKOFF_BASE_MS * attempt);
    }
  }
  throw new Error(normalizeStreamErrorMessage(lastErr));
}
