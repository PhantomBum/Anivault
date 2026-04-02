import { fetchAniListSearchTile, type AniListSearchTile } from "@/renderer/lib/anilist";
import { forEachWithConcurrency } from "@/renderer/lib/for-each-with-concurrency";
import type { AnimeSearchResult } from "@/shared/anime-result";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Fetches AniList poster/metadata for each show in the list (concurrency-limited).
 * Pass `limit` only if you must cap API volume; default enriches every row.
 * Clears when `resetKey` changes (e.g. new search query).
 */
export function useAnilistEnrichment(
  shows: readonly AnimeSearchResult[],
  resetKey: string,
  limit?: number
): Record<string, AniListSearchTile | null | undefined> {
  const [enrichMap, setEnrichMap] = useState<Record<string, AniListSearchTile | null | undefined>>({});
  const startedRef = useRef(new Set<string>());
  const genRef = useRef(0);

  const sig = useMemo(() => shows.map((s) => s.id).join("\u0001"), [shows]);

  useEffect(() => {
    startedRef.current.clear();
    setEnrichMap({});
  }, [resetKey]);

  useEffect(() => {
    if (shows.length === 0) return;
    const gen = ++genRef.current;
    let cancelled = false;
    const slice =
      limit != null && limit < shows.length ? shows.slice(0, limit) : shows;
    void (async () => {
      await forEachWithConcurrency(slice, 5, async (a) => {
        if (cancelled || gen !== genRef.current) return;
        if (startedRef.current.has(a.id)) return;
        startedRef.current.add(a.id);
        const tile = await fetchAniListSearchTile(a.name);
        if (cancelled || gen !== genRef.current) return;
        setEnrichMap((prev) => ({ ...prev, [a.id]: tile }));
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [shows, limit, sig, resetKey]);

  return enrichMap;
}
