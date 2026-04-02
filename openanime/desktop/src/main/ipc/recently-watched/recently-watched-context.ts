import { contextBridge, ipcRenderer } from "electron";

import {
  RECENTLY_WATCHED_CLEAR_CHANNEL,
  RECENTLY_WATCHED_READ_CHANNEL,
  RECENTLY_WATCHED_RECORD_CHANNEL,
} from "./recently-watched-channels";

export interface RecentlyWatchedEntry {
  animeId: string;
  episode: string;
  mode: "sub" | "dub";
  timestamp?: number;
  displayName?: string;
}

export function exposeRecentlyWatchedContext() {
  contextBridge.exposeInMainWorld("recentlyWatched", {
    record: (animeId: string, episode: string, mode?: "sub" | "dub", displayName?: string) =>
      ipcRenderer.invoke(
        RECENTLY_WATCHED_RECORD_CHANNEL,
        animeId,
        episode,
        mode ?? "sub",
        displayName
      ) as Promise<void>,
    read: () =>
      ipcRenderer.invoke(RECENTLY_WATCHED_READ_CHANNEL) as Promise<
        RecentlyWatchedEntry[]
      >,
    clear: () =>
      ipcRenderer.invoke(RECENTLY_WATCHED_CLEAR_CHANNEL) as Promise<void>,
  });
}
