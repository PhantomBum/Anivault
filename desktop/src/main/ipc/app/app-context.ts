import { contextBridge, ipcRenderer } from "electron";

import { AppUpdateCheckResult } from "@/shared/app-update-types";

import {
  APP_CHECK_ELECTRON_UPDATES_CHANNEL,
  APP_CHECK_FOR_UPDATE_CHANNEL,
  APP_OS_CHANNEL,
  APP_PICK_DOWNLOADS_FOLDER_CHANNEL,
  APP_QUIT_AND_INSTALL_CHANNEL,
  APP_REVEAL_USER_DATA_CHANNEL,
  APP_USER_DATA_PATH_CHANNEL,
  APP_VERSION_CHANNEL,
} from "./app-channels";

const UPDATE_DOWNLOADED_EVENT = "app:update-downloaded";

export function exposeAppContext() {
  contextBridge.exposeInMainWorld("app", {
    version: () => ipcRenderer.invoke(APP_VERSION_CHANNEL) as Promise<string>,
    os: () => ipcRenderer.invoke(APP_OS_CHANNEL) as Promise<string>,
    checkForUpdate: () =>
      ipcRenderer.invoke(APP_CHECK_FOR_UPDATE_CHANNEL) as Promise<AppUpdateCheckResult>,
    quitAndInstall: () =>
      ipcRenderer.invoke(APP_QUIT_AND_INSTALL_CHANNEL) as Promise<boolean>,
    checkElectronUpdates: () =>
      ipcRenderer.invoke(APP_CHECK_ELECTRON_UPDATES_CHANNEL) as Promise<
        | { kind: "skipped"; reason: string }
        | {
            kind: "ok";
            version: string | null;
            currentVersion: string;
            isUpdateAvailable: boolean;
          }
        | { kind: "error"; message: string }
      >,
    pickDownloadsFolder: () =>
      ipcRenderer.invoke(APP_PICK_DOWNLOADS_FOLDER_CHANNEL) as Promise<string | null>,
    getUserDataPath: () =>
      ipcRenderer.invoke(APP_USER_DATA_PATH_CHANNEL) as Promise<string>,
    revealUserDataFolder: () =>
      ipcRenderer.invoke(APP_REVEAL_USER_DATA_CHANNEL) as Promise<boolean>,
    onUpdateDownloaded: (cb: () => void) => {
      const fn = () => cb();
      ipcRenderer.on(UPDATE_DOWNLOADED_EVENT, fn);
      return () => ipcRenderer.removeListener(UPDATE_DOWNLOADED_EVENT, fn);
    },
  });
}
