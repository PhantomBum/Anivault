import Store from "electron-store";

import type { AnivaultStoreSchema } from "@/shared/anivault-types";

export const anivaultDefaults: AnivaultStoreSchema = {
  apiBaseUrl: "http://127.0.0.1:3847",
  authToken: "",
  plan: "free",
  translationApiKey: "",
  translationProvider: "none",
  volumeDefault: 0.85,
  prefetchNextEpisode: true,
  uiDensity: "comfortable",
  useNativeVideoControls: true,
  playerSeekStepSec: 5,
  skipIntroSeconds: 90,
  defaultPlaybackSpeed: 1,
  autoPlayNextEpisode: true,
  smoothCursor: true,
  shellVisualEffects: true,
  chromaticEmphasis: "full",
  shellPreset: "midnight",
  allowMatureContent: false,
  telemetryOptIn: false,
  telemetryEndpoint: "",
  offlineDownloadsEnabled: false,
  offlineDownloadsPath: "",
  windowAlwaysOnTop: false,
};

export const anivaultStore = new Store<AnivaultStoreSchema>({
  name: "anivault-config",
  defaults: anivaultDefaults,
});

export type { AnivaultStoreSchema };
