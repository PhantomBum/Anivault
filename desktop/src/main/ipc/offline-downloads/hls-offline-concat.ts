/**
 * Best-effort HLS (VOD-style) download: fetch unencrypted .ts segments and concatenate.
 * DRM / AES-128 encrypted streams are rejected. Master playlists resolve to the first variant.
 */

export function resolveAgainstBase(href: string, baseUrl: string): string {
  try {
    return new URL(href.trim(), baseUrl).href;
  } catch {
    return href;
  }
}

/** If `text` is a master playlist, return absolute URL of the first variant `.m3u8`; else null. */
export function pickFirstVariantUrl(text: string, baseUrl: string): string | null {
  const lines = text.split(/\n/).map((l) => l.trim());
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.startsWith("#EXT-X-STREAM-INF")) {
      const next = lines[i + 1];
      if (next && !next.startsWith("#")) {
        return resolveAgainstBase(next, baseUrl);
      }
    }
  }
  return null;
}

export type ParsedMediaPlaylist = {
  segmentUrls: string[];
  encrypted: boolean;
};

export function parseMediaPlaylist(text: string, baseUrl: string): ParsedMediaPlaylist {
  const segmentUrls: string[] = [];
  let encrypted = false;
  const lines = text.split(/\n/).map((l) => l.trim());

  for (const line of lines) {
    if (!line) continue;
    if (line.includes("#EXT-X-KEY")) {
      if (line.includes("METHOD=AES-128") || line.includes("METHOD=SAMPLE-AES")) {
        encrypted = true;
      }
    }
    if (line.startsWith("#")) continue;
    if (line.toLowerCase().endsWith(".m3u8")) {
      continue;
    }
    segmentUrls.push(resolveAgainstBase(line, baseUrl));
  }

  return { segmentUrls, encrypted };
}

/** Cap avoids runaway playlists (live streams, bugs). */
export const MAX_HLS_SEGMENTS = 800;
