/**
 * Optional AniList GraphQL enrichment (public API, no key).
 * Labels in UI must say "AniList" — not from the streaming provider.
 *
 * Posters: we request up to 12 candidates per search, prefer the first row with a
 * cover image, then fall back to a normalized title query (see `normalizeAniListSearchQuery`).
 */

import { fetchWithRetry } from "@/renderer/lib/fetch-with-retry";

export type AniListMediaExtra = {
  averageScore: number | null;
  description: string | null;
  genres: string[];
  siteUrl: string | null;
};

/** Grid/search tiles — batched carefully; results are cached in memory by title key. */
export type AniListSearchTile = {
  anilistId: number;
  format: string | null;
  seasonYear: number | null;
  episodes: number | null;
  averageScore: number | null;
  genres: string[];
  titleRomaji: string | null;
  titleEnglish: string | null;
  coverUrl: string | null;
};

const searchTileCache = new Map<string, AniListSearchTile | null>();
const mediaExtraCache = new Map<string, AniListMediaExtra | null>();
const bundleCache = new Map<string, { extra: AniListMediaExtra | null; tile: AniListSearchTile | null }>();

function cacheKey(search: string) {
  return search.trim().toLowerCase();
}

async function anilistGraphql<T>(body: object): Promise<T | null> {
  try {
    const res = await fetchWithRetry(
      "https://graphql.anilist.co",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      },
      { timeoutMs: 22_000, maxRetries: 2, retryDelayBaseMs: 500 }
    );
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchAniListByTitle(search: string): Promise<AniListMediaExtra | null> {
  const q = search.trim();
  if (q.length < 2) return null;
  const key = cacheKey(q);
  if (mediaExtraCache.has(key)) {
    return mediaExtraCache.get(key) ?? null;
  }
  const bundle = await fetchAniListBundleByTitle(search);
  return bundle.extra;
}

type AniListMediaRow = {
  id?: number;
  format?: string | null;
  seasonYear?: number | null;
  episodes?: number | null;
  averageScore?: number | null;
  genres?: string[];
  title?: { romaji?: string | null; english?: string | null; userPreferred?: string | null };
  coverImage?: { large?: string | null; medium?: string | null };
  description?: string | null;
  siteUrl?: string | null;
};

type AniListSearchTileResponse = {
  data?: {
    Page?: {
      media?: AniListMediaRow[];
    };
  };
};

/**
 * Strips brackets, parentheticals, and noisy labels from provider titles so AniList
 * can match the base series name on a second pass.
 */
export function normalizeAniListSearchQuery(raw: string): string {
  return raw
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:TV|OVA|ONA|Special|Movie|BD|DVD)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickBestMediaRow(media: AniListMediaRow[] | null | undefined): AniListMediaRow | null {
  if (!media?.length) return null;
  const withCover = media.find((m) => m.coverImage?.large || m.coverImage?.medium);
  return withCover ?? media[0] ?? null;
}

function rowToBundle(m: AniListMediaRow): { extra: AniListMediaExtra; tile: AniListSearchTile } | null {
  if (m.id == null) return null;
  const extra: AniListMediaExtra = {
    averageScore: m.averageScore ?? null,
    description: m.description ?? null,
    genres: Array.isArray(m.genres) ? m.genres : [],
    siteUrl: m.siteUrl ?? null,
  };
  const coverUrl = m.coverImage?.large ?? m.coverImage?.medium ?? null;
  const tile: AniListSearchTile = {
    anilistId: m.id,
    format: m.format ?? null,
    seasonYear: m.seasonYear ?? null,
    episodes: m.episodes ?? null,
    averageScore: m.averageScore ?? null,
    genres: Array.isArray(m.genres) ? m.genres : [],
    titleRomaji: m.title?.romaji ?? m.title?.userPreferred ?? null,
    titleEnglish: m.title?.english ?? null,
    coverUrl,
  };
  return { extra, tile };
}

const PAGE_QUERY = `
  query ($search: String) {
    Page(perPage: 12) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        format
        seasonYear
        episodes
        averageScore
        description(asHtml: false)
        genres
        siteUrl
        title { romaji english userPreferred }
        coverImage { large medium }
      }
    }
  }
`;

async function fetchBundleForSearchString(search: string): Promise<{
  extra: AniListMediaExtra | null;
  tile: AniListSearchTile | null;
}> {
  const q = search.trim();
  if (q.length < 2) {
    return { extra: null, tile: null };
  }

  const json = await anilistGraphql<AniListSearchTileResponse>({
    query: PAGE_QUERY,
    variables: { search: q },
  });

  if (!json) {
    return { extra: null, tile: null };
  }

  const m = pickBestMediaRow(json.data?.Page?.media);
  if (!m) {
    return { extra: null, tile: null };
  }

  const bundle = rowToBundle(m);
  if (!bundle) {
    return { extra: null, tile: null };
  }
  return bundle;
}

async function resolveBundleWithFallbacks(originalTrimmed: string): Promise<{
  extra: AniListMediaExtra | null;
  tile: AniListSearchTile | null;
}> {
  const primary = await fetchBundleForSearchString(originalTrimmed);
  if (primary.tile?.coverUrl) {
    return primary;
  }

  const norm = normalizeAniListSearchQuery(originalTrimmed);
  if (norm.length < 2 || cacheKey(norm) === cacheKey(originalTrimmed)) {
    return primary;
  }

  const secondary = await fetchBundleForSearchString(norm);
  if (secondary.tile?.coverUrl) {
    return secondary;
  }
  if (primary.tile) {
    return primary;
  }
  return secondary;
}

/**
 * Single GraphQL round-trip (plus optional normalized retry): metadata + tile (posters, scores, etc.).
 */
export async function fetchAniListBundleByTitle(search: string): Promise<{
  extra: AniListMediaExtra | null;
  tile: AniListSearchTile | null;
}> {
  const q = search.trim();
  if (q.length < 2) {
    return { extra: null, tile: null };
  }
  const key = cacheKey(q);
  const cachedBundle = bundleCache.get(key);
  if (cachedBundle) {
    return cachedBundle;
  }

  const out = await resolveBundleWithFallbacks(q);
  bundleCache.set(key, out);
  searchTileCache.set(key, out.tile);
  mediaExtraCache.set(key, out.extra);
  return out;
}

/**
 * One match per search string (with multi-candidate + normalized fallback). Call with concurrency limits from the UI layer.
 */
export async function fetchAniListSearchTile(search: string): Promise<AniListSearchTile | null> {
  const q = search.trim();
  if (q.length < 2) return null;
  const key = cacheKey(q);
  if (searchTileCache.has(key)) {
    return searchTileCache.get(key) ?? null;
  }
  const bundle = await fetchAniListBundleByTitle(search);
  return bundle.tile;
}
