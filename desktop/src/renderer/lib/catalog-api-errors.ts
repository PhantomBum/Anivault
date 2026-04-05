/**
 * User-facing copy when the AllAnime catalog API fails (search, recent, episodes).
 */
export function formatCatalogApiError(message: string): string {
  const m = message.trim();
  if (/403|Forbidden/i.test(m)) {
    return "Catalog search is temporarily unavailable (blocked by the provider). Try again later, or check your network / VPN.";
  }
  if (/429|rate|too many/i.test(m)) {
    return "Too many catalog requests. Wait a moment and try again.";
  }
  if (/timed out|timeout|AbortError/i.test(m)) {
    return "Catalog request timed out. Check your connection and try again.";
  }
  return m;
}
