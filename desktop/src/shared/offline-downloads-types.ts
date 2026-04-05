export type OfflineDownloadStatus = "queued" | "downloading" | "paused" | "complete" | "failed";

export type OfflineDownloadItem = {
  id: string;
  showId: string;
  showName: string;
  episode: string;
  mode: "sub" | "dub";
  status: OfflineDownloadStatus;
  queuedAt: number;
  updatedAt: number;
  bytesWritten?: number;
  totalBytes?: number;
  error?: string;
  /** Local file path when status is complete. */
  localPath?: string;
};

export type OfflineDownloadAddPayload = {
  showId: string;
  showName: string;
  episode: string;
  mode: "sub" | "dub";
};

export type OfflineDownloadAddResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type OfflineStorageStats = {
  totalFiles: number;
  totalBytes: number;
  byShow: Array<{
    showId: string;
    showName: string;
    files: number;
    bytes: number;
  }>;
  downloadsFolderPath: string;
};

export type OfflineIntegrityResult = {
  checked: number;
  valid: number;
  missing: number;
  missingIds: string[];
};
