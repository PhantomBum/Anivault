import { MakerDeb } from "@electron-forge/maker-deb";

import { MakerRpm } from "@electron-forge/maker-rpm";

import { MakerZIP } from "@electron-forge/maker-zip";

import { MakerSquirrel } from "@electron-forge/maker-squirrel";

import { FusesPlugin } from "@electron-forge/plugin-fuses";

import { VitePlugin } from "@electron-forge/plugin-vite";

import type { ForgeConfig } from "@electron-forge/shared-types";

import { FuseV1Options, FuseVersion } from "@electron/fuses";

import { forgePostMakeLatestYml } from "./scripts/forge-post-make-latest-yml";

import { resolveGithubRepoForPublish } from "./scripts/github-repo";

const gh = resolveGithubRepoForPublish();

const config: ForgeConfig = {

  hooks: {

    /** Squirrel ships `*-full.nupkg` without `latest.yml`; hook writes one next to the nupkg for electron-updater. */

    postMake: forgePostMakeLatestYml,

  },

  packagerConfig: {

    asar: true,

    icon: "./public/icon-rounded",

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

    // Zip only for macOS; Windows uses Squirrel (AniVaultSetup.exe).
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

        prerelease: true,

        force: process.env.GITHUB_PUBLISH_FORCE === "1",

      },

    },

  ],

};



export default config;

