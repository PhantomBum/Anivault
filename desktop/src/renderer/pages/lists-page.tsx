import { BookmarkPlus, ListPlus, Search, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { useDebouncedValue } from "@/renderer/hooks/use-debounced-value";
import { getAniCli } from "@/renderer/lib/ani-cli-bridge";
import { cachedAniSearch } from "@/renderer/lib/ani-session-cache";
import { cn } from "@/renderer/lib/utils";

const STORAGE_KEY = "anivault-local-watchlist-v1";
const SEARCH_WAIT_MS = 380;

type ListEntry = { id: string; name: string; mode: "sub" | "dub" };

function loadList(): ListEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ListEntry =>
        x != null &&
        typeof x === "object" &&
        "id" in x &&
        typeof (x as ListEntry).id === "string" &&
        typeof (x as ListEntry).name === "string" &&
        ((x as ListEntry).mode === "sub" || (x as ListEntry).mode === "dub")
    );
  } catch {
    return [];
  }
}

export function ListsPage() {
  const navigate = useNavigate();
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
    setEntries(loadList());
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-2 text-[var(--av-text)]">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--av-accent)]">
          Lists
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">My lists</h1>
        <p className="mt-1 text-sm text-[var(--av-muted)]">
          Saved on this device. Search the catalog to add instantly, or paste a series ID.
        </p>
      </header>

      <section className="rounded-3xl border border-[var(--av-border)] bg-[var(--av-surface)] p-5 shadow-av-sm transition-[box-shadow] duration-200 hover:shadow-av-md">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-[var(--av-accent)]" aria-hidden />
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--av-muted)]">
            Add from catalog
          </p>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--av-muted)]" />
          <Input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder="Type a title (e.g. demon, jujutsu)…"
            className="h-11 rounded-2xl border-[var(--av-border)] bg-[var(--av-bg)] pl-10 text-sm"
          />
        </div>
        {lookupBusy && debouncedLookup.trim().length >= 2 ? (
          <p className="mt-2 text-xs text-[var(--av-muted)]">Searching…</p>
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
          Manual entry
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs tabular-nums"
              placeholder="Series ID (from search)"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
            />
            <Input
              className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
              placeholder="Display name"
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
              <option value="sub">Sub</option>
              <option value="dub">Dub</option>
            </select>
            <Button
              type="button"
              className="h-10 rounded-xl bg-[var(--av-text)] text-[var(--av-bg)] transition-transform duration-200 hover:opacity-90 active:scale-[0.98]"
              onClick={add}
            >
              <BookmarkPlus className="mr-1 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </section>

      {entries.length === 0 ? (
        <p className="text-sm text-[var(--av-muted)]">No saved series yet.</p>
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
                aria-label="Remove"
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
