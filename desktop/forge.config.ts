import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

import { forgePostMakeLatestYml } from "./scripts/forge-post-make-latest-yml";
import { resolveGithubRepoForPublish } from "./scripts/github-repo";

const gh = resolveGithubRepoForPublish();

const config: ForgeConfig = {
  hooks: {
    postMake: forgePostMakeLatestYml,
  },
  packagerConfig: {
    asar: true,
    icon: "./public/icon-rounded",
    // Must match `package.json` `name` — MakerDeb looks up the binary by that name.
    executableName: "anivault",
    win32metadata: {
      CompanyName: "AniVault",
      FileDescription: "AniVault",
      OriginalFilename: "anivault.exe",
      ProductName: "AniVault",
      InternalName: "anivault",
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: "AniVault",
      setupExe: "AniVaultSetup.exe",
    }),
    // Zip only for macOS; Windows uses Squirrel (AniVaultSetup.exe) — avoids a second huge artifact on Windows builds.
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/main/main.ts",
          config: "vite.main.config.ts",
        },
        {
          entry: "src/main/preload.ts",
          config: "vite.preload.config.ts",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: gh.owner,
          name: gh.name,
        },
        /** Default is draft; drafts are hidden from public Releases until published. */
        draft: false,
        prerelease: true,
        /** Re-upload assets if a previous run failed after creating the release (set GITHUB_PUBLISH_FORCE=1 in CI). */
        force: process.env.GITHUB_PUBLISH_FORCE === "1",
      },
    },
  ],
};

export default config;
