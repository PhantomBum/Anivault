/**
 * AllAnime poster pipeline: `getShowDetails().thumbnail` → optional IndexedDB cache → blob URL.
 * AniList covers are layered in the UI (`useAnilistEnrichment` + `anilist.ts`).
 */

import type { Dispatch, SetStateAction } from "react";

import { getAniCli } from "@/renderer/lib/ani-cli-bridge";
import { fetchWithRetry } from "@/renderer/lib/fetch-with-retry";
import { forEachWithConcurrency } from "@/renderer/lib/for-each-with-concurrency";
import { cacheThumbnail, getCachedThumbnail } from "@/renderer/lib/local-cache";

type FetchedShowDetails = Awaited<ReturnType<ReturnType<typeof getAniCli>["getShowDetails"]>>;

/** Each call hits the network; cap parallel work so grids stay responsive. */
export const SHOW_DETAILS_FETCH_CONCURRENCY = 4;

/** Shown when `getShowDetails` fails — never use raw anime id as display name. */
export const UNKNOWN_SERIES_LABEL = "Unknown series";

export type ShowDetailsSummary = { name: string; thumbnail: string | null };

async function resolveThumbnailDisplayUrl(
  animeId: string,
  remoteUrl: string | null
): Promise<string | null> {
  const cached = await getCachedThumbnail(animeId);
  if (cached) {
    return URL.createObjectURL(cached);
  }
  if (!remoteUrl) return null;
  try {
    const res = await fetchWithRetry(remoteUrl, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
    }, { timeoutMs: 25_000, maxRetries: 2 });
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    await cacheThumbnail(animeId, blob);
    return URL.createObjectURL(blob);
  } catch {
    return remoteUrl;
  }
}

/**
 * Warms IndexedDB poster cache for the given ids (idle-time prefetch on search, etc.).
 */
export async function prefetchThumbnailCache(
  animeIds: string[],
  concurrency: number,
  cancelled: () => boolean
): Promise<void> {
  if (animeIds.length === 0) return;
  const aniCli = getAniCli();
  await forEachWithConcurrency(animeIds, concurrency, async (animeId) => {
    if (cancelled()) return;
    try {
      const existing = await getCachedThumbnail(animeId);
      if (existing) return;
      const details = await aniCli.getShowDetails(animeId);
      if (cancelled()) return;
      const url = details.thumbnail;
      if (!url) return;
      const res = await fetchWithRetry(
        url,
        { credentials: "omit", referrerPolicy: "no-referrer" },
        { timeoutMs: 25_000, maxRetries: 1 }
      );
      if (!res.ok) return;
      const blob = await res.blob();
      await cacheThumbnail(animeId, blob);
    } catch {
      /* ignore prefetch failures */
    }
  });
}

/**
 * Fetches `getShowDetails` for each item and merges `thumbnail` into a map keyed by `id`.
 */
export async function mergeShowThumbnailsFromShowDetails<T extends { id: string }>(
  toFetch: T[],
  concurrency: number,
  setMap: Dispatch<SetStateAction<Record<string, string | null>>>,
  cancelled: () => boolean
): Promise<void> {
  if (toFetch.length === 0) return;
  const aniCli = getAniCli();
  await forEachWithConcurrency(toFetch, concurrency, async (anime) => {
    if (cancelled()) return;
    try {
      const cachedBlob = await getCachedThumbnail(anime.id);
      if (cancelled()) return;
      if (cachedBlob) {
        const url = URL.createObjectURL(cachedBlob);
        setMap((prev) =>
          prev[anime.id] !== undefined ? prev : { ...prev, [anime.id]: url }
        );
        return;
      }
      let details: FetchedShowDetails;
      try {
        details = await aniCli.getShowDetails(anime.id);
      } catch {
        if (cancelled()) return;
        await new Promise((r) => setTimeout(r, 400));
        if (cancelled()) return;
        try {
          details = await aniCli.getShowDetails(anime.id);
        } catch {
          if (cancelled()) return;
          setMap((prev) =>
            prev[anime.id] !== undefined ? prev : { ...prev, [anime.id]: null }
          );
          return;
        }
      }
      if (cancelled()) return;
      const thumb = await resolveThumbnailDisplayUrl(anime.id, details.thumbnail ?? null);
      setMap((prev) =>
        prev[anime.id] !== undefined ? prev : { ...prev, [anime.id]: thumb }
      );
    } catch {
      if (cancelled()) return;
      setMap((prev) =>
        prev[anime.id] !== undefined ? prev : { ...prev, [anime.id]: null }
      );
    }
  });
}

/**
 * Fetches `getShowDetails` for each anime id and merges name + thumbnail.
 */
export async function mergeShowDetailsByAnimeId(
  animeIds: string[],
  concurrency: number,
  setDetails: Dispatch<SetStateAction<Record<string, ShowDetailsSummary>>>,
  cancelled: () => boolean
): Promise<void> {
  if (animeIds.length === 0) return;
  const aniCli = getAniCli();
  await forEachWithConcurrency(animeIds, concurrency, async (animeId) => {
    if (cancelled()) return;
    try {
      let details: FetchedShowDetails;
      try {
        details = await aniCli.getShowDetails(animeId);
      } catch {
        if (cancelled()) return;
        await new Promise((r) => setTimeout(r, 400));
        if (cancelled()) return;
        details = await aniCli.getShowDetails(animeId);
      }
      if (cancelled()) return;
      const thumb = await resolveThumbnailDisplayUrl(animeId, details.thumbnail ?? null);
      setDetails((prev) => ({
        ...prev,
        [animeId]: { name: details.name, thumbnail: thumb },
      }));
    } catch {
      if (cancelled()) return;
      setDetails((prev) =>
        prev[animeId] !== undefined
          ? prev
          : { ...prev, [animeId]: { name: UNKNOWN_SERIES_LABEL, thumbnail: null } }
      );
    }
  });
}
