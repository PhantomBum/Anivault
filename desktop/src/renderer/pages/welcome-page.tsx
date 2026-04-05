import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Compass,
  Filter,
  Grid3x3,
  LayoutList,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { AniVaultWordmark } from "@/renderer/components/anivault-wordmark";
import { HorizontalCarousel, PosterPlaceholder } from "@/renderer/components/horizontal-carousel";
import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/renderer/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/renderer/components/ui/select";
import { cn } from "@/renderer/lib/utils";
import { useAnilistEnrichment } from "@/renderer/hooks/use-anilist-enrichment";
import { useDebouncedValue } from "@/renderer/hooks/use-debounced-value";
import { useWelcomeSearch } from "@/renderer/hooks/use-welcome-search";
import { useWelcomeRecentlyWatched } from "@/renderer/hooks/use-welcome-recently-watched";
import {
  type AnimeSearchResult as AnimeSearchResultType,
  getAniCli,
} from "@/renderer/lib/ani-cli-bridge";
import {
  cachedAniRecent,
  cachedAniSearch,
  cachedGetEpisodes,
  invalidateAniRecentCache,
  invalidateAniSearchCache,
} from "@/renderer/lib/ani-session-cache";
import { CATALOG_REFRESH_EVENT } from "@/renderer/lib/catalog-refresh-event";
import {
  UNKNOWN_SERIES_LABEL,
  mergeShowDetailsByAnimeId,
  mergeShowThumbnailsFromShowDetails,
  SHOW_DETAILS_FETCH_CONCURRENCY,
  type ShowDetailsSummary,
} from "@/renderer/lib/fetch-show-thumbnails";
import { inferMatureRating, isMatureContentBlocked } from "@/renderer/lib/mature-content";
import {
  normalizeSearchSortMode,
  sortAnimeSearchResults,
  type SearchSortMode,
} from "@/renderer/lib/search-result-sort";
import { addLocalWatchlistEntry } from "@/renderer/lib/local-watchlist";
import { showToast } from "@/renderer/lib/av-toast";
import { useAnivaultConfig } from "@/renderer/context/anivault-config-context";
import type { WatchProgressContinueItem } from "@/shared/watch-progress-types";
import { type RecentlyWatchedEntry } from "@/renderer/lib/recently-watched-bridge";

const SEARCH_DEBOUNCE_MS = 95;

function recentCardTitle(
  entry: RecentlyWatchedEntry,
  details: ShowDetailsSummary | undefined
): string {
  if (entry.displayName?.trim()) return entry.displayName.trim();
  if (details === undefined) return "Loading…";
  if (details.name && details.name !== UNKNOWN_SERIES_LABEL) return details.name;
  return UNKNOWN_SERIES_LABEL;
}

function getAvailabilityLabel(anime: AnimeSearchResultType): string {
  const hasSub = anime.hasSub ?? anime.mode === "sub";
  const hasDub = anime.hasDub ?? anime.mode === "dub";

  if (hasSub && hasDub) return "sub / dub";
  if (hasDub) return "dub";
  return "sub";
}

