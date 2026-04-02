import type { AniListSearchTile } from "@/renderer/lib/anilist";
import { inferMatureRating } from "@/renderer/lib/mature-content";
import type { AnimeSearchResult } from "@/shared/anime-result";
import { cn } from "@/renderer/lib/utils";
import { Play } from "lucide-react";
import React from "react";

export type AnimeTitleCardProps = {
  result: AnimeSearchResult;
  tile?: AniListSearchTile | null;
  /** ani-cli / cached poster when AniList has no cover yet (`undefined` = still resolving). */
  fallbackPosterUrl?: string | null;
  onOpenDetail: () => void;
  onQuickPlay?: () => void;
  className?: string;
};

function formatShort(fmt: string | null | undefined): string | null {
  if (!fmt) return null;
  const u = fmt.toUpperCase();
  if (u === "TV") return "TV";
  if (u === "TV_SHORT") return "Short";
  if (u === "MOVIE") return "Movie";
  if (u === "OVA" || u === "ONA" || u === "SPECIAL") return u;
  return fmt;
}

export function AnimeTitleCard({
  result,
  tile,
  fallbackPosterUrl,
  onOpenDetail,
  onQuickPlay,
  className = "",
}: AnimeTitleCardProps) {
  const mature = inferMatureRating(result.name);
  const displayTitle = tile?.titleEnglish ?? tile?.titleRomaji ?? result.name;
  const coverFromAni = tile?.coverUrl ?? null;
  const posterUrl = coverFromAni ?? fallbackPosterUrl ?? null;
  /** AniList pending, or AllAnime thumbnail not resolved yet — avoid flashing “No poster”. */
  const posterResolving =
    tile === undefined || (!coverFromAni && fallbackPosterUrl === undefined);
  const subTitle =
    tile?.titleRomaji && tile?.titleEnglish && tile.titleRomaji !== tile.titleEnglish
      ? tile.titleRomaji
      : null;
  const genres = (tile?.genres ?? []).slice(0, 3);

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl border border-[var(--av-border)] bg-[var(--av-surface)]/90 shadow-av-sm transition-all duration-300 ease-out",
        "hover:border-[var(--av-accent-dim)] hover:shadow-av-md hover:-translate-y-0.5",
        className
      )}
    >
      <button
        type="button"
        onClick={onOpenDetail}
        className="relative block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--av-accent)]"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-[var(--av-bg-elevated)]">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt=""
              referrerPolicy="no-referrer"
              decoding="async"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--av-bg-elevated)] to-[var(--av-surface)] px-2 text-center text-[10px] font-medium leading-tight text-[var(--av-muted)]">
              {posterResolving ? "Loading poster…" : "No poster"}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          {formatShort(tile?.format) ? (
            <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
              {formatShort(tile?.format)}
            </span>
          ) : null}
          {mature !== "none" ? (
            <span
              className={`absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase text-white ${
                mature === "explicit" ? "bg-red-600" : "bg-amber-600"
              }`}
            >
              {mature === "explicit" ? "18+" : "Ecchi"}
            </span>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow">
              {displayTitle}
            </p>
            {subTitle ? (
              <p className="mt-0.5 line-clamp-1 text-[10px] text-white/80">{subTitle}</p>
            ) : null}
          </div>
        </div>
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        {genres.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {genres.map((g) => (
              <span
                key={g}
                className="rounded-md bg-[var(--av-accent-muted)]/40 px-1.5 py-0.5 text-[9px] text-[var(--av-muted)]"
              >
                {g}
              </span>
            ))}
            <span className="text-[9px] text-[var(--av-muted-foreground)]">· AniList</span>
          </div>
        ) : tile && !posterResolving ? (
          <p className="text-[9px] text-[var(--av-muted-foreground)]">AniList · no genres</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-[10px] text-[var(--av-muted)]">
            {result.episodeCount} ep · {result.mode}
            {tile?.averageScore != null ? ` · ★ ${(tile.averageScore / 10).toFixed(1)}` : ""}
          </p>
          {onQuickPlay ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickPlay();
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--av-border)] bg-[var(--av-bg-elevated)] px-2 py-1 text-[10px] text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
            >
              <Play className="h-3 w-3" />
              Play
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
