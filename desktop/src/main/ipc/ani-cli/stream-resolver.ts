/**
 * Orchestrates stream resolution: provider registry, overall timeout, retries on
 * transient failures, structured error classification, and user-facing messages.
 */
import { AllAnimeStreamProvider } from "./stream-providers/allanime-stream-provider";
import type { StreamProvider, StreamUrlResult, StreamErrorKind } from "./stream-providers/stream-provider";
import { StreamResolutionError } from "./stream-providers/stream-provider";

const providers: StreamProvider[] = [new AllAnimeStreamProvider()];

/** Register an additional stream provider (e.g. for future sources). */
export function registerStreamProvider(provider: StreamProvider): void {
  providers.push(provider);
}

export function getRegisteredProviders(): readonly StreamProvider[] {
  return providers;
}

const STREAM_TOTAL_MS = 42_000;
const MAX_ATTEMPTS = 2;
const BACKOFF_BASE_MS = 180;

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

function classifyError(err: unknown): StreamErrorKind {
  const msg = rawMessage(err);
  if (err instanceof StreamResolutionError) return err.kind;
  if (/No obfuscated|No valid stream/i.test(msg)) return "no_stream";
  if (/timed out|timeout|AbortError/i.test(msg)) return "timeout";
  if (/allanime (?:request failed|API error): 4\d\d/.test(msg)) return "upstream_4xx";
  if (/allanime (?:request failed|API error): 5\d\d/.test(msg)) return "upstream_5xx";
  if (/Unknown obfuscated|Invalid obfuscated/i.test(msg)) return "decode_failure";
  return "unknown";
}

function isRetryable(err: unknown): boolean {
  if (err instanceof StreamResolutionError) return err.retryable;
  const kind = classifyError(err);
  return kind !== "no_stream" && kind !== "decode_failure";
}

/** Maps technical errors to short UI copy (Settings / watch overlay). */
export function normalizeStreamErrorMessage(err: unknown): string {
  const raw = rawMessage(err);
  const kind = classifyError(err);
  switch (kind) {
    case "no_stream":
      return "No playable stream for this episode from current sources. Try another episode or switch sub/dub if available.";
    case "timeout":
      return "Connection timed out or the service was busy. Retry, or wait a moment and try again.";
    case "upstream_4xx":
      return "Could not load episode data from the source. Try again later.";
    case "upstream_5xx":
      return "Source server error. Try again in a few minutes.";
    case "decode_failure":
      return "Failed to decode stream source data. The provider format may have changed.";
    default:
      return raw.length > 220 ? `${raw.slice(0, 217)}…` : raw;
  }
}

/** Structured error info for diagnostics export. */
export interface StreamDiagnostic {
  kind: StreamErrorKind;
  provider: string;
  message: string;
  timestamp: string;
  showId: string;
  episode: string;
  mode: "sub" | "dub";
}

const recentDiagnostics: StreamDiagnostic[] = [];
const MAX_DIAGNOSTICS = 50;

export function getRecentStreamDiagnostics(): readonly StreamDiagnostic[] {
  return recentDiagnostics;
}

export function clearStreamDiagnostics(): void {
  recentDiagnostics.length = 0;
}

function recordDiagnostic(
  err: unknown,
  providerName: string,
  showId: string,
  episode: string,
  mode: "sub" | "dub"
): void {
  const diag: StreamDiagnostic = {
    kind: classifyError(err),
    provider: providerName,
    message: rawMessage(err),
    timestamp: new Date().toISOString(),
    showId,
    episode,
    mode,
  };
  recentDiagnostics.unshift(diag);
  if (recentDiagnostics.length > MAX_DIAGNOSTICS) {
    recentDiagnostics.length = MAX_DIAGNOSTICS;
  }
}

export async function getStreamUrl(
  showId: string,
  episode: string,
  mode: "sub" | "dub" = "sub"
): Promise<StreamUrlResult> {
  let lastErr: unknown;

  for (const provider of providers) {
    const caps = provider.capabilities;
    if (mode === "sub" && !caps.supportsSub) continue;
    if (mode === "dub" && !caps.supportsDub) continue;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await withTimeout(
          provider.getStreamUrl(showId, episode, mode),
          STREAM_TOTAL_MS,
          `${caps.name} stream resolution`
        );
      } catch (e) {
        lastErr = e;
        recordDiagnostic(e, caps.name, showId, episode, mode);
        if (!isRetryable(e)) break;
        if (attempt < MAX_ATTEMPTS) await delay(BACKOFF_BASE_MS * attempt);
      }
    }
  }

  throw new Error(normalizeStreamErrorMessage(lastErr));
}
