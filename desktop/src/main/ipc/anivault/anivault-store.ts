import Store from "electron-store";

import type { AnivaultStoreSchema } from "@/shared/anivault-types";

const defaults: AnivaultStoreSchema = {
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
  defaultPlaybackSpeed: 1,
  autoPlayNextEpisode: true,
};

export const anivaultStore = new Store<AnivaultStoreSchema>({
  name: "anivault-config",
  defaults,
});

export type { AnivaultStoreSchema };
