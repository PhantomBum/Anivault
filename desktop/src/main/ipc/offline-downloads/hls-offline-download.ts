import fs from "node:fs";
import path from "node:path";

import {
  MAX_HLS_SEGMENTS,
  parseMediaPlaylist,
  pickFirstVariantUrl,
} from "@/main/ipc/offline-downloads/hls-offline-concat";

export async function downloadHlsVodToTs(options: {
  playlistUrl: string;
  headers: Record<string, string>;
  destPath: string;
}): Promise<void> {
  const { playlistUrl, headers, destPath } = options;

  const first = await fetch(playlistUrl, { headers });
  if (!first.ok) {
    throw new Error(`Playlist HTTP ${first.status}`);
  }
  let playlistText = await first.text();
  let mediaBase = playlistUrl;

  const variantUrl = pickFirstVariantUrl(playlistText, playlistUrl);
  if (variantUrl) {
    mediaBase = variantUrl;
    const second = await fetch(variantUrl, { headers });
    if (!second.ok) {
      throw new Error(`Variant playlist HTTP ${second.status}`);
    }
    playlistText = await second.text();
  }

  const { segmentUrls, encrypted } = parseMediaPlaylist(playlistText, mediaBase);
  if (encrypted) {
    throw new Error(
      "This HLS stream uses encryption. Concat-only offline save does not support AES yet."
    );
  }
  if (segmentUrls.length === 0) {
    throw new Error("No segments in HLS playlist.");
  }

  const take = segmentUrls.slice(0, MAX_HLS_SEGMENTS);
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  await fs.promises.writeFile(destPath, Buffer.alloc(0));

  for (let i = 0; i < take.length; i++) {
    const segRes = await fetch(take[i], { headers });
    if (!segRes.ok) {
      throw new Error(`Segment ${i + 1} HTTP ${segRes.status}`);
    }
    const buf = Buffer.from(await segRes.arrayBuffer());
    await fs.promises.appendFile(destPath, buf);
  }
}
