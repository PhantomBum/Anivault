/** Save a video frame or short screen recording from the Watch `<video>` element. */

/**
 * PNG data URL of the current frame, or null if the canvas is tainted / not ready.
 * Used for gallery upload without a separate file round-trip.
 */
export function getVideoFrameDataUrlPng(video: HTMLVideoElement): string | null {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  try {
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 2500);
  }
}

export async function saveVideoFrameAsPng(
  video: HTMLVideoElement,
  baseName: string
): Promise<{ ok: true } | { ok: false; reason: "no-dimensions" | "tainted" | "no-blob" }> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return { ok: false, reason: "no-dimensions" };

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { ok: false, reason: "no-blob" };

  try {
    ctx.drawImage(video, 0, 0);
  } catch {
    return { ok: false, reason: "tainted" };
  }

  return await new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve({ ok: false, reason: "tainted" });
          return;
        }
        const safe = baseName.replace(/[^\w-]+/g, "_").slice(0, 80) || "frame";
        downloadBlob(blob, `${safe}-${Date.now()}.png`);
        resolve({ ok: true });
      },
      "image/png",
      0.92
    );
  });
}

function pickRecorderMime(): string | null {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return null;
}

/**
 * Records from `video.captureStream()` for `durationMs`. Saves a `.webm` via download.
 */
export async function recordVideoClipFromElement(
  video: HTMLVideoElement,
  durationMs: number
): Promise<{ ok: true } | { ok: false; reason: "unsupported" | "empty" | "error"; detail?: string }> {
  if (typeof MediaRecorder === "undefined") {
    return { ok: false, reason: "unsupported" };
  }
  const mimeType = pickRecorderMime();
  if (!mimeType) return { ok: false, reason: "unsupported" };

  let stream: MediaStream;
  try {
    const withCapture = video as HTMLVideoElement & { captureStream?: () => MediaStream };
    if (typeof withCapture.captureStream !== "function") {
      return { ok: false, reason: "unsupported" };
    }
    stream = withCapture.captureStream();
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      detail: e instanceof Error ? e.message : String(e),
    };
  }

  const chunks: Blob[] = [];
  let rec: MediaRecorder;
  try {
    rec = new MediaRecorder(stream, { mimeType });
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      detail: e instanceof Error ? e.message : String(e),
    };
  }

  rec.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return await new Promise((resolve) => {
    rec.onerror = () => resolve({ ok: false, reason: "error", detail: "MediaRecorder error" });
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      if (blob.size < 32) {
        resolve({ ok: false, reason: "empty" });
        return;
      }
      downloadBlob(blob, `anivault-clip-${Date.now()}.webm`);
      resolve({ ok: true });
    };

    try {
      rec.start(250);
    } catch (e) {
      resolve({
        ok: false,
        reason: "error",
        detail: e instanceof Error ? e.message : String(e),
      });
      return;
    }

    window.setTimeout(() => {
      try {
        if (rec.state === "recording") {
          rec.requestData?.();
          rec.stop();
        }
      } catch {
        resolve({ ok: false, reason: "error" });
      }
    }, durationMs);
  });
}
