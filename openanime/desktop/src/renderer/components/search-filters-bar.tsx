import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/renderer/components/ui/select";
import { cn } from "@/renderer/lib/utils";
import React from "react";

export type SearchFilterMode = "all" | "sub" | "dub";
export type SearchSortMode = "match" | "name" | "episodes";

const AUDIO_MODES: { id: SearchFilterMode; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sub", label: "Sub" },
  { id: "dub", label: "Dub" },
];

type SearchFiltersBarProps = {
  filterMode: SearchFilterMode;
  onFilterChange: (v: SearchFilterMode) => void;
  sortMode: SearchSortMode;
  onSortChange: (v: SearchSortMode) => void;
  /** Filtered count */
  shownCount: number;
  /** Total before filter (omit to hide “of N”) */
  totalCount?: number;
  className?: string;
  /** Tighter controls for home / dense layouts */
  compact?: boolean;
  /** Footnote under controls */
  hint?: string;
};

/**
 * Inline search result filters (audio + sort) — monochrome segmented control, no popover.
 */
export function SearchFiltersBar({
  filterMode,
  onFilterChange,
  sortMode,
  onSortChange,
  shownCount,
  totalCount,
  className,
  compact,
  hint,
}: SearchFiltersBarProps) {
  const btn = compact
    ? "px-2 py-1 text-[11px]"
    : "px-2.5 py-1.5 text-xs";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)]/60 p-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3",
        className
      )}
    >
      <div
        className="inline-flex w-fit max-w-full rounded-lg border border-[var(--av-border)] bg-[var(--av-bg)] p-0.5"
        role="group"
        aria-label="Audio filter"
      >
        {AUDIO_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onFilterChange(m.id)}
            className={cn(
              "rounded-md font-medium transition-colors",
              btn,
              filterMode === m.id
                ? "bg-[var(--av-surface-hover)] text-[var(--av-text)] shadow-sm"
                : "text-[var(--av-muted)] hover:text-[var(--av-text)]"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-[220px]">
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-[var(--av-muted-foreground)]">
          Sort
        </span>
        <Select
          value={sortMode}
          onValueChange={(v) => onSortChange(v as SearchSortMode)}
        >
          <SelectTrigger
            className={cn(
              "h-8 flex-1 rounded-lg border-[var(--av-border)] bg-[var(--av-bg)] text-[var(--av-text)]",
              compact ? "h-7 text-[11px]" : "text-xs"
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="match">Source order</SelectItem>
            <SelectItem value="name">Title A–Z</SelectItem>
            <SelectItem value="episodes">Episode count</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-[10px] leading-tight text-[var(--av-muted-foreground)] sm:ml-auto sm:text-right">
        <span className="tabular-nums">{shownCount}</span> shown
        {totalCount != null && shownCount !== totalCount ? (
          <>
            {" "}
            <span className="text-[var(--av-border)]">·</span>{" "}
            <span className="tabular-nums">{totalCount}</span> total
          </>
        ) : null}
      </p>

      {hint ? (
        <p className="w-full text-[10px] leading-snug text-[var(--av-muted-foreground)] sm:order-last">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
