import { contextBridge, ipcRenderer } from "electron";

import type { WatchProgressRecord } from "@/shared/watch-progress-types";
import {
  WATCH_PROGRESS_CLEAR_SERIES,
  WATCH_PROGRESS_GET,
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
      ipcRenderer.invoke(WATCH_PROGRESS_STATS) as Promise<{ trackedEpisodes: number }>,
  });
}
