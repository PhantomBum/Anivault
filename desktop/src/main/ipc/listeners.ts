import { ipcMain } from "electron";

import * as ANIVAULT_CHANNELS from "./anivault/anivault-channels";
import * as ANI_CLI_CHANNELS from "./ani-cli/ani-cli-channels";
import { addAnivaultListeners } from "./anivault/anivault-listeners";
import { addAniCliListeners } from "./ani-cli/ani-cli-listeners";
import * as APP_CHANNELS from "./app/app-channels";
import { addAppEventListeners } from "./app/app-listeners";
import * as EXTERNAL_CHANNELS from "./external/external-channels";
import { addExternalEventListeners } from "./external/external-listeners";
import * as SECURITY_CHANNELS from "./security/security-channels";
import * as RECENTLY_WATCHED_CHANNELS from "./recently-watched/recently-watched-channels";
import { addSecurityListeners } from "./security/security-listeners";
import { addRecentlyWatchedListeners } from "./recently-watched/recently-watched-listeners";
import * as OFFLINE_DOWNLOADS_CHANNELS from "./offline-downloads/offline-downloads-channels";
import { addOfflineDownloadsListeners } from "./offline-downloads/offline-downloads-listeners";
import * as WATCH_PROGRESS_CHANNELS from "./watch-progress/watch-progress-channels";
import { addWatchProgressListeners } from "./watch-progress/watch-progress-listeners";
import * as THEME_CHANNELS from "./theme/theme-channels";
import { addThemeEventListeners } from "./theme/theme-listeners";
import * as WINDOW_CHANNELS from "./window/window-channels";
import { addWindowEventListeners } from "./window/window-listeners";

export function registerListeners() {
  addThemeEventListeners();
  addSecurityListeners();
  addAnivaultListeners();
  addAniCliListeners();
  addRecentlyWatchedListeners();
  addWatchProgressListeners();
  addOfflineDownloadsListeners();
  addExternalEventListeners();
  addAppEventListeners();
  addWindowEventListeners();
}

export function unregisterListeners() {
  const allListeners = [
    ...Object.values(ANIVAULT_CHANNELS),
    ...Object.values(ANI_CLI_CHANNELS),
    ...Object.values(WINDOW_CHANNELS),
    ...Object.values(EXTERNAL_CHANNELS),
    ...Object.values(RECENTLY_WATCHED_CHANNELS),
    ...Object.values(WATCH_PROGRESS_CHANNELS),
    ...Object.values(OFFLINE_DOWNLOADS_CHANNELS),
    ...Object.values(APP_CHANNELS),
    ...Object.values(THEME_CHANNELS),
    ...Object.values(SECURITY_CHANNELS),
  ];

  allListeners.forEach((channel: string) => {
    ipcMain.removeHandler(channel);
  });
}
