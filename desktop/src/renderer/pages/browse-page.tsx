import { AnimeTitleCard } from "@/renderer/components/anime-title-card";
import { Button } from "@/renderer/components/ui/button";
import { useAnilistEnrichment } from "@/renderer/hooks/use-anilist-enrichment";
import {
  mergeShowThumbnailsFromShowDetails,
  prefetchThumbnailForShowId,
  SHOW_DETAILS_FETCH_CONCURRENCY,
} from "@/renderer/lib/fetch-show-thumbnails";
import type { AniListSearchTile } from "@/renderer/lib/anilist";
import { inferMatureRating, isMatureContentBlocked } from "@/renderer/lib/mature-content";
import { addLocalWatchlistEntry } from "@/renderer/lib/local-watchlist";
import { recordPerfEvent } from "@/renderer/lib/telemetry";
import { showToast } from "@/renderer/lib/av-toast";
import { useAnivaultConfig } from "@/renderer/context/anivault-config-context";
import type { AnimeSearchResult } from "@/shared/anime-result";
import { Grid3x3 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

/** Short probes merged and deduped so the grid is broader than a single query. */
const BROWSE_PROBE_QUERIES = ["a", "e", "i", "o", "u", "one", "na"] as const;

/** Cap `getShowDetails` thumbnail merges to limit CPU/network on large merged catalogs (phase 20). */
const BROWSE_THUMB_MERGE_CAP = 96;

/**
 * Dense catalog grid from merged ani-cli probes (not a full provider index).
 * Uses the same title cards, AniList enrichment, and ani-cli poster fallbacks as Search.
 */
export function BrowsePage() {
  const { t } = useTranslation();
  const { config } = useAnivaultConfig();
  const allowMature = config?.allowMatureContent ?? false;
  const navigate = useNavigate();
  const [rows, setRows] = useState<AnimeSearchResult[]>([]);
  const [thumbById, setThumbById] = useState<Record<string, string | null>>({});
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void (async () => {
      try {
        const lists = await Promise.all(
          BROWSE_PROBE_QUERIES.map((q) => window.aniCli.search(q))
        );
        if (cancelled) return;
        const byId = new Map<string, AnimeSearchResult>();
        for (const list of lists) {
          for (const r of list) {
            if (!byId.has(r.id)) byId.set(r.id, r);
          }
        }
        const merged = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
        setRows(merged);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (rows.length === 0) return;
    const slice = rows.slice(0, BROWSE_THUMB_MERGE_CAP);
    void mergeShowThumbnailsFromShowDetails(
      slice,
      SHOW_DETAILS_FETCH_CONCURRENCY,
      setThumbById,
      () => cancelled
    );
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const signature = useMemo(() => rows.map((r) => r.id).join("\u0001"), [rows]);
  const enrichMap = useAnilistEnrichment(rows, signature);

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      const enriched = enrichMap[r.id];
      const rating = inferMatureRating(r.name, enriched?.genres);
      return !isMatureContentBlocked(allowMature, rating);
    });
  }, [rows, enrichMap, allowMature]);

  useEffect(() => {
    if (rows.length === 0) return;
    recordPerfEvent("browse_catalog_loaded", { rowCount: rows.length });
  }, [rows.length]);

  const openDetail = useCallback(
    (anime: AnimeSearchResult) => {
      navigate(`/anime/${encodeURIComponent(anime.id)}`, { state: { anime } });
    },
    [navigate]
  );

  const addToMyLists = useCallback((r: AnimeSearchResult, tile?: AniListSearchTile | null) => {
    const name = tile?.titleEnglish ?? tile?.titleRomaji ?? r.name;
    const { added } = addLocalWatchlistEntry({ id: r.id, name, mode: r.mode });
    showToast(added ? t("contextMenu.toastAddedToLists") : t("contextMenu.toastAlreadyInLists"));
  }, [t]);

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

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 text-[var(--av-text)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)]">
            <Grid3x3 className="h-6 w-6 text-[var(--av-accent)]" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("browse.title")}</h2>
            <p className="text-sm text-[var(--av-muted)]">{t("browse.subtitle")}</p>
          </div>
        </div>
        <Button
          asChild
          variant="secondary"
          className="av-micro-press w-fit rounded-xl border-[var(--av-border)]"
        >
          <Link to="/anime">
            <Grid3x3 className="mr-2 h-4 w-4 text-[var(--av-accent)]" />
            {t("browse.findShows")}
          </Link>
        </Button>
      </div>

      {err ? (
        <p className="text-sm text-amber-400" role="status">
          {err}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--av-muted)]">{t("browse.loading")}</p>
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
                onAddToMyLists={() => addToMyLists(r, enriched === undefined ? null : enriched)}
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
