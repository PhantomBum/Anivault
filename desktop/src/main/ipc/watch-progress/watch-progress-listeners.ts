import { ipcMain } from "electron";

import type { WatchProgressExport } from "@/shared/watch-progress-types";

import {
  WATCH_PROGRESS_BATCH_MARK_UNWATCHED,
  WATCH_PROGRESS_BATCH_MARK_WATCHED,
  WATCH_PROGRESS_CLEAR_SERIES,
  WATCH_PROGRESS_EXPORT,
  WATCH_PROGRESS_GET,
  WATCH_PROGRESS_IMPORT,
  WATCH_PROGRESS_LIST_CONTINUE,
  WATCH_PROGRESS_SAVE,
  WATCH_PROGRESS_STATS,
} from "./watch-progress-channels";
import {
  batchMarkUnwatched,
  batchMarkWatched,
  clearWatchProgressForAnime,
  exportWatchProgress,
  getWatchProgress,
  importWatchProgress,
  listContinueWatching,
  saveWatchProgress,
  watchProgressStats,
} from "./watch-progress-store";

export function addWatchProgressListeners() {
  ipcMain.handle(
    WATCH_PROGRESS_SAVE,
    (
      _event,
      animeId: string,
      episode: string,
      mode: "sub" | "dub",
      positionSec: number,
      durationSec: number
    ) => {
      if (typeof animeId !== "string" || typeof episode !== "string") return;
      if (mode !== "sub" && mode !== "dub") return;
      if (!Number.isFinite(positionSec) || !Number.isFinite(durationSec)) return;
      saveWatchProgress(animeId, episode, mode, positionSec, durationSec);
    }
  );

  ipcMain.handle(WATCH_PROGRESS_GET, (_event, animeId: string, episode: string, mode: "sub" | "dub") => {
    if (typeof animeId !== "string" || typeof episode !== "string") return null;
    if (mode !== "sub" && mode !== "dub") return null;
    return getWatchProgress(animeId, episode, mode);
  });

  ipcMain.handle(WATCH_PROGRESS_CLEAR_SERIES, (_event, animeId: string) => {
    if (typeof animeId !== "string") return;
    clearWatchProgressForAnime(animeId);
  });

  ipcMain.handle(WATCH_PROGRESS_STATS, () => watchProgressStats());

  ipcMain.handle(WATCH_PROGRESS_LIST_CONTINUE, (_event, limit: number) => {
    const n =
      typeof limit === "number" && Number.isFinite(limit)
        ? Math.min(48, Math.max(1, Math.floor(limit)))
        : 12;
    return listContinueWatching(n);
  });

  ipcMain.handle(
    WATCH_PROGRESS_BATCH_MARK_WATCHED,
    (
      _event,
      animeId: string,
      episodes: string[],
      mode: "sub" | "dub",
      durationSec: number
    ) => {
      if (typeof animeId !== "string" || !Array.isArray(episodes)) return 0;
      if (mode !== "sub" && mode !== "dub") return 0;
      if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
      return batchMarkWatched(animeId, episodes, mode, durationSec);
    }
  );

  ipcMain.handle(
    WATCH_PROGRESS_BATCH_MARK_UNWATCHED,
    (_event, animeId: string, episodes: string[], mode: "sub" | "dub") => {
      if (typeof animeId !== "string" || !Array.isArray(episodes)) return 0;
      if (mode !== "sub" && mode !== "dub") return 0;
      return batchMarkUnwatched(animeId, episodes, mode);
    }
  );

  ipcMain.handle(WATCH_PROGRESS_EXPORT, () => exportWatchProgress());

  ipcMain.handle(WATCH_PROGRESS_IMPORT, (_event, data: WatchProgressExport) => {
    if (!data || typeof data !== "object" || data.version !== 1) {
      return { imported: 0, skipped: 0, error: "Invalid export format" };
    }
    try {
      return importWatchProgress(data);
    } catch (e) {
      return { imported: 0, skipped: 0, error: e instanceof Error ? e.message : "Import failed" };
    }
  });
}
