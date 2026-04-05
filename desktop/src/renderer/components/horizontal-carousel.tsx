import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/renderer/components/ui/context-menu";
import type { MatureRating } from "@/renderer/lib/mature-content";
import { cn } from "@/renderer/lib/utils";
import { APP_SHORT_BADGE } from "@/shared/app-brand";
import { BookmarkPlus, ChevronLeft, ChevronRight, ImageOff, Trash2 } from "lucide-react";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type HorizontalCarouselItem = {
  id: string;
  coverUrl: string | null;
  /** Typically the anime title. */
  title: string;
  /** Typically "Episode X · sub/dub". */
  subtitle: string;
  /** Called when the item is clicked (e.g. navigate to watch page). */
  onClick: () => void;
  /** Optional context menu (home / discovery). */
  onContextCopyTitle?: () => void;
  onContextOpenDetails?: () => void;
  onContextAddToMyLists?: () => void;
  /** Remove series from “Continue watching” (clears saved progress). */
  onContextRemoveFromContinue?: () => void;
  /** Mature content hint (badges on poster). */
  mature?: MatureRating;
};

export function PosterPlaceholder({ title }: { title: string }) {
  const initials = title
    .replace(/[^a-zA-Z0-9\s\u00C0-\u024F]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const label = initials || "AV";
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#0a0c10] px-1">
      <span className="text-lg font-bold text-[var(--av-muted)]">{label}</span>
      <span className="text-[8px] uppercase tracking-[0.2em] text-[var(--av-muted-foreground)]">
        {APP_SHORT_BADGE}
      </span>
    </div>
  );
}

type CarouselVariant = "default" | "home";

type HorizontalCarouselProps = {
  items: HorizontalCarouselItem[];
  pageSize?: number;
  variant?: CarouselVariant;
};

