import { AnimeTitleCard } from "@/renderer/components/anime-title-card";
import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/renderer/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/renderer/components/ui/sheet";
import { useDebouncedValue } from "@/renderer/hooks/use-debounced-value";
import { useAnilistEnrichment } from "@/renderer/hooks/use-anilist-enrichment";
import type { AniListSearchTile } from "@/renderer/lib/anilist";
import {
  mergeShowThumbnailsFromShowDetails,
  prefetchThumbnailCache,
  SHOW_DETAILS_FETCH_CONCURRENCY,
} from "@/renderer/lib/fetch-show-thumbnails";
import { inferMatureRating } from "@/renderer/lib/mature-content";
import { seriesFingerprint } from "@/renderer/lib/series-fingerprint";
import type { AnimeSearchResult } from "@/shared/anime-result";
import { ChevronDown, ChevronRight, Filter, LayoutGrid, List, Play, Search } from "lucide-react";
import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { ListChildComponentProps } from "react-window";
import { VariableSizeList } from "react-window";

const SEARCH_DEBOUNCE_MS = 400;
const VIRTUAL_THRESHOLD = 24;

const SEARCH_PREFS_KEY = "anivault-find-shows-prefs";
type SearchPrefs = {
  viewMode?: "grid" | "list";
  groupBySeries?: boolean;
  filterMode?: "all" | "sub" | "dub";
  sortMode?: "match" | "name" | "episodes";
};

function loadSearchPrefs(): Partial<SearchPrefs> {
  try {
    const raw = localStorage.getItem(SEARCH_PREFS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SearchPrefs;
  } catch {
    return {};
  }
}

const RECENT_SEARCHES_KEY = "anivault-recent-searches";
const MAX_RECENT_SEARCHES = 8;

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr)
      ? arr
          .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
          .slice(0, MAX_RECENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

const ANILIST_GENRE_FILTERS = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

type EpisodesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; episodes: string[] }
  | { status: "error"; message: string };

type SearchRowData = {
  results: AnimeSearchResult[];
  expandedId: string | null;
  episodesByShowId: Record<string, EpisodesState>;
  toggleExpand: (anime: AnimeSearchResult) => void;
  playEpisode: (anime: AnimeSearchResult, episode: string, episodes: string[]) => void;
  playingEpisode: string | null;
};

function rowHeightFor(index: number, ctx: SearchRowData): number {
  const anime = ctx.results[index];
  if (!anime) return 56;
  if (ctx.expandedId !== anime.id) return 56;
  const st = ctx.episodesByShowId[anime.id];
  if (!st || st.status === "idle") return 56;
  if (st.status === "loading" || st.status === "error") return 96;
  const n = st.episodes.length;
  const chipRows = Math.ceil(Math.max(n, 1) / 6);
  return Math.min(480, Math.max(128, 52 + chipRows * 36 + 40));
}

