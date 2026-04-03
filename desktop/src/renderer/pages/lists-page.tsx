import { BookmarkPlus, Download, ListPlus, Search, Trash2, Upload } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList, type ListChildComponentProps } from "react-window";
import { useNavigate } from "react-router-dom";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { useDebouncedValue } from "@/renderer/hooks/use-debounced-value";
import { getAniCli } from "@/renderer/lib/ani-cli-bridge";
import { cachedAniSearch } from "@/renderer/lib/ani-session-cache";
import { showToast } from "@/renderer/lib/av-toast";
import {
  LOCAL_WATCHLIST_STORAGE_KEY,
  loadLocalWatchlist,
  type LocalWatchlistEntry,
} from "@/renderer/lib/local-watchlist";
import { cn } from "@/renderer/lib/utils";

const SEARCH_WAIT_MS = 100;
const LIST_ROW_HEIGHT = 80;
const VIRTUAL_LIST_THRESHOLD = 24;

type ListEntry = LocalWatchlistEntry;

type SavedListRowData = {
  entries: ListEntry[];
  navigate: ReturnType<typeof useNavigate>;
  onRemove: (id: string) => void;
  removeLabel: string;
};

function SavedListRow({ index, style, data }: ListChildComponentProps<SavedListRowData>) {
  const e = data.entries[index];
  if (!e) return null;
  const { navigate, onRemove, removeLabel } = data;
  return (
    <div style={style} className="box-border px-0" role="listitem">
      <div className="flex h-[calc(100%-0.5rem)] items-center gap-3 rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg-elevated)] px-4 py-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() =>
            navigate(`/anime/${e.id}`, {
              state: {
                anime: {
                  id: e.id,
                  name: e.name,
                  episodeCount: 0,
                  mode: e.mode,
                },
              },
            })
          }
        >
          <p className="truncate font-medium">{e.name}</p>
          <p className="text-[10px] tabular-nums text-[var(--av-muted-foreground)]">
            {e.id} · {e.mode}
          </p>
        </button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0 rounded-xl text-[var(--av-muted)] hover:text-red-400"
          aria-label={removeLabel}
          onClick={() => onRemove(e.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ListsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const importRef = useRef<HTMLInputElement>(null);
  const listWrapRef = useRef<HTMLDivElement>(null);
  const [listWidth, setListWidth] = useState(640);
  const [entries, setEntries] = useState<ListEntry[]>([]);
  const [draftId, setDraftId] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftMode, setDraftMode] = useState<"sub" | "dub">("sub");
  const [lookup, setLookup] = useState("");
  const debouncedLookup = useDebouncedValue(lookup, SEARCH_WAIT_MS);
  const [lookupHits, setLookupHits] = useState<
    { id: string; name: string; episodeCount: number; mode: "sub" | "dub" }[]
  >([]);
  const [lookupBusy, setLookupBusy] = useState(false);

  useEffect(() => {
    setEntries(loadLocalWatchlist());
  }, []);

  useEffect(() => {
    const el = listWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setListWidth(Math.max(280, el.clientWidth));
    });
    ro.observe(el);
    setListWidth(Math.max(280, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const q = debouncedLookup.trim();
    if (q.length < 2) {
      setLookupHits([]);
      setLookupBusy(false);
      return;
    }
    let cancelled = false;
    setLookupBusy(true);
    void cachedAniSearch(q, () => getAniCli().search(q))
      .then((list) => {
        if (!cancelled) setLookupHits(list.slice(0, 12));
      })
      .catch(() => {
        if (!cancelled) setLookupHits([]);
      })
      .finally(() => {
        if (!cancelled) setLookupBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedLookup]);

  const persist = useCallback((next: ListEntry[]) => {
    setEntries(next);
    localStorage.setItem(LOCAL_WATCHLIST_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const add = useCallback(() => {
    const id = draftId.trim();
    const name = draftName.trim();
    if (!id || !name) return;
    if (entries.some((e) => e.id === id)) return;
    persist([{ id, name, mode: draftMode }, ...entries]);
    setDraftId("");
    setDraftName("");
  }, [draftId, draftName, draftMode, entries, persist]);

  const addFromHit = useCallback(
    (hit: { id: string; name: string; mode: "sub" | "dub" }) => {
      if (entries.some((e) => e.id === hit.id)) return;
      persist([{ id: hit.id, name: hit.name, mode: hit.mode }, ...entries]);
      setLookup("");
      setLookupHits([]);
    },
    [entries, persist]
  );

  const remove = useCallback(
    (id: string) => {
      persist(entries.filter((e) => e.id !== id));
    },
    [entries, persist]
  );

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anivault-watchlist-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("lists.toastExported"));
  }, [entries, t]);

  const importFromFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result)) as unknown;
          if (!Array.isArray(parsed)) {
            showToast(t("lists.toastInvalidFile"), 4000);
            return;
          }
          const next: ListEntry[] = parsed.filter(
            (x): x is ListEntry =>
              x != null &&
              typeof x === "object" &&
              "id" in x &&
              typeof (x as ListEntry).id === "string" &&
              typeof (x as ListEntry).name === "string" &&
              ((x as ListEntry).mode === "sub" || (x as ListEntry).mode === "dub")
          );
          persist(next);
          showToast(t("lists.toastImported", { count: next.length }));
        } catch {
          showToast(t("lists.toastReadError"), 4000);
        }
      };
      reader.readAsText(file);
    },
    [persist, t]
  );

  const copyTsv = useCallback(() => {
    const tsv = ["name\tid\tmode", ...entries.map((e) => `${e.name}\t${e.id}\t${e.mode}`)].join("\n");
    void navigator.clipboard.writeText(tsv).then(
      () => showToast(t("lists.toastTsvCopied")),
      () => showToast(t("lists.toastCopyFailed"), 4000)
    );
  }, [entries, t]);

  const virtualListData = useMemo(
    (): SavedListRowData => ({
      entries,
      navigate,
      onRemove: remove,
      removeLabel: t("lists.removeAria"),
    }),
    [entries, navigate, remove, t]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-2 text-[var(--av-text)]">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--av-accent)]">
          {t("lists.kicker")}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{t("lists.title")}</h1>
        <p className="mt-1 text-sm text-[var(--av-muted)]">{t("lists.subtitle")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-[var(--av-border)] text-xs"
            onClick={exportJson}
            disabled={entries.length === 0}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t("lists.exportJson")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-[var(--av-border)] text-xs"
            onClick={() => importRef.current?.click()}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {t("lists.importJson")}
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) importFromFile(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-[var(--av-border)] text-xs"
            onClick={copyTsv}
            disabled={entries.length === 0}
          >
            {t("lists.copyTsv")}
          </Button>
        </div>
      </header>

      <section className="rounded-3xl border border-[var(--av-border)] bg-[var(--av-surface)] p-5 shadow-av-sm transition-[box-shadow] duration-200 hover:shadow-av-md">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-[var(--av-accent)]" aria-hidden />
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--av-muted)]">
            {t("lists.addFromCatalog")}
          </p>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--av-muted)]" />
          <Input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder={t("lists.lookupPlaceholder")}
            className="h-11 rounded-2xl border-[var(--av-border)] bg-[var(--av-bg)] pl-10 text-sm"
          />
        </div>
        {lookupBusy && debouncedLookup.trim().length >= 2 ? (
          <p className="mt-2 text-xs text-[var(--av-muted)]">{t("lists.searching")}</p>
        ) : null}
        {lookupHits.length > 0 ? (
          <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg)]/50 p-2">
            {lookupHits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-[background,transform] duration-200",
                    "hover:bg-[var(--av-surface-hover)] active:scale-[0.99]"
                  )}
                  onClick={() => addFromHit(h)}
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{h.name}</span>
                  <span className="shrink-0 text-[10px] tabular-nums text-[var(--av-muted-foreground)]">
                    {h.episodeCount} ep · {h.mode}
                  </span>
                  <ListPlus className="h-4 w-4 shrink-0 text-[var(--av-accent)]" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-3xl border border-[var(--av-border)] bg-[var(--av-surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--av-muted)]">
          {t("lists.manualEntry")}
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs tabular-nums"
              placeholder={t("lists.seriesIdPlaceholder")}
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
            />
            <Input
              className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
              placeholder={t("lists.displayNamePlaceholder")}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="h-10 rounded-xl border border-[var(--av-border)] bg-[var(--av-bg)] px-3 text-xs text-[var(--av-text)]"
              value={draftMode}
              onChange={(e) => setDraftMode(e.target.value as "sub" | "dub")}
            >
              <option value="sub">{t("lists.sub")}</option>
              <option value="dub">{t("lists.dub")}</option>
            </select>
            <Button
              type="button"
              className="h-10 rounded-xl bg-[var(--av-text)] text-[var(--av-bg)] transition-transform duration-200 hover:opacity-90 active:scale-[0.98]"
              onClick={add}
            >
              <BookmarkPlus className="mr-1 h-4 w-4" />
              {t("lists.save")}
            </Button>
          </div>
        </div>
      </section>

      {entries.length === 0 ? (
        <p className="text-sm text-[var(--av-muted)]">{t("lists.empty")}</p>
      ) : entries.length > VIRTUAL_LIST_THRESHOLD ? (
        <div ref={listWrapRef} className="w-full" role="list">
          <FixedSizeList
            height={Math.min(560, entries.length * LIST_ROW_HEIGHT)}
            width={listWidth}
            itemCount={entries.length}
            itemSize={LIST_ROW_HEIGHT}
            itemData={virtualListData}
            className="scrollbar-thin"
          >
            {SavedListRow}
          </FixedSizeList>
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg-elevated)] px-4 py-3"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() =>
                  navigate(`/anime/${e.id}`, {
                    state: {
                      anime: {
                        id: e.id,
                        name: e.name,
                        episodeCount: 0,
                        mode: e.mode,
                      },
                    },
                  })
                }
              >
                <p className="truncate font-medium">{e.name}</p>
                <p className="text-[10px] tabular-nums text-[var(--av-muted-foreground)]">
                  {e.id} · {e.mode}
                </p>
              </button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0 rounded-xl text-[var(--av-muted)] hover:text-red-400"
                aria-label={t("lists.removeAria")}
                onClick={() => remove(e.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
