/**
 * Legacy hook: Squirrel produced `*-full.nupkg` without `latest.yml`; this wrote one next to the nupkg.
 * Windows now uses NSIS (`@felixrieseberg/electron-forge-maker-nsis`), which emits `latest.yml` itself.
 * This hook stays as a no-op unless a future target ships nupkg again.
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
      // Publisher only uploads paths listed in `artifacts`; without this, latest.yml never reaches GitHub Releases.
      if (!result.artifacts.includes(out)) {
        result.artifacts.push(out);
      }
      // eslint-disable-next-line no-console
      console.info(`[forge-post-make] wrote ${out} for ${nupkgName}`);
    }
  }
  return Promise.resolve();
}
