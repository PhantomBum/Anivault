export type WatchProgressRecord = {
  positionSec: number;
  durationSec: number;
  updatedAt: number;
};

/** One row per series for “Continue watching” (most recently updated episode). */
export type WatchProgressContinueItem = {
  animeId: string;
  episode: string;
  mode: "sub" | "dub";
  positionSec: number;
  durationSec: number;
  updatedAt: number;
};
