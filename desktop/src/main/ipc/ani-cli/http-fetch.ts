/**
 * Bounded fetch for AllAnime / provider calls — avoids hung streams when upstream stalls.
 */

export type FetchWithTimeoutInit = RequestInit & { timeoutMs?: number };

export async function fetchWithTimeout(
  input: string | URL,
  init: FetchWithTimeoutInit = {}
): Promise<Response> {
  const { timeoutMs = 14000, ...rest } = init;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...rest,
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(id);
  }
}
