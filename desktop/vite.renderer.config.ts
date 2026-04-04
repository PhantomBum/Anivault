import react from "@vitejs/plugin-react";
import path from "path";
import type { ConfigEnv, Plugin, UserConfig } from "vite";
import { defineConfig } from "vite";

import { pluginExposeRenderer } from "./vite.base.config";

/**
 * Vite injects `crossorigin` on script/link tags. Loading the renderer via
 * `file://` (Electron `loadFile`) treats those as CORS fetches and module/CSS
 * loads can fail silently — window stays dark with no React mount.
 */
function stripCrossoriginForElectronFileProtocol(): Plugin {
  return {
    name: "strip-crossorigin-electron-renderer",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html.replace(/\s+crossorigin(?:="(?:anonymous|use-credentials)")?/gi, "");
      },
    },
  };
}

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<"renderer">;
  const { root, mode, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? "";

  return {
    root,
    mode,
    base: "./",
    build: {
      outDir: `.vite/renderer/${name}`,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return;
            if (id.includes("react-router")) return "vendor-router";
            if (id.includes("i18next")) return "vendor-i18n";
            if (id.includes("react-dom") || id.includes("/react/") || id.includes("\\react\\")) {
              return "vendor-react";
            }
          },
        },
      },
    },
    plugins: [pluginExposeRenderer(name), react(), stripCrossoriginForElectronFileProtocol()],
    resolve: {
      preserveSymlinks: true,
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    clearScreen: false,
  } as UserConfig;
});
