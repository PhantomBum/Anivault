/** Companion API base URL used when Settings → Server is empty or invalid. */
export const DEFAULT_COMPANION_API_BASE_URL = "http://127.0.0.1:3847";

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
  /**
   * Seconds to jump when using “Skip intro” on the watch page (no provider metadata; user-tuned).
   * Typical opening length is ~90s.
   */
  skipIntroSeconds: number;
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
  /** Strip color from thumbnails/cards (not video). */
  chromaticEmphasis: "full" | "mono";
  /** Background + contrast preset (dark/light still from system theme). */
  shellPreset: "midnight" | "charcoal" | "slate" | "paper" | "ember" | "ocean";
  /**
   * When false, mature-tagged series are hidden from grids and details show a warning until enabled.
   */
  allowMatureContent: boolean;
  /**
   * When true, the app may record anonymous performance-related events (no video URLs or credentials).
   * Off by default; no network endpoint is required in this build.
   */
  telemetryOptIn: boolean;
  /**
   * Optional HTTPS URL to receive anonymous JSON telemetry batches when telemetry opt-in is on.
   * Empty disables network upload (dev console logging may still apply).
   */
  telemetryEndpoint: string;
  /**
   * Experimental: user acknowledged disclaimer; enables the offline queue (Settings → Data).
   */
  offlineDownloadsEnabled: boolean;
  /** Target directory for offline downloads (empty until chosen). */
  offlineDownloadsPath: string;
  /**
   * When true, the main app window stays above other windows (Windows/macOS/Linux).
   * Useful while watching in the mini player; turn off to return to normal stacking.
   */
  windowAlwaysOnTop: boolean;
};
