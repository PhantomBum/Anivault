import { AnimeTitleCard } from "@/renderer/components/anime-title-card";
import { Button } from "@/renderer/components/ui/button";
import { useAnilistEnrichment } from "@/renderer/hooks/use-anilist-enrichment";
import {
  mergeShowThumbnailsFromShowDetails,
  prefetchThumbnailForShowId,
  SHOW_DETAILS_FETCH_CONCURRENCY,
} from "@/renderer/lib/fetch-show-thumbnails";
import { getAniCli } from "@/renderer/lib/ani-cli-bridge";
import {
  cachedAniRecent,
  cachedAniSearch,
  cachedGetEpisodes,
  invalidateAniRecentCache,
  invalidateAniSearchCache,
} from "@/renderer/lib/ani-session-cache";
import { CATALOG_REFRESH_EVENT } from "@/renderer/lib/catalog-refresh-event";
import type { AniListSearchTile } from "@/renderer/lib/anilist";
import { inferMatureRating, isMatureContentBlocked } from "@/renderer/lib/mature-content";
import { addLocalWatchlistEntry } from "@/renderer/lib/local-watchlist";
import type { AnimeSearchResult } from "@/shared/anime-result";
import { showToast } from "@/renderer/lib/av-toast";
import { cn } from "@/renderer/lib/utils";
import { useAnivaultConfig } from "@/renderer/context/anivault-config-context";
import { AvEmptyState } from "@/renderer/components/av-empty-state";
import { formatCatalogApiError } from "@/renderer/lib/catalog-api-errors";
import { Compass, RefreshCw, SearchX } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

const DISCOVER_TAB_SESSION_KEY = "anivault-discover-active-tab";

const TABS: { id: string; label: string; query: string; hint: string }[] = [
  {
    id: "fresh",
    label: "Fresh",
    query: "__fresh__",
    hint: "Recently updated picks (cached locally for instant return visits)",
  },
  { id: "popular", label: "Popular", query: "one", hint: "Broad catalog probe" },
  { id: "trending", label: "Trending", query: "a", hint: "High-volume letter" },
  { id: "top", label: "Top", query: "naruto", hint: "Well-known title" },
  { id: "month", label: "This month", query: "2024", hint: "Numeric probe" },
];

