/**
 * Shared HTTP for api.allanime.day — matches browser-like requests (Origin, Chrome UA).
 * POST JSON is tried first (avoids long-URL GET blocks); falls back to legacy GET query string.
 */
import { fetchWithTimeout } from "./http-fetch";

export const ALLANIME_API = "https://api.allanime.day";
/** Site the API expects in Referer / Origin (matches pystardust/ani-cli). */
export const ALLANIME_REFERER = "https://allmanga.to";

/** Exported for stream / m3u8 fetches that need a matching UA string. */
export const ALLANIME_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function baseHeaders(includeJsonContentType: boolean): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Origin: ALLANIME_REFERER,
    Referer: `${ALLANIME_REFERER}/`,
    "User-Agent": ALLANIME_USER_AGENT,
  };
  if (includeJsonContentType) {
    h["Content-Type"] = "application/json";
  }
  return h;
}

/** Headers for AllAnime GET requests (streams, episode embed JSON, legacy GraphQL GET). */
export function allanimeGetHeaders(): Record<string, string> {
  return baseHeaders(false);
}

/**
 * GraphQL over HTTP: POST `{ query, variables }` to `/api`, then GET fallback.
 */
export async function fetchAllanimeGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const url = `${ALLANIME_API}/api`;
  const body = JSON.stringify({ query, variables });

  let res = await fetchWithTimeout(url, {
    method: "POST",
    headers: baseHeaders(true),
    body,
    timeoutMs: 28000,
  });

  if (!res.ok) {
    const getUrl = `${url}?variables=${encodeURIComponent(JSON.stringify(variables))}&query=${encodeURIComponent(query)}`;
    res = await fetchWithTimeout(getUrl, {
      method: "GET",
      headers: baseHeaders(false),
      timeoutMs: 28000,
    });
  }

  if (!res.ok) {
    throw new Error(`allanime API error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}
