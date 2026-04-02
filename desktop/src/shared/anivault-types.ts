export type AnivaultPlan = "free" | "pro";

export type UiDensity = "comfortable" | "compact";

export type AnivaultStoreSchema = {
  apiBaseUrl: string;
  authToken: string;
  plan: AnivaultPlan;
  translationApiKey: string;
  translationProvider: "deepl" | "google" | "none";
  volumeDefault: number;
  prefetchNextEpisode: boolean;
  /** Sidebar and header spacing scale. */
  uiDensity: UiDensity;
  /** When true, use the browser video control strip; when false, custom chrome (watch page). */
  useNativeVideoControls: boolean;
  /** Arrow-key seek amount in seconds. */
  playerSeekStepSec: number;
  /** Initial playback rate when opening the player (1 = normal). */
  defaultPlaybackSpeed: number;
  /** After an episode ends, go to the next one automatically (with countdown). */
  autoPlayNextEpisode: boolean;
  /**
   * Custom animated cursor (extra CPU). Off by default for efficiency.
   */
  smoothCursor: boolean;
  /**
   * Subtle backdrop blur on titlebar, sidebar, and mini-player. Off by default.
   */
  shellVisualEffects: boolean;
};
