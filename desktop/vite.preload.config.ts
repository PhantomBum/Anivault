import type { ConfigEnv, UserConfig } from "vite";
import { defineConfig, mergeConfig } from "vite";

import { builtins, getBuildConfig, pluginHotRestart } from "./vite.base.config";

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<"build">;
  const { forgeConfigSelf } = forgeEnv;
  const config: UserConfig = {
    build: {
      rolldownOptions: {
        external: builtins,
        // Preload scripts may contain Web assets, so use `build.rolldownOptions.input` instead of `build.lib.entry`.
        input: forgeConfigSelf.entry,
        output: {
          format: "cjs",
          // Single bundle for preload (Vite 8 / Rolldown: use codeSplitting instead of inlineDynamicImports).
          codeSplitting: false,
          entryFileNames: "[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
        },
      },
    },
    plugins: [pluginHotRestart("reload")],
  };

  return mergeConfig(getBuildConfig(forgeEnv), config);
});
