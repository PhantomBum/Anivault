import { contextBridge, ipcRenderer } from "electron";

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

export function exposeOfflineDownloadsContext() {
  contextBridge.exposeInMainWorld("offlineDownloads", {
    list: () => ipcRenderer.invoke(OFFLINE_DOWNLOADS_LIST) as Promise<OfflineDownloadItem[]>,
    add: (payload: OfflineDownloadAddPayload) =>
      ipcRenderer.invoke(OFFLINE_DOWNLOADS_ADD, payload) as Promise<OfflineDownloadAddResult>,
    remove: (id: string) =>
      ipcRenderer.invoke(OFFLINE_DOWNLOADS_REMOVE, id) as Promise<
        { ok: true } | { ok: false; error: string }
      >,
    clearCompleted: () => ipcRenderer.invoke(OFFLINE_DOWNLOADS_CLEAR_COMPLETED) as Promise<void>,
    retry: (id: string) =>
      ipcRenderer.invoke(OFFLINE_DOWNLOADS_RETRY, id) as Promise<
        { ok: true } | { ok: false; error: string }
      >,
    reveal: (localPath: string) =>
      ipcRenderer.invoke(OFFLINE_DOWNLOADS_REVEAL, localPath) as Promise<boolean>,
    storageStats: () =>
      ipcRenderer.invoke(OFFLINE_DOWNLOADS_STORAGE_STATS) as Promise<OfflineStorageStats>,
    verifyIntegrity: () =>
      ipcRenderer.invoke(OFFLINE_DOWNLOADS_VERIFY_INTEGRITY) as Promise<OfflineIntegrityResult>,
  });
}
