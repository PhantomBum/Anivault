import { BrowserWindow, app } from "electron";
import { NoOpLogger, autoUpdater } from "electron-updater";

import {
  GITHUB_UPDATE_OWNER,
  GITHUB_UPDATE_REPO,
  isBackgroundAutoUpdateEnabled,
  isUpdaterDebugEnabled,
} from "@/main/update-config";

/**
 * Configure GitHub feed; optional background checks only when `ANIVAULT_AUTO_UPDATE=1`.
 * Renderer can still call `checkElectronUpdates` manually; errors return to UI, not stderr.
 */
export function setupAutoUpdater(): void {
  if (!app.isPackaged) {
    return;
  }

  const debug = isUpdaterDebugEnabled();
  /** Avoid stderr noise (e.g. missing `latest.yml`) unless ANIVAULT_UPDATER_DEBUG=1. */
  autoUpdater.logger = debug
    ? {
        info: (...msg: unknown[]) => console.log("[anivault-updater]", ...msg),
        warn: (...msg: unknown[]) => console.warn("[anivault-updater]", ...msg),
        error: (...msg: unknown[]) => console.error("[anivault-updater]", ...msg),
        debug: (m: string) => console.debug("[anivault-updater]", m),
      }
    : new NoOpLogger();

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

  autoUpdater.on("error", (err) => {
    if (debug) console.error("[anivault-updater] error", err);
  });

  if (debug) {
    autoUpdater.on("checking-for-update", () => console.log("[anivault-updater] checking…"));
    autoUpdater.on("update-available", (info) =>
      console.log("[anivault-updater] update available", info.version)
    );
    autoUpdater.on("update-not-available", (info) =>
      console.log("[anivault-updater] up to date", info.version)
    );
    autoUpdater.on("download-progress", (p) =>
      console.log("[anivault-updater] download", `${Math.round(p.percent)}%`)
    );
  }

  if (isBackgroundAutoUpdateEnabled()) {
    void autoUpdater.checkForUpdates();
    setInterval(() => void autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000);
  }
}
