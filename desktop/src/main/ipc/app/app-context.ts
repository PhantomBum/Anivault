import { contextBridge, ipcRenderer } from "electron";

import { AppUpdateCheckResult } from "@/shared/app-update-types";

import {
  APP_CHECK_ELECTRON_UPDATES_CHANNEL,
  APP_CHECK_FOR_UPDATE_CHANNEL,
  APP_OS_CHANNEL,
  APP_QUIT_AND_INSTALL_CHANNEL,
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
        | { kind: "ok"; version: string | null }
        | { kind: "error"; message: string }
      >,
    onUpdateDownloaded: (cb: () => void) => {
      const fn = () => cb();
      ipcRenderer.on(UPDATE_DOWNLOADED_EVENT, fn);
      return () => ipcRenderer.removeListener(UPDATE_DOWNLOADED_EVENT, fn);
    },
  });
}
