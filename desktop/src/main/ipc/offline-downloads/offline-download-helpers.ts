/** Pure helpers for offline download pipeline (testable without Electron). */

export function isLikelyHlsUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (u.includes(".m3u8")) return true;
  if (u.includes("application/x-mpegurl")) return true;
  return false;
}

export function isMpegUrlContentType(ct: string | null): boolean {
  if (!ct) return false;
  const c = ct.toLowerCase();
  return c.includes("mpegurl") || c.includes("m3u8");
}

export function pickExtensionFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const m = pathname.match(/\.(mp4|webm|mkv|mov|m4v)$/);
    return m ? `.${m[1]}` : null;
  } catch {
    return null;
  }
}

export function extensionFromMime(ct: string | null): string | null {
  if (!ct) return null;
  const c = ct.toLowerCase();
  if (c.includes("video/mp4")) return ".mp4";
  if (c.includes("video/webm")) return ".webm";
  if (c.includes("video/quicktime")) return ".mov";
  if (c.includes("video/x-matroska")) return ".mkv";
  return null;
}

const BAD_NAME_CHARS = new Set('<>:"/\\|?*');

export function safeFileSegment(s: string, maxLen: number): string {
  let t = "";
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 32 || BAD_NAME_CHARS.has(ch)) t += "_";
    else t += ch;
  }
  t = t.trim();
  return (t.length > 0 ? t : "show").slice(0, maxLen);
}
