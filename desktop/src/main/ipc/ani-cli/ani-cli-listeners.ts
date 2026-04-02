import {
  getEpisodesList,
  getRecentAnime,
  getShowDetails,
  searchAnime,
} from "@/main/ipc/ani-cli/ani-cli-search";
import { getStreamProxyBaseUrl } from "@/main/stream-proxy";
import { ipcMain } from "electron";

import {
  ANI_CLI_EPISODES_CHANNEL,
  ANI_CLI_RECENT_CHANNEL,
  ANI_CLI_SEARCH_CHANNEL,
  ANI_CLI_SHOW_DETAILS_CHANNEL,
  ANI_CLI_STREAM_PROXY_BASE_CHANNEL,
  ANI_CLI_STREAM_URL_CHANNEL,
} from "./ani-cli-channels";
import { getStreamUrl } from "./ani-cli-stream";

/** Failsafe if inner resolution hangs (stream-resolver already caps work, but IPC must not hang forever). */
const IPC_STREAM_URL_TIMEOUT_MS = 120_000;

function withIpcTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => {
      timer = undefined;
      reject(new Error(`${label} (IPC timed out after ${ms}ms)`));
    }, ms);
    void p.then(
      (v) => {
        if (timer) clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        if (timer) clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    );
  });
}

export function addAniCliListeners() {
  ipcMain.handle(ANI_CLI_SEARCH_CHANNEL, (_event, query: string) => searchAnime(query));
  ipcMain.handle(ANI_CLI_EPISODES_CHANNEL, (_event, showId: string, mode: "sub" | "dub") =>
    getEpisodesList(showId, mode)
  );
  ipcMain.handle(
    ANI_CLI_STREAM_URL_CHANNEL,
    (_event, showId: string, episode: string, mode: "sub" | "dub") =>
      withIpcTimeout(
        getStreamUrl(showId, episode, mode),
        IPC_STREAM_URL_TIMEOUT_MS,
        "getStreamUrl"
      )
  );
  ipcMain.handle(ANI_CLI_STREAM_PROXY_BASE_CHANNEL, () => getStreamProxyBaseUrl());
  ipcMain.handle(ANI_CLI_SHOW_DETAILS_CHANNEL, (_event, showId: string) => getShowDetails(showId));
  ipcMain.handle(ANI_CLI_RECENT_CHANNEL, (_event, page: number, limit?: number) =>
    getRecentAnime(page, limit ?? 12)
  );
}
