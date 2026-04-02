/**
 * Small in-memory cache for ani-cli IPC — bounded to keep RAM flat on long sessions.
 */

import type { AnimeSearchResult } from "@/renderer/lib/ani-cli-bridge";

const DEFAULT_TTL_MS = 45_000;
const MAX_SEARCH_ENTRIES = 28;
const MAX_RECENT_ENTRIES = 6;

const searchCache = new Map<string, { at: number; data: AnimeSearchResult[] }>();
const recentCache = new Map<string, { at: number; data: { items: AnimeSearchResult[]; hasMore: boolean } }>();

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

export function invalidateAniSearchCache(): void {
  searchCache.clear();
}
