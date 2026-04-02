import { AnimeTitleCard } from "@/renderer/components/anime-title-card";
import { Button } from "@/renderer/components/ui/button";
import { useAnilistEnrichment } from "@/renderer/hooks/use-anilist-enrichment";
import {
  mergeShowThumbnailsFromShowDetails,
  SHOW_DETAILS_FETCH_CONCURRENCY,
} from "@/renderer/lib/fetch-show-thumbnails";
import { getAniCli } from "@/renderer/lib/ani-cli-bridge";
import { cachedAniRecent, cachedAniSearch } from "@/renderer/lib/ani-session-cache";
import type { AnimeSearchResult } from "@/shared/anime-result";
import { cn } from "@/renderer/lib/utils";
import { Compass } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
          const r = await cachedAniRecent(1, 48, () => aniCli.getRecent(1, 48));
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
        const episodes = await getAniCli().getEpisodes(anime.id, anime.mode);
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
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-4 text-[var(--av-text)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)]">
            <Compass className="h-6 w-6 text-[var(--av-accent)]" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Discover</h2>
            <p className="text-sm text-[var(--av-muted)]">
              Fresh pulls the live catalog; other tabs use quick probes — open Search for exact titles.
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          className="w-fit rounded-xl border-[var(--av-border)]"
        >
          <Link to="/anime">Find shows</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
              tab === t.id
                ? "border-[var(--av-text)] bg-white/10 text-[var(--av-text)]"
                : "border-[var(--av-border)] bg-[var(--av-surface)]/50 text-[var(--av-muted)] hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)]"
            )}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-[var(--av-muted-foreground)]">{active.hint}</p>

      {err ? (
        <p className="text-sm text-amber-400" role="status">
          {err}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--av-muted)]">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {rows.map((r) => {
            const t = enrichMap[r.id];
            return (
              <AnimeTitleCard
                key={r.id}
                result={r}
                tile={t === undefined ? undefined : t}
                fallbackPosterUrl={thumbById[r.id]}
                onOpenDetail={() => openDetail(r)}
                onQuickPlay={() => void quickPlay(r)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
