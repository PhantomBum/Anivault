/**
 * In-memory cache for ani-cli IPC — fewer round-trips when browsing back/forth.
 * TTLs are long enough to feel instant on repeat views without unbounded growth.
 */

import type { AnimeSearchResult, ShowDetails } from "@/renderer/lib/ani-cli-bridge";

/** Search / discover lists — shorter TTL keeps RAM from holding stale large arrays. */
const DEFAULT_TTL_MS = 4 * 60 * 1000;
const EPISODE_TTL_MS = 8 * 60 * 1000;
const DETAILS_TTL_MS = 8 * 60 * 1000;

const MAX_SEARCH_ENTRIES = 32;
const MAX_RECENT_ENTRIES = 8;
const MAX_EPISODE_ENTRIES = 40;
const MAX_DETAILS_ENTRIES = 40;

const searchCache = new Map<string, { at: number; data: AnimeSearchResult[] }>();
const recentCache = new Map<string, { at: number; data: { items: AnimeSearchResult[]; hasMore: boolean } }>();
const episodesCache = new Map<string, { at: number; data: string[] }>();
const detailsCache = new Map<string, { at: number; data: ShowDetails }>();

function cacheKeySearch(q: string): string {
  return q.trim().toLowerCase();
}

function evictOldest<K extends string>(
  map: Map<K, { at: number }>,
  maxSize: number
): void {
  while (map.size > maxSize) {
    let oldestK: K | null = null;
    let oldestAt = Infinity;
    for (const [k, v] of map) {
      if (v.at < oldestAt) {
        oldestAt = v.at;
        oldestK = k;
      }
    }
    if (oldestK != null) map.delete(oldestK);
    else break;
  }
}

export async function cachedAniSearch(
  query: string,
  fetcher: () => Promise<AnimeSearchResult[]>,
  ttlMs = DEFAULT_TTL_MS
): Promise<AnimeSearchResult[]> {
  const k = cacheKeySearch(query);
  if (!k) return fetcher();
  const hit = searchCache.get(k);
  const now = Date.now();
  if (hit && now - hit.at < ttlMs) return hit.data;
  const data = await fetcher();
  searchCache.set(k, { at: now, data });
  evictOldest(searchCache, MAX_SEARCH_ENTRIES);
  return data;
}

export async function cachedAniRecent(
  page: number,
  limit: number,
  fetcher: () => Promise<{ items: AnimeSearchResult[]; hasMore: boolean }>,
  ttlMs = DEFAULT_TTL_MS
): Promise<{ items: AnimeSearchResult[]; hasMore: boolean }> {
  const key = `p${page}-l${limit}` as const;
  const hit = recentCache.get(key);
  const now = Date.now();
  if (hit && now - hit.at < ttlMs) return hit.data;
  const data = await fetcher();
  recentCache.set(key, { at: now, data });
  evictOldest(recentCache, MAX_RECENT_ENTRIES);
  return data;
}

function episodeKey(showId: string, mode: "sub" | "dub"): string {
  return `${showId}\u0000${mode}`;
}

/**
 * Caches episode lists per show + sub/dub (speeds up details, watch, discover quick-play).
 */
export async function cachedGetEpisodes(
  showId: string,
  mode: "sub" | "dub",
  fetcher: () => Promise<string[]>,
  ttlMs = EPISODE_TTL_MS
): Promise<string[]> {
  const k = episodeKey(showId, mode);
  const hit = episodesCache.get(k);
  const now = Date.now();
  if (hit && now - hit.at < ttlMs) return hit.data;
  const data = await fetcher();
  episodesCache.set(k, { at: now, data });
  evictOldest(episodesCache, MAX_EPISODE_ENTRIES);
  return data;
}

/**
 * Caches `getShowDetails` for poster/title/description (thumbnails + details page).
 */
export async function cachedGetShowDetails(
  showId: string,
  fetcher: () => Promise<ShowDetails>,
  ttlMs = DETAILS_TTL_MS
): Promise<ShowDetails> {
  const hit = detailsCache.get(showId);
  const now = Date.now();
  if (hit && now - hit.at < ttlMs) return hit.data;
  const data = await fetcher();
  detailsCache.set(showId, { at: now, data });
  evictOldest(detailsCache, MAX_DETAILS_ENTRIES);
  return data;
}

export function invalidateAniSearchCache(): void {
  searchCache.clear();
}

export function invalidateShowCachesForId(showId: string): void {
  detailsCache.delete(showId);
  episodesCache.delete(episodeKey(showId, "sub"));
  episodesCache.delete(episodeKey(showId, "dub"));
}
