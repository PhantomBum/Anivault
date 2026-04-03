import type { AnivaultStoreSchema as AnivaultStoreSchemaShared } from "./anivault-types";
import type {
  OfflineDownloadAddPayload,
  OfflineDownloadAddResult,
  OfflineDownloadItem,
} from "./offline-downloads-types";
import type { WatchProgressContinueItem, WatchProgressRecord } from "./watch-progress-types";
import { AppUpdateCheckResult } from "./app-update-types";

interface ThemeContext {
  toggle: () => Promise<boolean>;
  dark: () => Promise<void>;
  light: () => Promise<void>;
  system: () => Promise<boolean>;
  current: () => Promise<"dark" | "light" | "system">;
}

interface AnimeSearchResult {
  id: string;
  name: string;
  episodeCount: number;
  mode: "sub" | "dub";
  hasSub?: boolean;
  hasDub?: boolean;
}

interface StreamUrlResult {
  url: string;
  referer: string;
}

interface ShowDetails {
  id: string;
  name: string;
  thumbnail: string | null;
  type: string;
  description?: string | null;
}

interface AnivaultContext {
  getConfig: <K extends keyof AnivaultStoreSchemaShared>(key: K) => Promise<AnivaultStoreSchemaShared[K]>;
  getAllConfig: () => Promise<AnivaultStoreSchemaShared>;
  setConfig: (partial: Partial<AnivaultStoreSchemaShared>) => Promise<boolean>;
}

interface WatchProgressContext {
  save: (
    animeId: string,
    episode: string,
    mode: "sub" | "dub",
    positionSec: number,
    durationSec: number
  ) => Promise<void>;
  get: (
    animeId: string,
    episode: string,
    mode: "sub" | "dub"
  ) => Promise<WatchProgressRecord | null>;
  clearSeries: (animeId: string) => Promise<void>;
  stats: () => Promise<{ trackedEpisodes: number }>;
  listContinue: (limit?: number) => Promise<WatchProgressContinueItem[]>;
}

interface AppContext {
  version: () => Promise<string>;
  os: () => Promise<string>;
  /** True when required system dependencies are missing (e.g. Git Bash on Windows). */
  dependenciesRequired: () => Promise<boolean>;
  checkForUpdate: () => Promise<AppUpdateCheckResult>;
  /** Squirrel/GitHub auto-update: restart after download (packaged builds only). */
  quitAndInstall: () => Promise<boolean>;
  checkElectronUpdates: () => Promise<
    | { kind: "skipped"; reason: string }
    | {
        kind: "ok";
        /** Latest version reported by the updater feed (may match current). */
        version: string | null;
        currentVersion: string;
        isUpdateAvailable: boolean;
      }
    | { kind: "error"; message: string }
  >;
  onUpdateDownloaded: (cb: () => void) => () => void;
  /** Native folder picker for offline downloads path. */
  pickDownloadsFolder: () => Promise<string | null>;
}

interface SecurityContext {
  getStatus: () => Promise<{ enabled: boolean; hasPasscode: boolean }>;
  unlock: (code: string) => Promise<boolean>;
  setGate: (payload: {
    enabled: boolean;
    newCode: string;
    currentCode?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export interface UrlOpenerContext {
  openUrl: (url: string) => Promise<void>;
}

interface AniCliContext {
  search: (query: string) => Promise<AnimeSearchResult[]>;
  getEpisodes: (showId: string, mode?: "sub" | "dub") => Promise<string[]>;
  getStreamUrl: (showId: string, episode: string, mode?: "sub" | "dub") => Promise<StreamUrlResult>;
  getStreamProxyBaseUrl: () => Promise<string>;
  getShowDetails: (showId: string) => Promise<ShowDetails>;
  getRecent: (
    page: number,
    limit?: number
  ) => Promise<{
    items: AnimeSearchResult[];
    hasMore: boolean;
  }>;
}

interface OfflineDownloadsContext {
  list: () => Promise<OfflineDownloadItem[]>;
  add: (payload: OfflineDownloadAddPayload) => Promise<OfflineDownloadAddResult>;
  remove: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  clearCompleted: () => Promise<void>;
  retry: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  reveal: (localPath: string) => Promise<boolean>;
}

declare global {
  interface Window {
    app: AppContext;
    security: SecurityContext;
    theme: ThemeContext;
    aniCli: AniCliContext;
    urlOpener: UrlOpenerContext;
    anivault: AnivaultContext;
    watchProgress: WatchProgressContext;
    offlineDownloads: OfflineDownloadsContext;
  }
}
