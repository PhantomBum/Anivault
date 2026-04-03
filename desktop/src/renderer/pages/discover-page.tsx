import { AnimeTitleCard } from "@/renderer/components/anime-title-card";
import { Button } from "@/renderer/components/ui/button";
import { useAnilistEnrichment } from "@/renderer/hooks/use-anilist-enrichment";
import {
  mergeShowThumbnailsFromShowDetails,
  prefetchThumbnailForShowId,
  SHOW_DETAILS_FETCH_CONCURRENCY,
} from "@/renderer/lib/fetch-show-thumbnails";
import { getAniCli } from "@/renderer/lib/ani-cli-bridge";
import { cachedAniRecent, cachedAniSearch, cachedGetEpisodes } from "@/renderer/lib/ani-session-cache";
import type { AniListSearchTile } from "@/renderer/lib/anilist";
import { inferMatureRating, isMatureContentBlocked } from "@/renderer/lib/mature-content";
import { addLocalWatchlistEntry } from "@/renderer/lib/local-watchlist";
import type { AnimeSearchResult } from "@/shared/anime-result";
import { showToast } from "@/renderer/lib/av-toast";
import { cn } from "@/renderer/lib/utils";
import { useAnivaultConfig } from "@/renderer/context/anivault-config-context";
import { Compass } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

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
  const [tab, setTab] = useState(TABS[0].id);
  const [rows, setRows] = useState<AnimeSearchResult[]>([]);
  const [thumbById, setThumbById] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

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
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active.id, active.query]);

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
      navigate(`/anime/${encodeURIComponent(anime.id)}`);
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
        /* ignore */
      }
    },
    [navigate]
  );

  const addToMyLists = useCallback((r: AnimeSearchResult, tile?: AniListSearchTile | null) => {
    const name = tile?.titleEnglish ?? tile?.titleRomaji ?? r.name;
    const { added } = addLocalWatchlistEntry({ id: r.id, name, mode: r.mode });
    showToast(added ? t("contextMenu.toastAddedToLists") : t("contextMenu.toastAlreadyInLists"));
  }, [t]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-3 py-3 text-[var(--av-text)] md:px-5 md:py-5">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--av-border)] bg-[var(--av-surface)]/35 p-4 shadow-av-sm md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg-elevated)] shadow-av-xs">
              <Compass className="h-6 w-6 text-zinc-200" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Discover</h2>
              <p className="mt-0.5 max-w-xl text-sm text-[var(--av-muted)]">
                Curated rows from the catalog. Use the header search or{" "}
                <Link className="text-[var(--av-text)] underline underline-offset-2" to="/anime">
                  Find shows
                </Link>{" "}
                for exact titles.
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-10 shrink-0 rounded-2xl border-[var(--av-border)] px-5"
          >
            <Link to="/anime">Browse all</Link>
          </Button>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2 border-t border-[var(--av-border)]/80 pt-4">
          {TABS.map((tabDef) => (
            <button
              key={tabDef.id}
              type="button"
              className={cn(
                "rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200",
                tab === tabDef.id
                  ? "border-zinc-400/40 bg-zinc-100/10 text-zinc-50 shadow-av-xs"
                  : "border-transparent bg-[var(--av-bg)]/40 text-[var(--av-muted)] hover:border-[var(--av-border)] hover:text-[var(--av-text)]"
              )}
              onClick={() => setTab(tabDef.id)}
            >
              {tabDef.label}
            </button>
          ))}
        </div>
        <p className="relative mt-2 text-[11px] leading-snug text-[var(--av-muted-foreground)]">
          {active.hint}
        </p>
      </div>

      {err ? (
        <p className="text-sm text-amber-400" role="status">
          {err}
        </p>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] animate-pulse rounded-2xl border border-[var(--av-border)]/60 bg-zinc-900/50"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
