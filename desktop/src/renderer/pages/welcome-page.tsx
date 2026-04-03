import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Compass,
  Filter,
  LayoutList,
  Play,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { BrandMark } from "@/renderer/components/brand-mark";
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
import { APP_DISPLAY_NAME } from "@/shared/app-brand";
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
} from "@/renderer/lib/ani-session-cache";
import {
  UNKNOWN_SERIES_LABEL,
  mergeShowDetailsByAnimeId,
  mergeShowThumbnailsFromShowDetails,
  SHOW_DETAILS_FETCH_CONCURRENCY,
  type ShowDetailsSummary,
} from "@/renderer/lib/fetch-show-thumbnails";
import { inferMatureRating, isMatureContentBlocked } from "@/renderer/lib/mature-content";
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
  const [filterMode, setFilterMode] = useState<"all" | "sub" | "dub">("all");
  const [sortMode, setSortMode] = useState<"match" | "name" | "episodes">("match");

  const { results: rawResults, loading, error, searchThumbnails } = useWelcomeSearch(debouncedQuery);
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
    if (!window.watchProgress?.listContinue) return;
    void window.watchProgress
      .listContinue(10)
      .then(setContinueItems)
      .catch(() => setContinueItems([]));
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
  }, []);

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
  }, []);

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
    if (!window.watchProgress) return;
    void window.watchProgress.stats().then(setProgressStats).catch(() => setProgressStats(null));
  }, []);

  useEffect(() => {
    setSpotlightPosterFailed({});
  }, [spotlight]);

  const results = useMemo(() => {
    let list = [...rawResults];
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
    return list.filter(
      (a) => !isMatureContentBlocked(allowMature, inferMatureRating(a.name))
    );
  }, [rawResults, filterMode, sortMode, allowMature]);

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
  }, [spotlightVisible.length]);

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
      const name =
        continueDetails[item.animeId]?.name &&
        continueDetails[item.animeId]?.name !== UNKNOWN_SERIES_LABEL
          ? continueDetails[item.animeId]!.name
          : item.animeId;
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
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(255,255,255,0.06),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 pb-16 pt-8 md:gap-12 md:px-8 md:pt-12">
        <header className="flex flex-col items-center gap-5 text-center">
          <BrandMark size="hero" className="shadow-[0_12px_40px_-8px_rgba(0,0,0,0.75)]" />
          <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--av-text)] md:text-[2rem]">
            {APP_DISPLAY_NAME}
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-[var(--av-muted)]">
            Desktop streaming powered by{" "}
            <button
              type="button"
              onClick={openAniCliRepo}
              className="text-[var(--av-text)] underline decoration-[var(--av-border)] underline-offset-[3px] transition-colors hover:decoration-[var(--av-accent)]"
            >
              pystardust/ani-cli
            </button>
            .
            <br />
            Watch your favourite anime directly from your desktop.
          </p>
          {progressStats != null && progressStats.trackedEpisodes > 0 ? (
            <p className="text-[11px] text-[var(--av-muted)]">
              Resume data saved for {progressStats.trackedEpisodes} episode
              {progressStats.trackedEpisodes === 1 ? "" : "s"} — pick up where you left off.
            </p>
          ) : null}
        </header>

        {continueItems.length > 0 ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-[var(--av-accent)]" aria-hidden />
              <h2 className="m-0 text-base font-bold tracking-tight">Continue watching</h2>
            </div>
            <HorizontalCarousel
              variant="home"
              items={continueItems.map((c) => {
                const label =
                  continueDetails[c.animeId]?.name &&
                  continueDetails[c.animeId]?.name !== UNKNOWN_SERIES_LABEL
                    ? continueDetails[c.animeId]!.name
                    : c.animeId;
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
                };
              })}
            />
          </section>
        ) : null}

        {hero ? (
          <section className="relative overflow-hidden rounded-2xl border border-[var(--av-border)]/90 shadow-2xl shadow-black/40 ring-1 ring-white/[0.06]">
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
            <div className="relative flex flex-col gap-4 p-5 backdrop-blur-2xl backdrop-saturate-150 sm:flex-row sm:items-stretch sm:gap-5 sm:p-6 bg-[color-mix(in_srgb,var(--av-bg-elevated)_68%,transparent)]">
              <div className="relative h-32 w-[5.25rem] shrink-0 overflow-hidden rounded-lg border border-[var(--av-border)] bg-[var(--av-bg)] sm:h-36 sm:w-24">
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
          </section>
        ) : null}

        {freshVisible.length > 0 ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--av-accent)]" aria-hidden />
              <h2 className="m-0 text-base font-bold tracking-tight">Fresh on the catalog</h2>
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

        <div className="av-callout" role="note">
          <p className="m-0">
            <strong className="text-[var(--av-text)]">Streams resolve through ani-cli sources.</strong>{" "}
            Pick a series, open episodes from the details page, and play in the built-in player. For
            the full catalog layout, use{" "}
            <Link className="text-[var(--av-accent)] underline-offset-2 hover:underline" to="/discover">
              Discover
            </Link>{" "}
            or{" "}
            <Link className="text-[var(--av-accent)] underline-offset-2 hover:underline" to="/anime">
              Search
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            asChild
            variant="secondary"
            className="h-10 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] px-4 text-xs font-medium text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
          >
            <Link to="/discover" className="inline-flex items-center gap-2">
              <Compass className="h-4 w-4 text-[var(--av-accent)]" />
              Discover
            </Link>
          </Button>
          <Button
            type="button"
            asChild
            variant="secondary"
            className="h-10 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] px-4 text-xs font-medium text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
          >
            <Link to="/lists" className="inline-flex items-center gap-2">
              <LayoutList className="h-4 w-4 text-[var(--av-accent)]" />
              Lists
            </Link>
          </Button>
          <Button
            type="button"
            asChild
            variant="secondary"
            className="h-10 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] px-4 text-xs font-medium text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
          >
            <Link to="/schedule" className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--av-accent)]" />
              Calendar
            </Link>
          </Button>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_260px] lg:items-start lg:gap-10">
          <div className="flex min-w-0 flex-col gap-10">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--av-muted-foreground)]"
              strokeWidth={1.75}
            />
            <Input
              type="text"
              placeholder="Search anime..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "h-12 rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg)] pl-12 pr-4 text-[15px] text-[var(--av-text)] shadow-av-xs transition-[box-shadow,border-color] duration-200",
                "placeholder:text-[var(--av-muted-foreground)]",
                "focus-visible:border-[var(--av-accent-dim)] focus-visible:ring-2 focus-visible:ring-[var(--av-accent-muted)] focus-visible:ring-offset-0 focus-visible:ring-offset-[var(--av-bg)]"
              )}
              autoFocus
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-12 shrink-0 rounded-2xl border-[var(--av-border)] bg-[var(--av-surface)] px-4 text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
                aria-label="Search filters"
              >
                <Filter className="mr-2 h-4 w-4" />
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
                  <Select value={sortMode} onValueChange={(v) => setSortMode(v as typeof sortMode)}>
                    <SelectTrigger className="rounded-2xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs shadow-av-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match">Source order</SelectItem>
                      <SelectItem value="name">Title A–Z</SelectItem>
                      <SelectItem value="episodes">Episode count</SelectItem>
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

        {loading && (
          <p className="text-center text-sm text-[var(--av-muted)]">Searching…</p>
        )}
        {error && (
          <p className="text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {results.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-left text-base font-bold tracking-tight">Search results</h2>
              <span className="text-xs text-[var(--av-muted)]">
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
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-bold tracking-tight">Recently watched</h2>
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
          <aside className="hidden rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)]/60 p-3 lg:block">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--av-muted)]">
              Featured picks
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              {spotlightVisible.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full truncate rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
                      i === spotlightHero
                        ? "bg-[var(--av-bg-elevated)] text-[var(--av-text)]"
                        : "text-[var(--av-muted)] hover:bg-[var(--av-bg-elevated)] hover:text-[var(--av-text)]"
                    )}
                    onClick={() => setSpotlightHero(i)}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
            <Link
              className="mt-4 block text-center text-xs text-[var(--av-accent)] hover:underline"
              to="/discover"
            >
              Discover more →
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
