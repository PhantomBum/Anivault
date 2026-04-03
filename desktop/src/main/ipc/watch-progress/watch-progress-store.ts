import Store from "electron-store";

import type { WatchProgressContinueItem, WatchProgressRecord } from "@/shared/watch-progress-types";
export type { WatchProgressRecord };

type Schema = {
  entries: Record<string, WatchProgressRecord>;
};

const store = new Store<Schema>({
  name: "watch-progress",
  defaults: { entries: {} },
});

export function watchProgressKey(
  animeId: string,
  episode: string,
  mode: "sub" | "dub"
): string {
  return `${animeId}\u0001${episode}\u0001${mode}`;
}

export function saveWatchProgress(
  animeId: string,
  episode: string,
  mode: "sub" | "dub",
  positionSec: number,
  durationSec: number
): void {
  const k = watchProgressKey(animeId, episode, mode);
  const entries = { ...store.get("entries") };
  entries[k] = {
    positionSec,
    durationSec,
    updatedAt: Date.now(),
  };
  store.set("entries", entries);
}

export function getWatchProgress(
  animeId: string,
  episode: string,
  mode: "sub" | "dub"
): WatchProgressRecord | null {
  const k = watchProgressKey(animeId, episode, mode);
  return store.get("entries")[k] ?? null;
}

/** Remove all progress rows for one series (e.g. after “clear history”). */
export function clearWatchProgressForAnime(animeId: string): void {
  const prefix = `${animeId}\u0001`;
  const entries = { ...store.get("entries") };
  for (const key of Object.keys(entries)) {
    if (key.startsWith(prefix)) {
      delete entries[key];
    }
  }
  store.set("entries", entries);
}

export function watchProgressStats(): { trackedEpisodes: number } {
  return { trackedEpisodes: Object.keys(store.get("entries")).length };
}

/**
 * Recent progress rows, newest first, then one entry per anime (latest touched episode).
 */
export function listContinueWatching(limit: number): WatchProgressContinueItem[] {
  const entries = store.get("entries");
  const rows: WatchProgressContinueItem[] = [];
  for (const [key, rec] of Object.entries(entries)) {
    const parts = key.split("\u0001");
    if (parts.length !== 3) continue;
    const [animeId, episode, mode] = parts;
    if (mode !== "sub" && mode !== "dub") continue;
    rows.push({
      animeId,
      episode,
      mode,
      positionSec: rec.positionSec,
      durationSec: rec.durationSec,
      updatedAt: rec.updatedAt,
    });
  }
  rows.sort((a, b) => b.updatedAt - a.updatedAt);
  const byAnime = new Map<string, WatchProgressContinueItem>();
  for (const r of rows) {
    if (!byAnime.has(r.animeId)) byAnime.set(r.animeId, r);
  }
  return [...byAnime.values()].slice(0, Math.max(0, limit));
}
