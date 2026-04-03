export type OfflineDownloadStatus = "queued" | "downloading" | "complete" | "failed";

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
