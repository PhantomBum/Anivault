import { ipcMain } from "electron";

import {
  WATCH_PROGRESS_CLEAR_SERIES,
  WATCH_PROGRESS_GET,
  WATCH_PROGRESS_SAVE,
  WATCH_PROGRESS_STATS,
} from "./watch-progress-channels";
import {
  clearWatchProgressForAnime,
  getWatchProgress,
  saveWatchProgress,
  watchProgressStats,
} from "./watch-progress-store";

export function addWatchProgressListeners() {
  ipcMain.handle(
    WATCH_PROGRESS_SAVE,
    async (
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

  ipcMain.handle(
    WATCH_PROGRESS_GET,
    async (_event, animeId: string, episode: string, mode: "sub" | "dub") => {
      if (typeof animeId !== "string" || typeof episode !== "string") return null;
      if (mode !== "sub" && mode !== "dub") return null;
      return getWatchProgress(animeId, episode, mode);
    }
  );

  ipcMain.handle(WATCH_PROGRESS_CLEAR_SERIES, async (_event, animeId: string) => {
    if (typeof animeId !== "string") return;
    clearWatchProgressForAnime(animeId);
  });

  ipcMain.handle(WATCH_PROGRESS_STATS, async () => watchProgressStats());
}
