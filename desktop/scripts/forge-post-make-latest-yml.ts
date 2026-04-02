/**
 * electron-updater's GitHub provider expects a channel file (e.g. `latest.yml`) on the release.
 * Electron Forge + Squirrel ships `RELEASES` + `*.nupkg` but not `latest.yml` (electron-builder does).
 * This hook writes a minimal `latest.yml` next to each `*-full.nupkg` so `npm run publish` uploads it.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import type { ForgeMakeResult, ResolvedForgeConfig } from "@electron-forge/shared-types";

import pkg from "../package.json";

function sha512Base64(buf: Buffer): string {
  return createHash("sha512").update(buf).digest("base64");
}

export function forgePostMakeLatestYml(
  _config: ResolvedForgeConfig,
  makeResults: ForgeMakeResult[]
): Promise<void> {
  const version = String(pkg.version ?? "0.0.0");
  for (const result of makeResults) {
    for (const file of result.artifacts) {
      if (!file.includes("full.nupkg") || !file.endsWith(".nupkg")) continue;
      const buf = readFileSync(file);
      const hash = sha512Base64(buf);
      const nupkgName = basename(file);
      const dir = dirname(file);
      const releaseDate = new Date().toISOString();
      const yml = [
        `version: ${version}`,
        `files:`,
        `  - url: ${nupkgName}`,
        `    sha512: ${hash}`,
        `    size: ${buf.length}`,
        `path: ${nupkgName}`,
        `sha512: ${hash}`,
        `releaseDate: '${releaseDate}'`,
        "",
      ].join("\n");
      const out = join(dir, "latest.yml");
      writeFileSync(out, yml, "utf8");
      // eslint-disable-next-line no-console
      console.info(`[forge-post-make] wrote ${out} for ${nupkgName}`);
    }
  }
  return Promise.resolve();
}
