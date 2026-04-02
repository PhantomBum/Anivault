import { BookmarkPlus, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";

const STORAGE_KEY = "anivault-local-watchlist-v1";

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

  useEffect(() => {
    setEntries(loadList());
  }, []);

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

  const remove = useCallback(
    (id: string) => {
      persist(entries.filter((e) => e.id !== id));
    },
    [entries, persist]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-2 text-[var(--av-text)]">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--av-accent)]">
          Lists
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Local watchlist</h1>
        <p className="mt-1 text-sm text-[var(--av-muted)]">
          Saved on this device only. Add ani-cli series IDs from search, then open details to start
          watching.
        </p>
      </header>

      <div className="rounded-3xl border border-[var(--av-border)] bg-[var(--av-surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--av-muted)]">
          Add entry
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
              className="h-10 rounded-xl bg-[var(--av-text)] text-[var(--av-bg)] hover:opacity-90"
              onClick={add}
            >
              <BookmarkPlus className="mr-1 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

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