export function DiscoverPage() {
  const { t } = useTranslation();
  const { config } = useAnivaultConfig();
  const allowMature = config?.allowMatureContent ?? false;
  const navigate = useNavigate();
  const [tab, setTab] = useState(() => {
    try {
      const s = sessionStorage.getItem(DISCOVER_TAB_SESSION_KEY);
      if (s && TABS.some((x) => x.id === s)) return s;
    } catch {
      /* ignore */
    }
    return TABS[0].id;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(DISCOVER_TAB_SESSION_KEY, tab);
    } catch {
      /* ignore */
    }
  }, [tab]);
  const [rows, setRows] = useState<AnimeSearchResult[]>([]);
  const [thumbById, setThumbById] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [catalogRefresh, setCatalogRefresh] = useState(0);

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  const bumpCatalogRefresh = useCallback(() => {
    invalidateAniSearchCache();
    invalidateAniRecentCache();
    setCatalogRefresh((n) => n + 1);
    showToast(t("refreshUpdate.toast"));
  }, [t]);

  useEffect(() => {
    const on = () => bumpCatalogRefresh();
    window.addEventListener(CATALOG_REFRESH_EVENT, on);
    return () => window.removeEventListener(CATALOG_REFRESH_EVENT, on);
  }, [bumpCatalogRefresh]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    const aniCli = getAniCli();
    void (async () => {
      try {
        let list: AnimeSearchResult[];
        if (active.id === "fresh") {
          const r = await cachedAniRecent(1, 36, () => aniCli.getRecent(1, 36));
          list = r.items;
        } else {
          list = await cachedAniSearch(active.query, () => aniCli.search(active.query));
        }
        if (!cancelled) setRows(list);
      } catch (e) {
        if (!cancelled) {
          setErr(formatCatalogApiError(e instanceof Error ? e.message : "Failed"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active.id, active.query, catalogRefresh]);

  const sig = useMemo(() => `${tab}:${rows.map((r) => r.id).join("\u0001")}`, [tab, rows]);
  const enrichMap = useAnilistEnrichment(rows, sig);

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      const t = enrichMap[r.id];
      const rating = inferMatureRating(r.name, t?.genres);
      return !isMatureContentBlocked(allowMature, rating);
    });
  }, [rows, enrichMap, allowMature]);

  useEffect(() => {
    let cancelled = false;
    if (rows.length === 0) return;
    void mergeShowThumbnailsFromShowDetails(
      rows,
      SHOW_DETAILS_FETCH_CONCURRENCY,
      setThumbById,
      () => cancelled
    );
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const openDetail = useCallback(
    (anime: AnimeSearchResult) => {
      navigate(`/anime/${encodeURIComponent(anime.id)}`, { state: { anime } });
    },
    [navigate]
  );

  const quickPlay = useCallback(
    async (anime: AnimeSearchResult) => {
      try {
        const episodes = await cachedGetEpisodes(anime.id, anime.mode, () =>
          getAniCli().getEpisodes(anime.id, anime.mode)
        );
        if (episodes.length === 0) return;
        navigate("/watch", {
          state: {
            anime: { id: anime.id, name: anime.name, mode: anime.mode },
            episodes,
            currentEpisode: episodes[0],
          },
        });
      } catch {
        showToast(t("catalog.toastEpisodesFailed"));
      }
    },
    [navigate, t]
  );

  const addToMyLists = useCallback((r: AnimeSearchResult, tile?: AniListSearchTile | null) => {
    const name = tile?.titleEnglish ?? tile?.titleRomaji ?? r.name;
    const { added } = addLocalWatchlistEntry({ id: r.id, name, mode: r.mode });
    showToast(added ? t("contextMenu.toastAddedToLists") : t("contextMenu.toastAlreadyInLists"));
  }, [t]);

  return (
    <div className="av-page-shell max-w-[1600px] space-y-4 text-[var(--av-text)]">
      <div className="rounded-xl border border-[var(--av-border)]/80 bg-[var(--av-bg-elevated)]/35 p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--av-border)] bg-[var(--av-surface)]/50">
              <Compass className="h-5 w-5 text-zinc-200" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Discover</h2>
              <p className="mt-0.5 max-w-xl text-xs text-[var(--av-muted)]">
                Catalog rows ·{" "}
                <Link className="text-[var(--av-text)] underline underline-offset-2" to="/anime">
                  Find shows
                </Link>{" "}
                for exact titles
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-9 rounded-lg border border-[var(--av-border)] px-3 text-xs"
              onClick={bumpCatalogRefresh}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {t("refreshUpdate.button")}
            </Button>
            <Button asChild variant="outline" className="h-9 shrink-0 rounded-lg border-[var(--av-border)] px-4 text-xs">
              <Link to="/anime">Find shows</Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--av-border)]/60 pt-3">
          {TABS.map((tabDef) => (
            <button
              key={tabDef.id}
              type="button"
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                tab === tabDef.id
                  ? "border-zinc-400/35 bg-zinc-100/10 text-zinc-50"
                  : "border-transparent bg-transparent text-[var(--av-muted)] hover:border-[var(--av-border)] hover:text-[var(--av-text)]"
              )}
              onClick={() => setTab(tabDef.id)}
            >
              {tabDef.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-snug text-[var(--av-muted-foreground)]">{active.hint}</p>
      </div>

      {err ? (
        <p
          className="rounded-lg border border-amber-500/20 bg-amber-950/15 px-3 py-2 text-xs text-amber-100/95"
          role="status"
        >
          {err}
        </p>
      ) : null}

      {loading ? (
        <div className="av-poster-grid grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl border border-[var(--av-border)]/60 bg-zinc-900/50"
            />
          ))}
        </div>
      ) : visibleRows.length === 0 ? (
        <AvEmptyState
          icon={SearchX}
          title="Nothing to show in this tab"
          description="Try another Discover row or open Find shows for a specific title."
        >
          <Button asChild variant="outline" className="mt-1 rounded-xl border-[var(--av-border)]">
            <Link to="/anime">Find shows</Link>
          </Button>
        </AvEmptyState>
      ) : (
        <div className="av-poster-grid grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visibleRows.map((r) => {
            const enriched = enrichMap[r.id];
            return (
              <AnimeTitleCard
                key={r.id}
                result={r}
                tile={enriched === undefined ? undefined : enriched}
                fallbackPosterUrl={thumbById[r.id]}
                onOpenDetail={() => openDetail(r)}
                onQuickPlay={() => void quickPlay(r)}
                onAddToMyLists={() => addToMyLists(r, enriched)}
                onPrefetch={() => {
                  void prefetchThumbnailForShowId(r.id, () => false);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