function SearchResultRow({ index, style, data }: ListChildComponentProps<SearchRowData>) {
  const {
    results,
    expandedId,
    episodesByShowId,
    toggleExpand,
    playEpisode,
    playingEpisode,
  } = data;
  const anime = results[index];
  if (!anime) return null;
  const isExpanded = expandedId === anime.id;
  const episodesState = episodesByShowId[anime.id] ?? { status: "idle" as const };
  const mature = inferMatureRating(anime.name);

  return (
    <div style={style} className="border-b border-[var(--av-border)] bg-[var(--av-bg)]">
      <button
        type="button"
        onClick={() => toggleExpand(anime)}
        className="flex h-14 w-full items-center justify-between gap-4 px-4 text-left text-[var(--av-text)] transition-colors hover:bg-[var(--av-surface-hover)]/80"
      >
        <span className="flex min-w-0 items-center gap-2 font-medium">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--av-muted)]" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--av-muted)]" />
          )}
          <span className="min-w-0 truncate" title={anime.name}>
            {anime.name}
          </span>
          {mature !== "none" ? (
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase text-white ${
                mature === "explicit" ? "bg-red-600" : "bg-amber-600"
              }`}
            >
              {mature === "explicit" ? "18+" : "Ecchi"}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-sm text-[var(--av-muted)]">
          {anime.episodeCount} episodes ({anime.mode})
        </span>
      </button>
      {isExpanded && (
        <div className="border-t border-[var(--av-border)]/80 bg-[var(--av-surface)]/50 px-4 pb-4 pl-12 pt-0">
          {episodesState.status === "loading" && (
            <p className="py-2 text-sm text-[var(--av-muted)]">Loading episodes…</p>
          )}
          {episodesState.status === "error" && (
            <p className="py-2 text-sm text-red-400">{episodesState.message}</p>
          )}
          {episodesState.status === "loaded" && (
            <ul className="flex flex-wrap gap-2 py-2">
              {episodesState.episodes.map((ep) => {
                const isPlaying = playingEpisode === `${anime.id}-${ep}`;
                return (
                  <li key={ep}>
                    <button
                      type="button"
                      onClick={() => playEpisode(anime, ep, episodesState.episodes)}
                      disabled={isPlaying}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--av-border)] bg-[var(--av-bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--av-text)] transition-colors hover:border-[var(--av-accent-dim)] hover:bg-[var(--av-surface-hover)] disabled:opacity-50"
                    >
                      <Play className="h-3 w-3 shrink-0" />
                      {isPlaying ? "Resolving…" : ep}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function pickPrimaryShow(group: AnimeSearchResult[], enrich: Record<string, AniListSearchTile | null | undefined>) {
  return group.reduce((best, cur) => {
    const tb = enrich[best.id];
    const tc = enrich[cur.id];
    const sb = tb && typeof tb === "object" ? tb.averageScore ?? 0 : -1;
    const sc = tc && typeof tc === "object" ? tc.averageScore ?? 0 : -1;
    if (sc > sb) return cur;
    if (sc === sb && cur.episodeCount > best.episodeCount) return cur;
    return best;
  });
}

export function AnimeSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const deferredQuery = useDeferredValue(debouncedQuery);
  const [apiResults, setApiResults] = useState<AnimeSearchResult[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "sub" | "dub">(
    () => loadSearchPrefs().filterMode ?? "all"
  );
  const [sortMode, setSortMode] = useState<"match" | "name" | "episodes">(
    () => loadSearchPrefs().sortMode ?? "match"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => loadSearchPrefs().viewMode ?? "grid");
  const [groupBySeries, setGroupBySeries] = useState(() => loadSearchPrefs().groupBySeries ?? false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [episodesByShowId, setEpisodesByShowId] = useState<Record<string, EpisodesState>>({});
  const [playingEpisode, setPlayingEpisode] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState(0);
  const [yearMin, setYearMin] = useState<number | null>(null);
  const [maturityFilter, setMaturityFilter] = useState<"all" | "none" | "ecchi" | "explicit">("all");
  const [thumbById, setThumbById] = useState<Record<string, string | null>>({});

  const searchGen = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [listWidth, setListWidth] = useState(0);
  const listRef = useRef<VariableSizeList | null>(null);

  useEffect(() => {
    const q = debouncedQuery.trim();
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (q) next.set("q", q);
        else next.delete("q");
        return next;
      },
      { replace: true }
    );
  }, [debouncedQuery, setSearchParams]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SEARCH_PREFS_KEY,
        JSON.stringify({ viewMode, groupBySeries, filterMode, sortMode })
      );
    } catch {
      /* ignore */
    }
  }, [viewMode, groupBySeries, filterMode, sortMode]);

  useEffect(() => {
    const st = location.state as { focusSearch?: boolean } | null;
    if (!st?.focusSearch) return;
    const t = window.setTimeout(() => {
      searchInputRef.current?.focus();
      navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: {} });
    }, 0);
    return () => window.clearTimeout(t);
  }, [location.state, location.pathname, location.search, navigate]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (loading || error || apiResults.length === 0 || q.length < 2) return;
    setRecentSearches((prev) => {
      if (prev[0] === q) return prev;
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [debouncedQuery, loading, error, apiResults.length]);

  const audioSorted = useMemo(() => {
    let list = [...apiResults];
    if (filterMode === "sub") {
      list = list.filter((a) => a.mode === "sub" || a.hasSub);
    } else if (filterMode === "dub") {
      list = list.filter((a) => a.mode === "dub" || a.hasDub);
    }
    if (sortMode === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === "episodes") {
      list.sort((a, b) => b.episodeCount - a.episodeCount);
    }
    return list;
  }, [apiResults, filterMode, sortMode]);

  useEffect(() => {
    setThumbById({});
  }, [debouncedQuery]);

  useEffect(() => {
    let cancelled = false;
    if (audioSorted.length === 0) return;
    void mergeShowThumbnailsFromShowDetails(
      audioSorted,
      SHOW_DETAILS_FETCH_CONCURRENCY,
      setThumbById,
      () => cancelled
    );
    return () => {
      cancelled = true;
    };
  }, [audioSorted]);

  const enrichMap = useAnilistEnrichment(audioSorted, debouncedQuery);

  const needsAniMeta = useMemo(() => {
    return (
      selectedGenres.length > 0 ||
      formatFilter !== "all" ||
      minScore > 0 ||
      yearMin != null ||
      maturityFilter !== "all"
    );
  }, [selectedGenres.length, formatFilter, minScore, yearMin, maturityFilter]);

  const results = useMemo(() => {
    return audioSorted.filter((a) => {
      const t = enrichMap[a.id];
      if (!needsAniMeta) return true;
      if (t === undefined) return true;
      if (t === null) return false;
      if (selectedGenres.length > 0 && !selectedGenres.some((g) => t.genres.includes(g))) {
        return false;
      }
      if (formatFilter !== "all" && (t.format || "").toUpperCase() !== formatFilter.toUpperCase()) {
        return false;
      }
      if (minScore > 0 && (t.averageScore == null || t.averageScore < minScore)) {
        return false;
      }
      if (yearMin != null && (t.seasonYear == null || t.seasonYear < yearMin)) {
        return false;
      }
      if (maturityFilter !== "all") {
        const g = t.genres.map((x) => x.toLowerCase());
        const ecchiGenre = g.some((x) => x.includes("ecchi") || x.includes("erot"));
        const infer = inferMatureRating(a.name);
        if (maturityFilter === "none" && (ecchiGenre || infer !== "none")) return false;
        if (maturityFilter === "ecchi" && !(ecchiGenre || infer === "ecchi")) return false;
        if (maturityFilter === "explicit" && infer !== "explicit" && !g.some((x) => x.includes("hentai"))) {
          return false;
        }
      }
      return true;
    });
  }, [audioSorted, enrichMap, needsAniMeta, selectedGenres, formatFilter, minScore, yearMin, maturityFilter]);

  const displayGroups = useMemo(() => {
    if (!groupBySeries) {
      return results.map((r) => ({ key: r.id, items: [r] }));
    }
    const m = new Map<string, AnimeSearchResult[]>();
    for (const r of results) {
      const fp = seriesFingerprint(r.name);
      let bucket = m.get(fp);
      if (!bucket) {
        bucket = [];
        m.set(fp, bucket);
      }
      bucket.push(r);
    }
    return [...m.entries()].map(([fp, items]) => ({ key: fp, items }));
  }, [results, groupBySeries]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setApiResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    const gen = ++searchGen.current;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExpandedId(null);
    setEpisodesByShowId({});
    window.aniCli
      .search(q)
      .then((list) => {
        if (cancelled || gen !== searchGen.current) return;
        setApiResults(list);
      })
      .catch((err) => {
        if (cancelled || gen !== searchGen.current) return;
        setError(err instanceof Error ? err.message : "Search failed");
      })
      .finally(() => {
        if (cancelled || gen !== searchGen.current) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    if (apiResults.length === 0 || loading) return;
    const ids = apiResults.slice(0, 8).map((a) => a.id);
    let cancelled = false;
    const run = () => {
      void prefetchThumbnailCache(ids, 2, () => cancelled);
    };
    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(run, { timeout: 2500 });
    } else {
      timeoutHandle = window.setTimeout(run, 400);
    }
    return () => {
      cancelled = true;
      if (idleHandle != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle != null) {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, [apiResults, loading]);

  useEffect(() => {
    setExpandedId(null);
  }, [filterMode, sortMode]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setListWidth(el.clientWidth));
    ro.observe(el);
    setListWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const loadEpisodes = useCallback(async (anime: AnimeSearchResult) => {
    setEpisodesByShowId((prev) => ({ ...prev, [anime.id]: { status: "loading" } }));
    try {
      const episodes = await window.aniCli.getEpisodes(anime.id, anime.mode);
      setEpisodesByShowId((prev) => ({
        ...prev,
        [anime.id]: { status: "loaded", episodes },
      }));
    } catch (err) {
      setEpisodesByShowId((prev) => ({
        ...prev,
        [anime.id]: {
          status: "error",
          message: err instanceof Error ? err.message : "Failed to load episodes",
        },
      }));
    }
  }, []);

  const toggleExpand = useCallback(
    (anime: AnimeSearchResult) => {
      const isExpanded = expandedId === anime.id;
      if (isExpanded) {
        setExpandedId(null);
      } else {
        setExpandedId(anime.id);
        const state = episodesByShowId[anime.id];
        if (state?.status !== "loaded") void loadEpisodes(anime);
      }
    },
    [expandedId, episodesByShowId, loadEpisodes]
  );

  const playEpisode = useCallback(
    (anime: AnimeSearchResult, episode: string, episodes: string[]) => {
      setPlayingEpisode(`${anime.id}-${episode}`);
      navigate("/watch", {
        state: {
          anime: { id: anime.id, name: anime.name, mode: anime.mode },
          episodes,
          currentEpisode: episode,
        },
      });
      setPlayingEpisode(null);
    },
    [navigate]
  );

  const openDetail = useCallback(
    (anime: AnimeSearchResult) => {
      navigate(`/anime/${encodeURIComponent(anime.id)}`);
    },
    [navigate]
  );

  const quickPlay = useCallback(
    async (anime: AnimeSearchResult) => {
      try {
        const episodes = await window.aniCli.getEpisodes(anime.id, anime.mode);
        if (episodes.length === 0) return;
        navigate("/watch", {
          state: {
            anime: { id: anime.id, name: anime.name, mode: anime.mode },
            episodes,
            currentEpisode: episodes[0],
          },
        });
      } catch {
        /* ignore */
      }
    },
    [navigate]
  );

  const listData = useMemo<SearchRowData>(
    () => ({
      results,
      expandedId,
      episodesByShowId,
      toggleExpand,
      playEpisode,
      playingEpisode,
    }),
    [results, expandedId, episodesByShowId, toggleExpand, playEpisode, playingEpisode]
  );

  const getItemSize = useCallback((index: number) => rowHeightFor(index, listData), [listData]);

  useEffect(() => {
    listRef.current?.resetAfterIndex(0, true);
  }, [expandedId, episodesByShowId]);

  const listHeight = Math.min(560, Math.max(200, Math.min(results.length, 12) * 56 + 8));

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  return (
    <div className="container flex max-w-[1600px] flex-col gap-6 bg-[var(--av-bg)] p-4 text-[var(--av-text)] sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Find shows</h1>
        <p className="mt-1 text-sm text-[var(--av-muted)]">
          Grid by default — AniList enriches posters and filters (not the stream source). Press{" "}
          <kbd className="rounded border border-[var(--av-border)] bg-[var(--av-surface)] px-1.5 py-0.5 font-mono text-[10px]">
            Ctrl K
          </kbd>{" "}
          from anywhere to jump here.
        </p>
      </div>

      {recentSearches.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--av-muted)]">
            Recent
          </span>
          {recentSearches.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setQuery(r)}
              className="rounded-full border border-[var(--av-border)] bg-[var(--av-surface)] px-3 py-1 text-xs text-[var(--av-text)] transition hover:border-[var(--av-accent-dim)] hover:bg-[var(--av-surface-hover)]"
            >
              {r}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--av-muted)]" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="e.g. one piece, spy x family"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-2xl border-[var(--av-border)] bg-[var(--av-bg-elevated)] pl-9 text-[var(--av-text)] placeholder:text-[var(--av-muted-foreground)]"
            disabled={loading}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] p-0.5">
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-xl"
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              Grid
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-xl"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
            >
              <List className="mr-1.5 h-4 w-4" />
              List
            </Button>
          </div>
          <Button
            type="button"
            variant={groupBySeries ? "secondary" : "outline"}
            size="sm"
            className="rounded-2xl border-[var(--av-border)]"
            onClick={() => setGroupBySeries((v) => !v)}
          >
            Group series
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-[var(--av-border)] bg-[var(--av-surface)]"
                aria-label="Filters"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full flex-col overflow-y-auto border-[var(--av-border)] bg-[var(--av-surface)] sm:max-w-md"
            >
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <p className="text-left text-xs text-[var(--av-muted)]">
                  Audio and sort apply immediately. Genre, format, score, and year use AniList matches
                  when available; titles without a match are hidden when those filters are active.
                </p>
              </SheetHeader>
              <div className="mt-4 space-y-5 text-sm">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--av-muted)]">Audio</p>
                  <Select
                    value={filterMode}
                    onValueChange={(v) => setFilterMode(v as typeof filterMode)}
                  >
                    <SelectTrigger className="h-9 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs">
                      <SelectValue placeholder="Audio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="sub">Sub</SelectItem>
                      <SelectItem value="dub">Dub</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--av-muted)]">Sort</p>
                  <Select value={sortMode} onValueChange={(v) => setSortMode(v as typeof sortMode)}>
                    <SelectTrigger className="h-9 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match">Source order</SelectItem>
                      <SelectItem value="name">Title A–Z</SelectItem>
                      <SelectItem value="episodes">Episode count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--av-muted)]">Genres (AniList)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ANILIST_GENRE_FILTERS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] ${
                          selectedGenres.includes(g)
                            ? "border-[var(--av-accent)] bg-[var(--av-accent-muted)] text-[var(--av-text)]"
                            : "border-[var(--av-border)] bg-[var(--av-bg)] text-[var(--av-muted)]"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--av-muted)]">Format</p>
                  <Select value={formatFilter} onValueChange={setFormatFilter}>
                    <SelectTrigger className="h-9 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="TV">TV</SelectItem>
                      <SelectItem value="MOVIE">Movie</SelectItem>
                      <SelectItem value="OVA">OVA</SelectItem>
                      <SelectItem value="ONA">ONA</SelectItem>
                      <SelectItem value="SPECIAL">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--av-muted)]">
                    Min score (AniList /100)
                  </p>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={minScore || ""}
                    onChange={(e) => setMinScore(Number(e.target.value) || 0)}
                    className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--av-muted)]">Min year</p>
                  <Input
                    type="number"
                    min={1960}
                    max={2035}
                    value={yearMin ?? ""}
                    onChange={(e) =>
                      setYearMin(e.target.value ? Number(e.target.value) : null)
                    }
                    className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs"
                    placeholder="Any"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--av-muted)]">Maturity</p>
                  <Select
                    value={maturityFilter}
                    onValueChange={(v) => setMaturityFilter(v as typeof maturityFilter)}
                  >
                    <SelectTrigger className="h-9 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="none">Hide ecchi / explicit</SelectItem>
                      <SelectItem value="ecchi">Ecchi / mature</SelectItem>
                      <SelectItem value="explicit">Explicit only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[10px] text-[var(--av-muted-foreground)]">
                  {results.length} titles match · {apiResults.length} from source
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {viewMode === "grid" && displayGroups.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {displayGroups.map((g) => {
            const primary = pickPrimaryShow(g.items, enrichMap);
            const t = enrichMap[primary.id];
            return (
              <AnimeTitleCard
                key={g.key}
                result={primary}
                tile={t === undefined ? undefined : t}
                fallbackPosterUrl={thumbById[primary.id]}
                onOpenDetail={() => openDetail(primary)}
                onQuickPlay={() => void quickPlay(primary)}
              />
            );
          })}
        </div>
      ) : null}

      {viewMode === "list" && results.length > VIRTUAL_THRESHOLD ? (
        <div
          ref={containerRef}
          className="min-h-[200px] w-full rounded-xl border border-dashed border-[var(--av-border)] bg-[var(--av-surface)]/40"
        >
          {listWidth > 0 ? (
            <VariableSizeList
              ref={listRef}
              height={listHeight}
              width={listWidth}
              itemCount={results.length}
              itemSize={getItemSize}
              itemData={listData}
              overscanCount={4}
            >
              {SearchResultRow}
            </VariableSizeList>
          ) : null}
        </div>
      ) : null}

      {viewMode === "list" && results.length > 0 && results.length <= VIRTUAL_THRESHOLD ? (
        <ul className="max-h-[min(70vh,560px)] divide-y divide-[var(--av-border)] overflow-y-auto rounded-xl border border-dashed border-[var(--av-border)] bg-[var(--av-surface)]/40">
          {results.map((anime) => {
            const isExpanded = expandedId === anime.id;
            const episodesState = episodesByShowId[anime.id] ?? { status: "idle" as const };
            const mature = inferMatureRating(anime.name);
            return (
              <li key={anime.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleExpand(anime)}
                  className="flex items-center justify-between gap-4 rounded-none px-4 py-3 text-left text-[var(--av-text)] transition-colors hover:bg-[var(--av-surface-hover)]/80"
                >
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[var(--av-muted)]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--av-muted)]" />
                    )}
                    <span className="truncate" title={anime.name}>
                      {anime.name}
                    </span>
                    {mature !== "none" ? (
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase text-white ${
                          mature === "explicit" ? "bg-red-600" : "bg-amber-600"
                        }`}
                      >
                        {mature === "explicit" ? "18+" : "Ecchi"}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-sm text-[var(--av-muted)]">
                    {anime.episodeCount} episodes ({anime.mode})
                  </span>
                </button>
                {isExpanded && (
                  <div className="border-t border-[var(--av-border)]/80 bg-[var(--av-surface)]/50 px-4 pb-4 pl-12 pt-0">
                    {episodesState.status === "loading" && (
                      <p className="py-2 text-sm text-[var(--av-muted)]">Loading episodes…</p>
                    )}
                    {episodesState.status === "error" && (
                      <p className="py-2 text-sm text-red-400">{episodesState.message}</p>
                    )}
                    {episodesState.status === "loaded" && (
                      <ul className="flex flex-wrap gap-2 py-2">
                        {episodesState.episodes.map((ep) => {
                          const isPlaying = playingEpisode === `${anime.id}-${ep}`;
                          return (
                            <li key={ep}>
                              <button
                                type="button"
                                onClick={() => playEpisode(anime, ep, episodesState.episodes)}
                                disabled={isPlaying}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--av-border)] bg-[var(--av-bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--av-text)] transition-colors hover:border-[var(--av-accent-dim)] hover:bg-[var(--av-surface-hover)] disabled:opacity-50"
                              >
                                <Play className="h-3 w-3 shrink-0" />
                                {isPlaying ? "Resolving…" : ep}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {!loading && results.length === 0 && deferredQuery.trim() && !error && (
        <p className="text-sm text-[var(--av-muted)]">No results found.</p>
      )}
    </div>
  );
}
