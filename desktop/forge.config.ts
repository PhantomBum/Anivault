import { MakerDeb } from "@electron-forge/maker-deb";

import { MakerRpm } from "@electron-forge/maker-rpm";

import { MakerZIP } from "@electron-forge/maker-zip";

import { FusesPlugin } from "@electron-forge/plugin-fuses";

import { VitePlugin } from "@electron-forge/plugin-vite";

import type { ForgeConfig } from "@electron-forge/shared-types";

import { FuseV1Options, FuseVersion } from "@electron/fuses";

import path from "node:path";

import { forgePostMakeLatestYml } from "./scripts/forge-post-make-latest-yml";

import { resolveGithubRepoForPublish } from "./scripts/github-repo";

const gh = resolveGithubRepoForPublish();

/** Generic updater base; electron-updater also uses `setFeedURL({ provider: "github" })` at runtime. */

const releaseDownloadBase = `https://github.com/${gh.owner}/${gh.name}/releases/latest/download`;

/** `npm run make` / Forge use `desktop/` as cwd. */

const windowsIconIco = path.resolve(process.cwd(), "public", "icon-rounded.ico");



const config: ForgeConfig = {

  hooks: {

    /** Legacy: Squirrel nupkg hook (no-op with NSIS). NSIS maker emits `latest.yml` via electron-updater-yaml. */

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

    {

      name: "@felixrieseberg/electron-forge-maker-nsis",

      config: {

        updater: {

          url: releaseDownloadBase,

          channel: "latest",

          updaterCacheDirName: "anivault-updater",

        },

        getAppBuilderConfig: async () => ({

          appId: "com.anivault.desktop",

          productName: "AniVault",

          // ASCII-only: special chars in NSIS scripts have broken some CI runners
          copyright: "Copyright (c) AniVault",

          executableName: "anivault",

          win: {

            icon: windowsIconIco,

            artifactName: "AniVaultSetup.${ext}",

            executableName: "anivault",

          },

          nsis: {

            // Must be explicit booleans: app-builder treats omitted oneClick as true (one-click installer).
            oneClick: false,

            allowToChangeInstallationDirectory: true,

            allowElevation: true,

            // false = show "install for current user vs all users", then (with allowToChange…) folder page.
            perMachine: false,

            selectPerMachineByDefault: false,

            installerLanguages: ["en_US"],

            multiLanguageInstaller: false,

            installerIcon: windowsIconIco,

            uninstallerIcon: windowsIconIco,

            installerHeaderIcon: windowsIconIco,

            createDesktopShortcut: true,

            createStartMenuShortcut: true,

            shortcutName: "AniVault",

          },

        }),

      },

    },

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