export function WelcomePage() {
  const { t } = useTranslation();
  const { config } = useAnivaultConfig();
  const allowMature = config?.allowMatureContent ?? false;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [catalogRefreshNonce, setCatalogRefreshNonce] = useState(0);
  const [filterMode, setFilterMode] = useState<"all" | "sub" | "dub">("all");
  const [sortMode, setSortMode] = useState<SearchSortMode>("match");

  const { results: rawResults, loading, error, searchThumbnails } = useWelcomeSearch(
    debouncedQuery,
    catalogRefreshNonce
  );
  const { recentlyWatched, recentlyWatchedLoading, recentlyWatchedDetails, clearRecentlyWatched } =
    useWelcomeRecentlyWatched();

  const [spotlight, setSpotlight] = useState<AnimeSearchResultType[]>([]);
  const [spotlightThumbs, setSpotlightThumbs] = useState<Record<string, string | null>>({});
  const [spotlightPosterFailed, setSpotlightPosterFailed] = useState<Record<string, boolean>>({});
  const [spotlightHero, setSpotlightHero] = useState(0);
  const [progressStats, setProgressStats] = useState<{ trackedEpisodes: number } | null>(null);
  const [freshPicks, setFreshPicks] = useState<AnimeSearchResultType[]>([]);
  const [freshThumbs, setFreshThumbs] = useState<Record<string, string | null>>({});
  const [continueItems, setContinueItems] = useState<WatchProgressContinueItem[]>([]);
  const [continueDetails, setContinueDetails] = useState<Record<string, ShowDetailsSummary>>({});

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (!window.watchProgress?.listContinue) return false;
      void window.watchProgress
        .listContinue(10)
        .then((items) => {
          if (!cancelled) setContinueItems(items);
        })
        .catch(() => {
          if (!cancelled) setContinueItems([]);
        });
      return true;
    };
    if (load()) {
      return () => {
        cancelled = true;
      };
    }
    const t = window.setTimeout(() => {
      if (!cancelled) load();
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (continueItems.length === 0) return;
    let cancelled = false;
    const ids = [...new Set(continueItems.map((c) => c.animeId))];
    void mergeShowDetailsByAnimeId(
      ids,
      SHOW_DETAILS_FETCH_CONCURRENCY,
      setContinueDetails,
      () => cancelled
    );
    return () => {
      cancelled = true;
    };
  }, [continueItems]);

  const bumpCatalogRefresh = useCallback(() => {
    invalidateAniSearchCache();
    invalidateAniRecentCache();
    setCatalogRefreshNonce((n) => n + 1);
    showToast(t("refreshUpdate.toast"));
  }, [t]);

  useEffect(() => {
    const on = () => bumpCatalogRefresh();
    window.addEventListener(CATALOG_REFRESH_EVENT, on);
    return () => window.removeEventListener(CATALOG_REFRESH_EVENT, on);
  }, [bumpCatalogRefresh]);

  useEffect(() => {
    let cancelled = false;
    void cachedAniSearch("one", () => getAniCli().search("one"))
      .then((list) => {
        if (!cancelled) setSpotlight(list.slice(0, 8));
      })
      .catch(() => {
        if (!cancelled) setSpotlight([]);
      });
    return () => {
      cancelled = true;
    };
  }, [catalogRefreshNonce]);

  useEffect(() => {
    let cancelled = false;
    void cachedAniRecent(1, 16, () => getAniCli().getRecent(1, 16))
      .then((r) => {
        if (!cancelled) setFreshPicks(r.items);
      })
      .catch(() => {
        if (!cancelled) setFreshPicks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [catalogRefreshNonce]);

  useEffect(() => {
    let cancelled = false;
    if (freshPicks.length === 0) return;
    void mergeShowThumbnailsFromShowDetails(
      freshPicks,
      SHOW_DETAILS_FETCH_CONCURRENCY,
      setFreshThumbs,
      () => cancelled
    );
    return () => {
      cancelled = true;
    };
  }, [freshPicks]);

  useEffect(() => {
    let cancelled = false;
    if (spotlight.length === 0) return;
    void mergeShowThumbnailsFromShowDetails(
      spotlight,
      SHOW_DETAILS_FETCH_CONCURRENCY,
      setSpotlightThumbs,
      () => cancelled
    );
    return () => {
      cancelled = true;
    };
  }, [spotlight]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (!window.watchProgress) return false;
      void window.watchProgress
        .stats()
        .then((s) => {
          if (!cancelled) setProgressStats(s);
        })
        .catch(() => {
          if (!cancelled) setProgressStats(null);
        });
      return true;
    };
    if (load()) {
      return () => {
        cancelled = true;
      };
    }
    const t = window.setTimeout(() => {
      if (!cancelled) load();
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    setSpotlightPosterFailed({});
  }, [spotlight]);

  const audioFiltered = useMemo(() => {
    let list = [...rawResults];
    if (filterMode === "sub") {
      list = list.filter((a) => a.mode === "sub" || a.hasSub);
    } else if (filterMode === "dub") {
      list = list.filter((a) => a.mode === "dub" || a.hasDub);
    }
    return list;
  }, [rawResults, filterMode]);

  const matureFiltered = useMemo(
    () =>
      audioFiltered.filter(
        (a) => !isMatureContentBlocked(allowMature, inferMatureRating(a.name))
      ),
    [audioFiltered, allowMature]
  );

  const welcomeSearchOrder = useMemo(
    () => new Map(rawResults.map((a, i) => [a.id, i])),
    [rawResults]
  );

  const welcomeEnrichMap = useAnilistEnrichment(matureFiltered, debouncedQuery, 32);

  const results = useMemo(
    () =>
      sortAnimeSearchResults(
        matureFiltered,
        sortMode,
        welcomeEnrichMap,
        welcomeSearchOrder
      ),
    [matureFiltered, sortMode, welcomeEnrichMap, welcomeSearchOrder]
  );

  const spotlightVisible = useMemo(
    () =>
      spotlight.filter(
        (s) => !isMatureContentBlocked(allowMature, inferMatureRating(s.name))
      ),
    [spotlight, allowMature]
  );

  const freshVisible = useMemo(
    () =>
      freshPicks.filter(
        (s) => !isMatureContentBlocked(allowMature, inferMatureRating(s.name))
      ),
    [freshPicks, allowMature]
  );

  useEffect(() => {
    setSpotlightHero((i) =>
      spotlightVisible.length === 0 ? 0 : Math.min(i, spotlightVisible.length - 1)
    );
  }, [spotlightVisible]);

  const openAniCliRepo = useCallback(() => {
    const url = "https://github.com/pystardust/ani-cli";
    if (window.urlOpener) {
      void window.urlOpener.openUrl(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  const openSearchResult = useCallback(
    (anime: AnimeSearchResultType) => {
      navigate(`/anime/${anime.id}`, {
        state: { anime },
      });
    },
    [navigate]
  );

  const resumeContinue = useCallback(
    async (item: WatchProgressContinueItem) => {
      const d = continueDetails[item.animeId];
      const name =
        d?.name && d.name !== UNKNOWN_SERIES_LABEL ? d.name : item.animeId;
      try {
        const episodes = await cachedGetEpisodes(item.animeId, item.mode, () =>
          getAniCli().getEpisodes(item.animeId, item.mode)
        );
        if (episodes.length === 0) return;
        navigate("/watch", {
          state: {
            anime: { id: item.animeId, name, mode: item.mode },
            episodes,
            currentEpisode: item.episode,
          },
        });
      } catch {
        /* ignore */
      }
    },
    [navigate, continueDetails]
  );

  const openRecentlyWatched = useCallback(
    (entry: RecentlyWatchedEntry) => {
      const resolved = recentlyWatchedDetails[entry.animeId]?.name;
      const name =
        entry.displayName ??
        (resolved && resolved !== UNKNOWN_SERIES_LABEL ? resolved : undefined) ??
        resolved ??
        "Anime";
      navigate("/watch", {
        state: {
          anime: { id: entry.animeId, name, mode: entry.mode },
          episodes: [],
          currentEpisode: entry.episode,
        },
      });
    },
    [navigate, recentlyWatchedDetails]
  );

  const hero = spotlightVisible[spotlightHero];
  const spotlightLen = spotlightVisible.length;

  const goPrevSpotlight = useCallback(() => {
    if (spotlightLen <= 1) return;
    setSpotlightHero((i) => (i - 1 + spotlightLen) % spotlightLen);
  }, [spotlightLen]);

  const goNextSpotlight = useCallback(() => {
    if (spotlightLen <= 1) return;
    setSpotlightHero((i) => (i + 1) % spotlightLen);
  }, [spotlightLen]);

  return (
    <div className="relative min-h-[calc(100dvh-3rem)] bg-[var(--av-bg)] text-[var(--av-text)] antialiased">
      <div className="pointer-events-none absolute inset-0 av-home-mesh opacity-75" aria-hidden />
      <div className="av-page-shell relative flex w-full max-w-5xl flex-col gap-6 md:gap-7">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--av-border)]/55 pb-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <AniVaultWordmark size="lg" className="shrink-0" />
            <div className="min-w-0">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--av-muted-foreground)]">
                Unvaulted
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--av-muted)]">
                <button
                  type="button"
                  onClick={openAniCliRepo}
                  className="font-medium text-[var(--av-text)] underline decoration-[var(--av-border)]/90 underline-offset-2 hover:decoration-[var(--av-accent-dim)]"
                >
                  ani-cli
                </button>
                {" · "}catalog & playback
              </p>
            </div>
          </div>
          {progressStats != null && progressStats.trackedEpisodes > 0 ? (
            <p className="m-0 text-[10px] text-[var(--av-muted)]">
              {progressStats.trackedEpisodes} ep. progress saved
            </p>
          ) : null}
        </header>

        {continueItems.length > 0 ? (
          <section className="rounded-xl border border-[var(--av-border)]/70 bg-[var(--av-bg-elevated)]/30 p-3 md:p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <Play className="h-3.5 w-3.5 text-indigo-400/90" aria-hidden />
              <h2 className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--av-muted)]">
                Continue watching
              </h2>
            </div>
            <HorizontalCarousel
              variant="home"
              items={continueItems.map((c) => {
                const cd = continueDetails[c.animeId];
                const label =
                  cd?.name && cd.name !== UNKNOWN_SERIES_LABEL ? cd.name : c.animeId;
                const pct =
                  c.durationSec > 0
                    ? Math.min(100, Math.round((c.positionSec / c.durationSec) * 100))
                    : 0;
                return {
                  id: `${c.animeId}-${c.episode}-${c.mode}`,
                  coverUrl: continueDetails[c.animeId]?.thumbnail ?? null,
                  title: label,
                  subtitle: `${c.episode} · ${c.mode.toUpperCase()} · ${pct}%`,
                  mature: inferMatureRating(label),
                  onClick: () => void resumeContinue(c),
                  onContextCopyTitle: () => void navigator.clipboard.writeText(label),
                  onContextOpenDetails: () =>
                    navigate(`/anime/${encodeURIComponent(c.animeId)}`, {
                      state: {
                        anime: {
                          id: c.animeId,
                          name: label,
                          episodeCount: 0,
                          mode: c.mode,
                        },
                      },
                    }),
                  onContextAddToMyLists: () => {
                    const { added } = addLocalWatchlistEntry({
                      id: c.animeId,
                      name: label,
                      mode: c.mode,
                    });
                    showToast(
                      added ? t("contextMenu.toastAddedToLists") : t("contextMenu.toastAlreadyInLists")
                    );
                  },
                  onContextRemoveFromContinue: () => {
                    if (!window.watchProgress?.clearSeries) return;
                    void window.watchProgress.clearSeries(c.animeId).then(() => {
                      setContinueItems((prev) => prev.filter((x) => x.animeId !== c.animeId));
                      void window.watchProgress?.stats().then(setProgressStats).catch(() => undefined);
                    });
                  },
                };
              })}
            />
          </section>
        ) : null}

        <section className="av-glass-panel relative rounded-xl p-3 sm:p-4 motion-safe:animate-av-fade-up">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--av-muted)]">
              Search catalog
            </p>
            <span className="text-[10px] text-[var(--av-muted-foreground)]">cached</span>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[var(--av-muted-foreground)]"
                strokeWidth={1.75}
              />
              <Input
                type="text"
                placeholder="Titles, keywords…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={cn(
                  "h-10 rounded-lg border border-[var(--av-border)] bg-[var(--av-bg)]/90 pl-10 pr-3 text-sm text-[var(--av-text)] shadow-av-xs transition-[box-shadow,border-color] duration-200",
                  "placeholder:text-[var(--av-muted-foreground)]",
                  "focus-visible:border-indigo-400/40 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:ring-offset-0 focus-visible:ring-offset-[var(--av-bg)]"
                )}
                autoFocus
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 rounded-lg border-[var(--av-border)] bg-[var(--av-surface)]/90 px-3 text-xs text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
              onClick={bumpCatalogRefresh}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {t("refreshUpdate.button")}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 rounded-lg border-[var(--av-border)] bg-[var(--av-surface)]/90 px-3 text-xs text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
                  aria-label="Search filters"
                >
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 border-[var(--av-border)] bg-[var(--av-surface)] p-4 text-[var(--av-text)]"
                align="end"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-[var(--av-muted)]">Audio</p>
                    <Select
                      value={filterMode}
                      onValueChange={(v) => setFilterMode(v as typeof filterMode)}
                    >
                      <SelectTrigger className="rounded-2xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs shadow-av-xs">
                        <SelectValue />
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
                    <Select
                      value={sortMode}
                      onValueChange={(v) => setSortMode(normalizeSearchSortMode(v))}
                    >
                      <SelectTrigger className="rounded-2xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs shadow-av-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match">Source order</SelectItem>
                        <SelectItem value="name">Title A→Z</SelectItem>
                        <SelectItem value="name-desc">Title Z→A</SelectItem>
                        <SelectItem value="episodes">Episodes (most)</SelectItem>
                        <SelectItem value="episodes-asc">Episodes (fewest)</SelectItem>
                        <SelectItem value="score">AniList score</SelectItem>
                        <SelectItem value="year">Year (newest)</SelectItem>
                        <SelectItem value="year-asc">Year (oldest)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[10px] text-[var(--av-muted-foreground)]">
                    Filters apply after results load from ani-cli.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
          <Link
            to="/discover"
            className="flex min-h-[3.25rem] flex-col justify-center rounded-lg border border-[var(--av-border)]/80 bg-[var(--av-surface)]/35 px-3 py-2 text-left transition-colors hover:border-indigo-400/35 hover:bg-[var(--av-surface-hover)]/80"
          >
            <div className="flex items-center gap-2">
              <Compass className="h-3.5 w-3.5 shrink-0 text-indigo-400/90" aria-hidden />
              <span className="text-xs font-semibold text-[var(--av-text)]">Discover</span>
            </div>
            <span className="mt-0.5 pl-[1.375rem] text-[10px] leading-tight text-[var(--av-muted)]">Catalog rows</span>
          </Link>
          <Link
            to="/browse"
            className="flex min-h-[3.25rem] flex-col justify-center rounded-lg border border-[var(--av-border)]/80 bg-[var(--av-surface)]/35 px-3 py-2 text-left transition-colors hover:border-violet-400/30 hover:bg-[var(--av-surface-hover)]/80"
          >
            <div className="flex items-center gap-2">
              <Grid3x3 className="h-3.5 w-3.5 shrink-0 text-violet-400/90" aria-hidden />
              <span className="text-xs font-semibold text-[var(--av-text)]">Browse</span>
            </div>
            <span className="mt-0.5 pl-[1.375rem] text-[10px] leading-tight text-[var(--av-muted)]">Merged grid</span>
          </Link>
          <Link
            to="/lists"
            className="flex min-h-[3.25rem] flex-col justify-center rounded-lg border border-[var(--av-border)]/80 bg-[var(--av-surface)]/35 px-3 py-2 text-left transition-colors hover:border-rose-400/30 hover:bg-[var(--av-surface-hover)]/80"
          >
            <div className="flex items-center gap-2">
              <LayoutList className="h-3.5 w-3.5 shrink-0 text-rose-400/90" aria-hidden />
              <span className="text-xs font-semibold text-[var(--av-text)]">Lists</span>
            </div>
            <span className="mt-0.5 pl-[1.375rem] text-[10px] leading-tight text-[var(--av-muted)]">Saved</span>
          </Link>
          <Link
            to="/schedule"
            className="flex min-h-[3.25rem] flex-col justify-center rounded-lg border border-[var(--av-border)]/80 bg-[var(--av-surface)]/35 px-3 py-2 text-left transition-colors hover:border-cyan-400/30 hover:bg-[var(--av-surface-hover)]/80"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-cyan-400/90" aria-hidden />
              <span className="text-xs font-semibold text-[var(--av-text)]">Schedule</span>
            </div>
            <span className="mt-0.5 pl-[1.375rem] text-[10px] leading-tight text-[var(--av-muted)]">Airing</span>
          </Link>
        </div>

        {freshVisible.length > 0 ? (
          <section className="rounded-xl border border-[var(--av-border)]/70 bg-[var(--av-bg-elevated)]/25 p-3 md:p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-400/80" aria-hidden />
              <h2 className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--av-muted)]">
                Fresh on the catalog
              </h2>
            </div>
            <HorizontalCarousel
              variant="home"
              items={freshVisible.map((anime) => ({
                id: anime.id,
                coverUrl: freshThumbs[anime.id] ?? null,
                title: anime.name,
                subtitle: `Episode ${anime.episodeCount} · ${getAvailabilityLabel(anime)}`,
                mature: inferMatureRating(anime.name),
                onClick: () => openSearchResult(anime),
                onContextCopyTitle: () => void navigator.clipboard.writeText(anime.name),
                onContextOpenDetails: () =>
                  navigate(`/anime/${anime.id}`, { state: { anime } }),
                onContextAddToMyLists: () => {
                  const { added } = addLocalWatchlistEntry({
                    id: anime.id,
                    name: anime.name,
                    mode: anime.mode,
                  });
                  showToast(
                    added ? t("contextMenu.toastAddedToLists") : t("contextMenu.toastAlreadyInLists")
                  );
                },
              }))}
            />
          </section>
        ) : null}

        {hero ? (
          <section className="relative overflow-hidden rounded-xl border border-[var(--av-border)]/80 shadow-lg shadow-black/25 ring-1 ring-white/[0.04]">
            {spotlightThumbs[hero.id] && !spotlightPosterFailed[hero.id] ? (
              <>
                <div
                  className="pointer-events-none absolute -inset-8 scale-110 bg-cover bg-center opacity-45 blur-3xl saturate-150"
                  style={{ backgroundImage: `url(${spotlightThumbs[hero.id]})` }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.22]"
                  style={{ backgroundImage: `url(${spotlightThumbs[hero.id]})` }}
                  aria-hidden
                />
              </>
            ) : null}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--av-bg)]/95 via-[var(--av-bg)]/75 to-[var(--av-bg-elevated)]/85"
              aria-hidden
            />
            <div className="relative flex flex-col gap-4 p-4 backdrop-blur-xl backdrop-saturate-150 sm:p-5 lg:flex-row lg:items-stretch lg:gap-5 bg-[color-mix(in_srgb,var(--av-bg-elevated)_72%,transparent)]">
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md border border-[var(--av-border)]/90 bg-[var(--av-bg)] sm:h-32 sm:w-[5.25rem]">
                  {(() => {
                    const thumbResolved = hero.id in spotlightThumbs;
                    const thumbUrl = spotlightThumbs[hero.id];
                    if (!thumbResolved) {
                      return (
                        <div className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-[var(--av-muted)]">
                          …
                        </div>
                      );
                    }
                    if (thumbUrl && !spotlightPosterFailed[hero.id]) {
                      return (
                        <img
                          src={thumbUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          decoding="async"
                          className="h-full w-full object-cover"
                          onError={() =>
                            setSpotlightPosterFailed((p) => ({ ...p, [hero.id]: true }))
                          }
                        />
                      );
                    }
                    return <PosterPlaceholder title={hero.name} />;
                  })()}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--av-muted)]">
                      Spotlight
                    </p>
                    {spotlightLen > 1 ? (
                      <div className="flex shrink-0 gap-0.5">
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--av-border)] bg-[var(--av-bg)] text-[var(--av-muted)] transition-colors hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)]"
                          aria-label="Previous spotlight"
                          onClick={goPrevSpotlight}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--av-border)] bg-[var(--av-bg)] text-[var(--av-muted)] transition-colors hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)]"
                          aria-label="Next spotlight"
                          onClick={goNextSpotlight}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-snug tracking-tight text-[var(--av-text)] sm:text-xl">
                      {hero.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--av-muted)]">
                      {hero.episodeCount} episodes · {getAvailabilityLabel(hero)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 rounded-lg px-3 text-xs"
                      onClick={() => openSearchResult(hero)}
                    >
                      Details
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg border-[var(--av-border)] px-3 text-xs"
                      asChild
                    >
                      <Link to="/discover">Discover</Link>
                    </Button>
                  </div>
                  {spotlightLen > 1 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1" role="tablist" aria-label="Spotlight picks">
                      {spotlightVisible.map((s, i) => (
                        <button
                          key={s.id}
                          type="button"
                          role="tab"
                          aria-selected={i === spotlightHero}
                          aria-label={`${s.name}`}
                          className={cn(
                            "h-1.5 rounded-full transition-[width,background-color] duration-200",
                            i === spotlightHero
                              ? "w-5 bg-[var(--av-text)]"
                              : "w-1.5 bg-[var(--av-border)] hover:bg-[var(--av-muted)]"
                          )}
                          onClick={() => setSpotlightHero(i)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {spotlightLen > 1 ? (
                <aside className="shrink-0 border-t border-[var(--av-border)]/60 pt-3 lg:w-52 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--av-muted)]">
                    More picks
                  </p>
                  <ul className="mt-2 max-h-36 space-y-0.5 overflow-y-auto text-[13px] lg:max-h-none">
                    {spotlightVisible.map((s, i) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className={cn(
                            "w-full truncate rounded-md px-2 py-1 text-left transition-colors",
                            i === spotlightHero
                              ? "bg-[var(--av-surface)]/80 text-[var(--av-text)] ring-1 ring-white/10"
                              : "text-[var(--av-muted)] hover:bg-[var(--av-surface)]/50 hover:text-[var(--av-text)]"
                          )}
                          onClick={() => setSpotlightHero(i)}
                        >
                          {s.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Link
                    className="mt-3 block text-center text-[10px] font-medium text-[var(--av-muted)] hover:text-[var(--av-text)] hover:underline"
                    to="/discover"
                  >
                    Open Discover →
                  </Link>
                </aside>
              ) : null}
            </div>
          </section>
        ) : null}

        <p
          className="m-0 rounded-lg border border-[var(--av-border)]/60 bg-[var(--av-surface)]/30 px-3 py-2 text-[11px] leading-relaxed text-[var(--av-muted)]"
          role="note"
        >
          <span className="font-medium text-[var(--av-text)]">Playback</span> uses ani-cli sources — open a
          show&apos;s episodes from details. Full grids:{" "}
          <Link className="text-indigo-300/95 underline-offset-2 hover:underline" to="/discover">
            Discover
          </Link>
          ,{" "}
          <Link className="text-indigo-300/95 underline-offset-2 hover:underline" to="/anime">
            Find shows
          </Link>
          .
        </p>

        <div className="flex min-w-0 flex-col gap-6">

        {loading && (
          <p className="text-center text-xs text-[var(--av-muted)]">Searching…</p>
        )}
        {error && (
          <p
            className="rounded-lg border border-red-500/25 bg-red-950/20 px-3 py-2 text-center text-xs leading-snug text-red-200/95"
            role="alert"
          >
            {error}
          </p>
        )}

        {results.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--av-muted)]">
                Search results
              </h2>
              <span className="text-[10px] text-[var(--av-muted)]">
                {results.length} shown
                {results.length !== rawResults.length ? ` (of ${rawResults.length})` : ""}
              </span>
            </div>
            <HorizontalCarousel
              variant="home"
              items={results.map((anime) => ({
                id: anime.id,
                coverUrl: searchThumbnails[anime.id] ?? null,
                title: anime.name,
                subtitle: `Episode ${anime.episodeCount} · ${getAvailabilityLabel(anime)}`,
                mature: inferMatureRating(anime.name),
                onClick: () => openSearchResult(anime),
                onContextCopyTitle: () => void navigator.clipboard.writeText(anime.name),
                onContextOpenDetails: () =>
                  navigate(`/anime/${anime.id}`, { state: { anime } }),
                onContextAddToMyLists: () => {
                  const { added } = addLocalWatchlistEntry({
                    id: anime.id,
                    name: anime.name,
                    mode: anime.mode,
                  });
                  showToast(
                    added ? t("contextMenu.toastAddedToLists") : t("contextMenu.toastAlreadyInLists")
                  );
                },
              }))}
            />
          </section>
        )}

        {!loading && results.length === 0 && debouncedQuery.trim() && !error && (
          <p className="text-center text-sm text-[var(--av-muted)]">No results found.</p>
        )}

        {!debouncedQuery.trim() && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--av-muted)]">
                Recently watched
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  void clearRecentlyWatched();
                }}
                disabled={recentlyWatchedLoading || recentlyWatched.length === 0}
                className="h-9 w-9 shrink-0 rounded-xl text-[var(--av-muted)] hover:bg-[var(--av-surface)] hover:text-[var(--av-text)]"
                aria-label="Clear recently watched"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {recentlyWatchedLoading ? (
              <p className="text-sm text-[var(--av-muted)]">Loading…</p>
            ) : recentlyWatched.length > 0 ? (
              <HorizontalCarousel
                variant="home"
                items={recentlyWatched.map((entry, index) => {
                  const d = recentlyWatchedDetails[entry.animeId];
                  const title = recentCardTitle(entry, d);
                  return {
                    id: `${entry.animeId}-${entry.episode}-${index}`,
                    coverUrl: d?.thumbnail ?? null,
                    title,
                    subtitle: `Episode ${entry.episode} · ${entry.mode}`,
                    mature: inferMatureRating(title),
                    onClick: () => openRecentlyWatched(entry),
                    onContextCopyTitle: () => void navigator.clipboard.writeText(title),
                    onContextOpenDetails: () =>
                      navigate(`/anime/${entry.animeId}`, {
                        state: {
                          anime: {
                            id: entry.animeId,
                            name: title,
                            episodeCount: 0,
                            mode: entry.mode,
                          },
                        },
                      }),
                    onContextAddToMyLists: () => {
                      const { added } = addLocalWatchlistEntry({
                        id: entry.animeId,
                        name: title,
                        mode: entry.mode,
                      });
                      showToast(
                        added ? t("contextMenu.toastAddedToLists") : t("contextMenu.toastAlreadyInLists")
                      );
                    },
                  };
                })}
              />
            ) : (
              <p className="text-sm text-[var(--av-muted)]">No recently watched anime.</p>
            )}
          </section>
        )}
        </div>
      </div>
    </div>
  );
}