function HorizontalCarouselCard({
  item,
  variant = "default",
}: {
  item: HorizontalCarouselItem;
  variant?: CarouselVariant;
}) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  const showFallback = failed || !item.coverUrl;
  const isHome = variant === "home";
  const hasMenu = Boolean(
    item.onContextCopyTitle ||
      item.onContextOpenDetails ||
      item.onContextAddToMyLists ||
      item.onContextRemoveFromContinue
  );

  const mature = item.mature ?? "none";

  const inner = (
    <>
      <div
        className={cn(
          "relative box-border aspect-[2/3] w-full shrink-0 overflow-hidden rounded-xl border transition-all duration-300",
          isHome
            ? "rounded-2xl border-[var(--av-border)] p-px shadow-av-xs group-hover:border-[var(--av-accent-dim)] group-hover:shadow-av-sm group-focus-visible:border-[var(--av-accent)]"
            : "rounded-[1.125rem] border-2 border-[var(--av-border)] p-[3px] shadow-av-sm group-hover:border-[var(--av-accent-dim)]/80 group-hover:shadow-av-md group-focus-visible:border-[var(--av-accent)]/90"
        )}
      >
        {mature !== "none" ? (
          <span
            className={cn(
              "absolute right-1.5 top-1.5 z-[1] max-w-[calc(100%-0.75rem)] rounded-lg px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-black/40",
              mature === "explicit" ? "bg-red-600/95" : "bg-amber-600/95"
            )}
            title={
              mature === "explicit"
                ? "Adult / explicit content — viewer discretion advised"
                : "Mature themes — viewer discretion advised"
            }
          >
            {mature === "explicit" ? "18+" : "Ecchi"}
          </span>
        ) : null}
        <div
          className={cn(
            "h-full w-full overflow-hidden bg-[var(--av-bg-elevated)] motion-safe:transition-[transform] motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.012]",
            isHome ? "rounded-[13px]" : "rounded-[0.9rem]"
          )}
        >
          {showFallback ? (
            isHome ? (
              <PosterPlaceholder title={item.title} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--av-surface)] text-[var(--av-muted-foreground)]">
                <ImageOff className="h-6 w-6" aria-hidden="true" />
              </div>
            )
          ) : (
            <img
              src={item.coverUrl ?? undefined}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
              draggable={false}
              onError={() => setFailed(true)}
            />
          )}
        </div>
      </div>
      <div className="mt-2 flex w-full min-w-0 flex-col items-stretch justify-start gap-0.5">
        <p
          title={item.title}
          className={cn(
            "line-clamp-2 min-h-[2.5rem] w-full break-words font-bold leading-snug",
            isHome ? "text-[13px] text-[var(--av-text)]" : "text-xs font-medium text-[var(--av-text)]"
          )}
        >
          {item.title}
        </p>
        <p
          title={item.subtitle}
          className={cn(
            "line-clamp-1 w-full min-w-0 text-[11px] leading-snug",
            isHome ? "text-[var(--av-muted)]" : "text-[var(--av-muted)]"
          )}
        >
          {item.subtitle}
        </p>
      </div>
    </>
  );

  const btn = (
    <button
      type="button"
      className={cn(
        "group flex w-40 shrink-0 flex-col text-left focus-visible:outline-none",
        isHome && "snap-start"
      )}
      data-carousel-item
      onClick={item.onClick}
      onDragStart={(event) => event.preventDefault()}
    >
      {inner}
    </button>
  );

  if (!hasMenu) return btn;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{btn}</ContextMenuTrigger>
      <ContextMenuContent className="border-[var(--av-border)] bg-[var(--av-surface)] text-xs text-[var(--av-text)]">
        {item.onContextCopyTitle ? (
          <ContextMenuItem
            onSelect={() => {
              void item.onContextCopyTitle?.();
            }}
          >
            Copy title
          </ContextMenuItem>
        ) : null}
        {item.onContextOpenDetails ? (
          <ContextMenuItem
            onSelect={() => {
              item.onContextOpenDetails?.();
            }}
          >
            Open details
          </ContextMenuItem>
        ) : null}
        {item.onContextAddToMyLists ? (
          <ContextMenuItem
            onSelect={() => {
              item.onContextAddToMyLists?.();
            }}
          >
            <BookmarkPlus className="mr-2 h-3.5 w-3.5 opacity-90" />
            {t("contextMenu.addToMyLists")}
          </ContextMenuItem>
        ) : null}
        {item.onContextRemoveFromContinue ? (
          <ContextMenuItem
            onSelect={() => {
              item.onContextRemoveFromContinue?.();
            }}
            className="text-red-400 focus:text-red-300"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5 opacity-90" />
            {t("contextMenu.removeFromContinue")}
          </ContextMenuItem>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function HorizontalCarouselImpl({
  items,
  pageSize = 6,
  variant = "default",
}: HorizontalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    setCanScrollLeft(left > 0);
    setCanScrollRight(left < maxScrollLeft - 1);
  }, []);

  const scrollByPage = useCallback(
    (direction: "left" | "right") => {
      const el = scrollRef.current;
      if (!el) return;

      const els = el.querySelectorAll<HTMLElement>("[data-carousel-item]");
      if (els.length === 0) return;

      let step = els[0].getBoundingClientRect().width;
      if (els.length > 1) {
        const firstRect = els[0].getBoundingClientRect();
        const secondRect = els[1].getBoundingClientRect();
        const gap = secondRect.left - firstRect.right;
        if (!Number.isNaN(gap) && gap > 0) {
          step += gap;
        }
      }

      const amount = step * pageSize;
      el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    },
    [pageSize]
  );

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState, items.length]);

  return (
    <div className="relative">
      <div className="relative w-full">
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className={cn(
            "flex gap-3 overflow-x-auto pb-2 scroll-smooth pr-6 scrollbar-none",
            variant === "home" && "snap-x snap-mandatory scroll-pl-1"
          )}
        >
          {items.map((item) => (
            <HorizontalCarouselCard key={item.id} item={item} variant={variant} />
          ))}
        </div>

        {canScrollLeft && (
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollByPage("left")}
            className={cn(
              "absolute left-2 top-[5.5rem] z-10 inline-flex h-12 w-9 -translate-y-1/2 items-center justify-center rounded-xl border shadow-sm transition-colors",
              variant === "home"
                ? "border-[var(--av-border)] bg-[var(--av-bg)] text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
                : "border-[var(--av-border)] bg-[var(--av-surface)] text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        {canScrollRight && (
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollByPage("right")}
            className={cn(
              "absolute right-2 top-[5.5rem] z-10 inline-flex h-12 w-9 -translate-y-1/2 items-center justify-center rounded-xl border shadow-sm transition-colors",
              variant === "home"
                ? "border-[var(--av-border)] bg-[var(--av-bg)] text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
                : "border-[var(--av-border)] bg-[var(--av-surface)] text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
            )}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export const HorizontalCarousel = memo(HorizontalCarouselImpl);
