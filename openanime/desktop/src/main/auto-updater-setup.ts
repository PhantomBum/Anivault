import { BrowserWindow, app } from "electron";
import { NoOpLogger, autoUpdater } from "electron-updater";

import {
  GITHUB_UPDATE_OWNER,
  GITHUB_UPDATE_REPO,
  isBackgroundAutoUpdateEnabled,
} from "@/main/update-config";

/**
 * Configure GitHub feed; optional background checks only when `ANIVAULT_AUTO_UPDATE=1`.
 * Renderer can still call `checkElectronUpdates` manually; errors return to UI, not stderr.
 */
export function setupAutoUpdater(): void {
  if (!app.isPackaged) {
    return;
  }

  /** Avoid stderr noise (e.g. missing `latest.yml`) until GitHub Releases ship updater artifacts. */
  autoUpdater.logger = new NoOpLogger();

  autoUpdater.autoDownload = true;
  autoUpdater.allowPrerelease = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.setFeedURL({
    provider: "github",
    owner: GITHUB_UPDATE_OWNER,
    repo: GITHUB_UPDATE_REPO,
  });

  autoUpdater.on("update-downloaded", () => {
    for (const w of BrowserWindow.getAllWindows()) {
      w.webContents.send("app:update-downloaded");
    }
  });

  autoUpdater.on("error", () => {
    /* errors are expected until releases include latest.yml; keep quiet */
  });

  if (isBackgroundAutoUpdateEnabled()) {
    void autoUpdater.checkForUpdates();
    setInterval(() => void autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000);
  }
}
