import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { platform as nodePlatform } from "node:os";
import { autoUpdater } from "electron-updater";

import {
  APP_CHECK_ELECTRON_UPDATES_CHANNEL,
  APP_CHECK_FOR_UPDATE_CHANNEL,
  APP_OS_CHANNEL,
  APP_PICK_DOWNLOADS_FOLDER_CHANNEL,
  APP_REVEAL_USER_DATA_CHANNEL,
  APP_USER_DATA_PATH_CHANNEL,
  APP_QUIT_AND_INSTALL_CHANNEL,
  APP_VERSION_CHANNEL,
} from "./app-channels";
import { checkGitHubReleaseVsCurrent } from "./check-for-update";

export function addAppEventListeners() {
  ipcMain.handle(APP_USER_DATA_PATH_CHANNEL, () => app.getPath("userData"));

  ipcMain.handle(APP_REVEAL_USER_DATA_CHANNEL, async () => {
    const dir = app.getPath("userData");
    const err = await shell.openPath(dir);
    return err === "" || err === undefined;
  });

  ipcMain.handle(APP_PICK_DOWNLOADS_FOLDER_CHANNEL, async () => {
    const win = BrowserWindow.getFocusedWindow();
    const r = await dialog.showOpenDialog(win ?? undefined, {
      properties: ["openDirectory", "createDirectory"],
    });
    if (r.canceled || r.filePaths.length === 0) {
      return null;
    }
    return r.filePaths[0];
  });

  ipcMain.handle(APP_VERSION_CHANNEL, () => app.getVersion());
  ipcMain.handle(APP_OS_CHANNEL, () => nodePlatform());
  ipcMain.handle(APP_CHECK_FOR_UPDATE_CHANNEL, () => checkGitHubReleaseVsCurrent());

  ipcMain.handle(APP_QUIT_AND_INSTALL_CHANNEL, () => {
    if (app.isPackaged) {
      setImmediate(() => {
        autoUpdater.quitAndInstall(false, true);
      });
    }
    return true;
  });

  ipcMain.handle(APP_CHECK_ELECTRON_UPDATES_CHANNEL, async () => {
    if (!app.isPackaged) {
      return { kind: "skipped" as const, reason: "development" };
    }
    try {
      const r = await autoUpdater.checkForUpdates();
      const currentVersion = app.getVersion();
      if (!r) {
        return {
          kind: "ok" as const,
          version: null,
          currentVersion,
          isUpdateAvailable: false,
        };
      }
      return {
        kind: "ok" as const,
        version: r.updateInfo?.version ?? null,
        currentVersion,
        isUpdateAvailable: r.isUpdateAvailable,
      };
    } catch (e) {
      return {
        kind: "error" as const,
        message: e instanceof Error ? e.message : String(e),
      };
    }
  });
}
