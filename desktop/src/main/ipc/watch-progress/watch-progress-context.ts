import { contextBridge, ipcRenderer } from "electron";

import type {
  WatchProgressContinueItem,
  WatchProgressExport,
  WatchProgressRecord,
  WatchProgressStatsResult,
} from "@/shared/watch-progress-types";
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

export function exposeWatchProgressContext() {
  contextBridge.exposeInMainWorld("watchProgress", {
    save: (
      animeId: string,
      episode: string,
      mode: "sub" | "dub",
      positionSec: number,
      durationSec: number
    ) => ipcRenderer.invoke(WATCH_PROGRESS_SAVE, animeId, episode, mode, positionSec, durationSec),
    get: (animeId: string, episode: string, mode: "sub" | "dub") =>
      ipcRenderer.invoke(WATCH_PROGRESS_GET, animeId, episode, mode) as Promise<
        WatchProgressRecord | null
      >,
    clearSeries: (animeId: string) =>
      ipcRenderer.invoke(WATCH_PROGRESS_CLEAR_SERIES, animeId) as Promise<void>,
    stats: () =>
      ipcRenderer.invoke(WATCH_PROGRESS_STATS) as Promise<WatchProgressStatsResult>,
    listContinue: (limit?: number) =>
      ipcRenderer.invoke(WATCH_PROGRESS_LIST_CONTINUE, limit ?? 12) as Promise<
        WatchProgressContinueItem[]
      >,
    batchMarkWatched: (
      animeId: string,
      episodes: string[],
      mode: "sub" | "dub",
      durationSec: number
    ) =>
      ipcRenderer.invoke(
        WATCH_PROGRESS_BATCH_MARK_WATCHED,
        animeId,
        episodes,
        mode,
        durationSec
      ) as Promise<number>,
    batchMarkUnwatched: (animeId: string, episodes: string[], mode: "sub" | "dub") =>
      ipcRenderer.invoke(
        WATCH_PROGRESS_BATCH_MARK_UNWATCHED,
        animeId,
        episodes,
        mode
      ) as Promise<number>,
    exportData: () =>
      ipcRenderer.invoke(WATCH_PROGRESS_EXPORT) as Promise<WatchProgressExport>,
    importData: (data: WatchProgressExport) =>
      ipcRenderer.invoke(WATCH_PROGRESS_IMPORT, data) as Promise<{
        imported: number;
        skipped: number;
        error?: string;
      }>,
  });
}
