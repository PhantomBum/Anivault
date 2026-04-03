/**
 * Playback URLs passed to <video> may be blob:, data:, or http(s) app proxy URLs.
 * Only offer "copy stream link" for normal HTTP(S) URLs (local proxy), not opaque blobs.
 */
export function isPlaybackUrlCopySafe(url: string): boolean {
  const u = url.trim();
  if (!u) return false;
  const lower = u.toLowerCase();
  if (lower.startsWith("blob:") || lower.startsWith("data:")) return false;
  return lower.startsWith("http://") || lower.startsWith("https://");
}
