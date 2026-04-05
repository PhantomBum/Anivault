import Store from "electron-store";

import type {
  WatchProgressContinueItem,
  WatchProgressExport,
  WatchProgressExportEntry,
  WatchProgressRecord,
  WatchProgressStatsResult,
} from "@/shared/watch-progress-types";
export type { WatchProgressRecord };

type Schema = {
  entries: Record<string, WatchProgressRecord>;
};

const store = new Store<Schema>({
  name: "watch-progress",
  defaults: { entries: {} },
});

function readEntries(): Schema["entries"] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const raw = store.get("entries") as unknown;
  if (!raw || typeof raw !== "object") return {};
  return raw as Schema["entries"];
}

function writeEntries(entries: Schema["entries"]): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  store.set("entries", entries);
}

export function watchProgressKey(
  animeId: string,
  episode: string,
  mode: "sub" | "dub"
): string {
  return `${animeId}\u0001${episode}\u0001${mode}`;
}

function parseKey(key: string): { animeId: string; episode: string; mode: "sub" | "dub" } | null {
  const parts = key.split("\u0001");
  if (parts.length !== 3) return null;
  const [animeId, episode, mode] = parts;
  if (mode !== "sub" && mode !== "dub") return null;
  return { animeId, episode, mode };
}

export function saveWatchProgress(
  animeId: string,
  episode: string,
  mode: "sub" | "dub",
  positionSec: number,
  durationSec: number
): void {
  const k = watchProgressKey(animeId, episode, mode);
  const entries: Schema["entries"] = { ...readEntries() };
  const existing = entries[k];
  if (existing && existing.positionSec > positionSec && positionSec < 5) {
    return;
  }
  entries[k] = {
    positionSec,
    durationSec,
    updatedAt: Date.now(),
  };
  writeEntries(entries);
}

export function getWatchProgress(
  animeId: string,
  episode: string,
  mode: "sub" | "dub"
): WatchProgressRecord | null {
  const k = watchProgressKey(animeId, episode, mode);
  const entries = readEntries();
  return entries[k] ?? null;
}

/** Remove all progress rows for one series (e.g. after "clear history"). */
export function clearWatchProgressForAnime(animeId: string): void {
  const prefix = `${animeId}\u0001`;
  const entries: Schema["entries"] = { ...readEntries() };
  for (const key of Object.keys(entries)) {
    if (key.startsWith(prefix)) {
      delete entries[key];
    }
  }
  writeEntries(entries);
}

/** Batch mark episodes as watched (position = duration). */
export function batchMarkWatched(
  animeId: string,
  episodes: string[],
  mode: "sub" | "dub",
  durationSec: number
): number {
  const entries: Schema["entries"] = { ...readEntries() };
  const now = Date.now();
  let count = 0;
  for (const ep of episodes) {
    const k = watchProgressKey(animeId, ep, mode);
    entries[k] = { positionSec: durationSec, durationSec, updatedAt: now };
    count++;
  }
  writeEntries(entries);
  return count;
}

/** Batch mark episodes as unwatched (remove progress). */
export function batchMarkUnwatched(
  animeId: string,
  episodes: string[],
  mode: "sub" | "dub"
): number {
  const entries: Schema["entries"] = { ...readEntries() };
  let count = 0;
  for (const ep of episodes) {
    const k = watchProgressKey(animeId, ep, mode);
    if (entries[k]) {
      delete entries[k];
      count++;
    }
  }
  writeEntries(entries);
  return count;
}

export function watchProgressStats(): WatchProgressStatsResult {
  const entries = readEntries();
  const series = new Set<string>();
  let totalSec = 0;
  for (const [key, rec] of Object.entries(entries)) {
    const parsed = parseKey(key);
    if (parsed) series.add(parsed.animeId);
    totalSec += rec.positionSec;
  }
  return {
    trackedEpisodes: Object.keys(entries).length,
    trackedSeries: series.size,
    totalWatchedSec: Math.round(totalSec),
  };
}

/**
 * Recent progress rows, newest first, then one entry per anime (latest touched episode).
 */
export function listContinueWatching(limit: number): WatchProgressContinueItem[] {
  const entries = readEntries();
  const rows: WatchProgressContinueItem[] = [];
  for (const [key, rec] of Object.entries(entries)) {
    const parsed = parseKey(key);
    if (!parsed) continue;
    rows.push({
      animeId: parsed.animeId,
      episode: parsed.episode,
      mode: parsed.mode,
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

/** Export all progress data for backup. */
export function exportWatchProgress(): WatchProgressExport {
  const entries = readEntries();
  const exportEntries: WatchProgressExportEntry[] = [];
  for (const [key, rec] of Object.entries(entries)) {
    const parsed = parseKey(key);
    if (!parsed) continue;
    exportEntries.push({
      animeId: parsed.animeId,
      episode: parsed.episode,
      mode: parsed.mode,
      positionSec: rec.positionSec,
      durationSec: rec.durationSec,
      updatedAt: rec.updatedAt,
    });
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: exportEntries,
  };
}

/** Import progress data, merging with existing (newer wins). */
export function importWatchProgress(data: WatchProgressExport): { imported: number; skipped: number } {
  if (data.version !== 1) {
    throw new Error(`Unsupported watch progress export version: ${String(data.version)}`);
  }
  const entries: Schema["entries"] = { ...readEntries() };
  let imported = 0;
  let skipped = 0;
  for (const entry of data.entries) {
    if (entry.mode !== "sub" && entry.mode !== "dub") {
      skipped++;
      continue;
    }
    const k = watchProgressKey(entry.animeId, entry.episode, entry.mode);
    const existing = entries[k];
    if (existing && existing.updatedAt >= entry.updatedAt) {
      skipped++;
      continue;
    }
    entries[k] = {
      positionSec: entry.positionSec,
      durationSec: entry.durationSec,
      updatedAt: entry.updatedAt,
    };
    imported++;
  }
  writeEntries(entries);
  return { imported, skipped };
}
