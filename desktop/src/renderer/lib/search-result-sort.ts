import type { AniListSearchTile } from "@/renderer/lib/anilist";
import type { AnimeSearchResult } from "@/shared/anime-result";

export type SearchSortMode =
  | "match"
  | "name"
  | "name-desc"
  | "episodes"
  | "episodes-asc"
  | "score"
  | "year"
  | "year-asc";

const VALID_SORT: SearchSortMode[] = [
  "match",
  "name",
  "name-desc",
  "episodes",
  "episodes-asc",
  "score",
  "year",
  "year-asc",
];

export function normalizeSearchSortMode(raw: unknown): SearchSortMode {
  if (typeof raw === "string" && (VALID_SORT as string[]).includes(raw)) {
    return raw as SearchSortMode;
  }
  return "match";
}

export function sortAnimeSearchResults(
  list: AnimeSearchResult[],
  mode: SearchSortMode,
  enrichMap: Record<string, AniListSearchTile | null | undefined>,
  sourceOrder: Map<string, number>
): AnimeSearchResult[] {
  const out = [...list];
  if (mode === "match") {
    out.sort((a, b) => (sourceOrder.get(a.id) ?? 9999) - (sourceOrder.get(b.id) ?? 9999));
  } else if (mode === "name") {
    out.sort((a, b) => a.name.localeCompare(b.name));
  } else if (mode === "name-desc") {
    out.sort((a, b) => b.name.localeCompare(a.name));
  } else if (mode === "episodes") {
    out.sort((a, b) => b.episodeCount - a.episodeCount);
  } else if (mode === "episodes-asc") {
    out.sort((a, b) => a.episodeCount - b.episodeCount);
  } else if (mode === "score") {
    out.sort((a, b) => {
      const sa = enrichMap[a.id]?.averageScore;
      const sb = enrichMap[b.id]?.averageScore;
      const na = sa == null ? -1 : sa;
      const nb = sb == null ? -1 : sb;
      return nb - na;
    });
  } else if (mode === "year") {
    out.sort((a, b) => {
      const ya = enrichMap[a.id]?.seasonYear;
      const yb = enrichMap[b.id]?.seasonYear;
      return (yb ?? 0) - (ya ?? 0);
    });
  } else if (mode === "year-asc") {
    out.sort((a, b) => {
      const ya = enrichMap[a.id]?.seasonYear;
      const yb = enrichMap[b.id]?.seasonYear;
      const na = ya == null ? 99999 : ya;
      const nb = yb == null ? 99999 : yb;
      return na - nb;
    });
  }
  return out;
}
