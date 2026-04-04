import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { getStreamUrl } from "@/main/ipc/ani-cli/ani-cli-stream";
import { anivaultStore } from "@/main/ipc/anivault/anivault-store";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";
import type { OfflineDownloadItem } from "@/shared/offline-downloads-types";

import { downloadHlsVodToTs } from "@/main/ipc/offline-downloads/hls-offline-download";
import {
  extensionFromMime,
  isLikelyHlsUrl,
  isMpegUrlContentType,
  pickExtensionFromUrl,
  safeFileSegment,
} from "./offline-download-helpers";
import {
  getOfflineDownloadItems,
  patchOfflineDownloadItem,
} from "./offline-downloads-store";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0";

let processing = false;
/** Set while a file is actively streaming to disk (guards remove). */
export let currentDownloadingId: string | null = null;

function nextQueued(): OfflineDownloadItem | undefined {
  return getOfflineDownloadItems()
    .filter((i) => i.status === "queued")
    .sort((a, b) => a.queuedAt - b.queuedAt)[0];
}

function uniqueDestPath(dir: string, baseName: string, ext: string): string {
  let dest = path.join(dir, `${baseName}${ext}`);
  let n = 2;
  while (fs.existsSync(dest)) {
    dest = path.join(dir, `${baseName}_${n}${ext}`);
    n += 1;
  }
  return dest;
}

export function readOfflinePath(): string {
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- electron-store */
  const v: unknown = anivaultStore.get("offlineDownloadsPath" as keyof AnivaultStoreSchema);
  return typeof v === "string" ? v.trim() : "";
}

export function readOfflineEnabled(): boolean {
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- electron-store */
  const v: unknown = anivaultStore.get("offlineDownloadsEnabled" as keyof AnivaultStoreSchema);
  return v === true;
}

async function runOne(item: OfflineDownloadItem): Promise<void> {
  const baseDir = readOfflinePath();
  if (!baseDir) {
    patchOfflineDownloadItem(item.id, {
      status: "failed",
      error: "No download folder configured.",
    });
    return;
  }

  let remoteUrl: string;
  let referer: string;
  try {
    const r = await getStreamUrl(item.showId, item.episode, item.mode);
    remoteUrl = r.url;
    referer = r.referer;
  } catch (e) {
    patchOfflineDownloadItem(item.id, {
      status: "failed",
      error: e instanceof Error ? e.message : String(e),
    });
    return;
  }

  patchOfflineDownloadItem(item.id, { status: "downloading", error: undefined });
  currentDownloadingId = item.id;

  const extFromUrl = pickExtensionFromUrl(remoteUrl);
  let dest: string | null = null;

  try {
    const headers: Record<string, string> = {
      "User-Agent": USER_AGENT,
    };
    if (referer.trim().length > 0) {
      headers.Referer = referer;
    }

    if (isLikelyHlsUrl(remoteUrl)) {
      const base = `${safeFileSegment(item.showName, 80)}__${safeFileSegment(item.episode, 40)}__${item.mode}`;
      dest = uniqueDestPath(baseDir, base, ".ts");
      try {
        await downloadHlsVodToTs({
          playlistUrl: remoteUrl,
          headers,
          destPath: dest,
        });
        patchOfflineDownloadItem(item.id, {
          status: "complete",
          localPath: dest,
          bytesWritten: undefined,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        patchOfflineDownloadItem(item.id, { status: "failed", error: msg });
        if (dest && fs.existsSync(dest)) {
          try {
            fs.unlinkSync(dest);
          } catch {
            /* ignore */
          }
        }
      } finally {
        currentDownloadingId = null;
      }
      return;
    }

    const fetchRes = await fetch(remoteUrl, { headers });
    const ct = fetchRes.headers.get("content-type");
    if (!fetchRes.ok) {
      patchOfflineDownloadItem(item.id, {
        status: "failed",
        error: `HTTP ${fetchRes.status}`,
      });
      return;
    }
    if (isMpegUrlContentType(ct)) {
      patchOfflineDownloadItem(item.id, {
        status: "failed",
        error:
          "Server returned an HLS playlist, not a single file. Offline save needs a progressive URL.",
      });
      return;
    }

    const ext =
      extFromUrl ?? extensionFromMime(ct) ?? ".mp4";
    const base = `${safeFileSegment(item.showName, 80)}__${safeFileSegment(item.episode, 40)}__${item.mode}`;
    dest = uniqueDestPath(baseDir, base, ext);

    const body = fetchRes.body;
    if (!body) {
      patchOfflineDownloadItem(item.id, { status: "failed", error: "Empty response body." });
      return;
    }

    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    const ws = fs.createWriteStream(dest);
    const nodeStream = Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]);
    await pipeline(nodeStream, ws);

    patchOfflineDownloadItem(item.id, {
      status: "complete",
      localPath: dest,
      bytesWritten: undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    patchOfflineDownloadItem(item.id, { status: "failed", error: msg });
    if (dest) {
      try {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
      } catch {
        /* ignore */
      }
    }
  } finally {
    currentDownloadingId = null;
  }
}

export function scheduleOfflineDownloadProcessing(): void {
  void processQueue();
}

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    while (readOfflineEnabled()) {
      const item = nextQueued();
      if (!item) break;
      await runOne(item);
    }
  } finally {
    processing = false;
    if (readOfflineEnabled() && nextQueued()) {
      void processQueue();
    }
  }
}
