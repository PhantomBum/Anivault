/** Shared resilient fetch for flaky networks (Electron, public Wi‑Fi, etc.). */

const DEFAULT_TIMEOUT_MS = 14_000;
const DEFAULT_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldRetry(status: number, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false;
  if (status === 429 || status === 503 || status === 502 || status === 504) return true;
  return false;
}

export type FetchWithRetryOptions = {
  timeoutMs?: number;
  maxRetries?: number;
  /** Extra ms before retry (exponential: base * 2^attempt) */
  retryDelayBaseMs?: number;
};

/**
 * Fetch with timeout and limited retries on transient failures.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  options?: FetchWithRetryOptions
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options?.maxRetries ?? DEFAULT_RETRIES;
  const retryDelayBaseMs = options?.retryDelayBaseMs ?? 400;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const ac = new AbortController();
    const t = window.setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(input, {
        ...init,
        signal: ac.signal,
      });
      window.clearTimeout(t);
      if (!res.ok) {
        if (shouldRetry(res.status, attempt, maxRetries)) {
          await sleep(retryDelayBaseMs * Math.pow(2, attempt));
          continue;
        }
      }
      return res;
    } catch (e) {
      window.clearTimeout(t);
      lastErr = e;
      const isAbort = e instanceof DOMException && e.name === "AbortError";
      if (attempt < maxRetries && !isAbort) {
        await sleep(retryDelayBaseMs * Math.pow(2, attempt));
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("fetchWithRetry: failed");
}
