import { MakerDeb } from "@electron-forge/maker-deb";

import { MakerRpm } from "@electron-forge/maker-rpm";

import { MakerZIP } from "@electron-forge/maker-zip";

import { MakerSquirrel } from "@electron-forge/maker-squirrel";

import { FusesPlugin } from "@electron-forge/plugin-fuses";

import { VitePlugin } from "@electron-forge/plugin-vite";

import type { ForgeConfig } from "@electron-forge/shared-types";

import { FuseV1Options, FuseVersion } from "@electron/fuses";

import path from "node:path";

import { forgePostMakeLatestYml } from "./scripts/forge-post-make-latest-yml";

import { resolveGithubRepoForPublish } from "./scripts/github-repo";

import pkg from "./package.json";

const gh = resolveGithubRepoForPublish();

/** Forge runs with `cwd` = `desktop/` (where this file lives). */
const desktopRoot = process.cwd();

const config: ForgeConfig = {

  hooks: {

    /** Squirrel ships `*-full.nupkg` without `latest.yml`; hook writes one next to the nupkg for electron-updater. */

    postMake: forgePostMakeLatestYml,

  },

  packagerConfig: {

    asar: true,

    icon: "./public/icon-rounded",

    executableName: "anivault-unvaulted",

    win32metadata: {

      CompanyName: "AniVault Unvaulted",

      FileDescription: "AniVault Unvaulted",

      OriginalFilename: "anivault-unvaulted.exe",

      ProductName: "AniVault Unvaulted",

      InternalName: "anivault-unvaulted",

    },

  },

  rebuildConfig: {},

  makers: [

    new MakerSquirrel({
      /** NuGet package ID: no spaces (Squirrel/nuget_pack rejects `AniVault Unvaulted`). Display name stays in package.json `productName`. */
      name: "AniVaultUnvaulted",
      setupExe: "AniVaultUnvaultedSetup.exe",
      /** Setup.exe + Add/Remove Programs branding (must be `.ico`). */
      setupIcon: path.join(desktopRoot, "public", "icon-rounded.ico"),
      /** Splash during install (`npm run installer:assets` regenerates from `public/icon-rounded.png`). */
      loadingGif: path.join(desktopRoot, "installer", "installing.gif"),
      authors: typeof pkg.author === "string" ? pkg.author : "AniVault Unvaulted",
      description: pkg.description,
      title: pkg.productName,
      /** MSI is rarely needed for desktop apps; Squirrel Setup.exe is the primary path. */
      noMsi: true,
    }),

    // Zip only for macOS; Windows uses Squirrel (AniVaultUnvaultedSetup.exe).
    new MakerZIP({}, ["darwin"]),

    new MakerRpm({}),

    new MakerDeb({}),

  ],

  plugins: [

    new VitePlugin({

      build: [

        {

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

        draft: false,

        prerelease: false,

        force: process.env.GITHUB_PUBLISH_FORCE === "1",

      },

    },

  ],

};



export default config;

