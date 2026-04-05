import { randomUUID } from "node:crypto";
import fs from "node:fs";

import { shell, ipcMain } from "electron";

import type {
  OfflineDownloadAddPayload,
  OfflineDownloadAddResult,
  OfflineDownloadItem,
  OfflineIntegrityResult,
  OfflineStorageStats,
} from "@/shared/offline-downloads-types";

import {
  OFFLINE_DOWNLOADS_ADD,
  OFFLINE_DOWNLOADS_CLEAR_COMPLETED,
  OFFLINE_DOWNLOADS_LIST,
  OFFLINE_DOWNLOADS_REMOVE,
  OFFLINE_DOWNLOADS_REVEAL,
  OFFLINE_DOWNLOADS_RETRY,
  OFFLINE_DOWNLOADS_STORAGE_STATS,
  OFFLINE_DOWNLOADS_VERIFY_INTEGRITY,
} from "./offline-downloads-channels";
import {
  clearCompletedOfflineDownloads,
  getOfflineDownloadItems,
  patchOfflineDownloadItem,
  pushOfflineDownloadItem,
  removeOfflineDownloadItem,
} from "./offline-downloads-store";
import {
  currentDownloadingId,
  readOfflineEnabled,
  readOfflinePath,
  scheduleOfflineDownloadProcessing,
} from "./offline-downloads-worker";

function isDuplicateActive(
  items: OfflineDownloadItem[],
  p: OfflineDownloadAddPayload
): boolean {
  return items.some(
    (i) =>
      i.showId === p.showId &&
      i.episode === p.episode &&
      i.mode === p.mode &&
      (i.status === "queued" || i.status === "downloading")
  );
}

function computeStorageStats(items: OfflineDownloadItem[]): OfflineStorageStats {
  const dlPath = readOfflinePath();
  const byShow = new Map<string, { showId: string; showName: string; files: number; bytes: number }>();
  let totalFiles = 0;
  let totalBytes = 0;

  for (const item of items) {
    if (item.status !== "complete" || !item.localPath) continue;
    let fileSize = 0;
    try {
      if (fs.existsSync(item.localPath)) {
        fileSize = fs.statSync(item.localPath).size;
      }
    } catch {
      /* ignore */
    }
    totalFiles++;
    totalBytes += fileSize;

    const existing = byShow.get(item.showId);
    if (existing) {
      existing.files++;
      existing.bytes += fileSize;
    } else {
      byShow.set(item.showId, {
        showId: item.showId,
        showName: item.showName,
        files: 1,
        bytes: fileSize,
      });
    }
  }

  return {
    totalFiles,
    totalBytes,
    byShow: [...byShow.values()].sort((a, b) => b.bytes - a.bytes),
    downloadsFolderPath: dlPath || "",
  };
}

function verifyIntegrity(items: OfflineDownloadItem[]): OfflineIntegrityResult {
  let checked = 0;
  let valid = 0;
  let missing = 0;
  const missingIds: string[] = [];

  for (const item of items) {
    if (item.status !== "complete" || !item.localPath) continue;
    checked++;
    if (fs.existsSync(item.localPath)) {
      valid++;
    } else {
      missing++;
      missingIds.push(item.id);
    }
  }

  return { checked, valid, missing, missingIds };
}

export function addOfflineDownloadsListeners() {
  ipcMain.handle(OFFLINE_DOWNLOADS_LIST, (): OfflineDownloadItem[] => {
    return getOfflineDownloadItems().sort((a, b) => b.queuedAt - a.queuedAt);
  });

  ipcMain.handle(
    OFFLINE_DOWNLOADS_ADD,
    (_event, payload: OfflineDownloadAddPayload): OfflineDownloadAddResult => {
      if (!readOfflineEnabled()) {
        return { ok: false, error: "Offline downloads are disabled in Settings → Data." };
      }
      const dir = readOfflinePath();
      if (!dir) {
        return { ok: false, error: "Choose a download folder in Settings → Data first." };
      }
      const items = getOfflineDownloadItems();
      if (isDuplicateActive(items, payload)) {
        return { ok: false, error: "This episode is already queued or downloading." };
      }
      const now = Date.now();
      const item: OfflineDownloadItem = {
        id: randomUUID(),
        showId: payload.showId,
        showName: payload.showName,
        episode: payload.episode,
        mode: payload.mode,
        status: "queued",
        queuedAt: now,
        updatedAt: now,
      };
      pushOfflineDownloadItem(item);
      scheduleOfflineDownloadProcessing();
      return { ok: true, id: item.id };
    }
  );

  ipcMain.handle(OFFLINE_DOWNLOADS_REMOVE, (_event, id: string) => {
    if (currentDownloadingId === id) {
      return { ok: false as const, error: "Cannot remove while this item is downloading." };
    }
    if (!removeOfflineDownloadItem(id)) {
      return { ok: false as const, error: "Not found." };
    }
    return { ok: true as const };
  });

  ipcMain.handle(OFFLINE_DOWNLOADS_CLEAR_COMPLETED, () => {
    clearCompletedOfflineDownloads();
  });

  ipcMain.handle(OFFLINE_DOWNLOADS_RETRY, (_event, id: string) => {
    const item = getOfflineDownloadItems().find((i) => i.id === id);
    if (!item || item.status !== "failed") {
      return { ok: false as const, error: "Only failed items can be retried." };
    }
    patchOfflineDownloadItem(id, {
      status: "queued",
      error: undefined,
      localPath: undefined,
      bytesWritten: undefined,
    });
    scheduleOfflineDownloadProcessing();
    return { ok: true as const };
  });

  ipcMain.handle(OFFLINE_DOWNLOADS_REVEAL, (_event, localPath: string) => {
    if (!localPath || !fs.existsSync(localPath)) {
      return false;
    }
    shell.showItemInFolder(localPath);
    return true;
  });

  ipcMain.handle(OFFLINE_DOWNLOADS_STORAGE_STATS, () => {
    const items = getOfflineDownloadItems();
    return computeStorageStats(items);
  });

  ipcMain.handle(OFFLINE_DOWNLOADS_VERIFY_INTEGRITY, () => {
    const items = getOfflineDownloadItems();
    return verifyIntegrity(items);
  });

  scheduleOfflineDownloadProcessing();
}
