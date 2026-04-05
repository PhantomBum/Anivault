export type WatchProgressRecord = {
  positionSec: number;
  durationSec: number;
  updatedAt: number;
};

/** One row per series for "Continue watching" (most recently updated episode). */
export type WatchProgressContinueItem = {
  animeId: string;
  episode: string;
  mode: "sub" | "dub";
  positionSec: number;
  durationSec: number;
  updatedAt: number;
};

/** Snapshot format for progress data export/import. */
export type WatchProgressExport = {
  version: 1;
  exportedAt: string;
  entries: WatchProgressExportEntry[];
};

export type WatchProgressExportEntry = {
  animeId: string;
  episode: string;
  mode: "sub" | "dub";
  positionSec: number;
  durationSec: number;
  updatedAt: number;
};

/** Summary stats for the progress store. */
export type WatchProgressStatsResult = {
  trackedEpisodes: number;
  trackedSeries: number;
  totalWatchedSec: number;
};
