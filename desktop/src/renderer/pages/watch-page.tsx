import {
  ArrowLeft,
  Camera,
  ChevronDown,
  Copy,
  Download,
  Image as ImageIcon,
  ImagePlus,
  Link2,
  ListOrdered,
  MessageCircle,
  SkipForward,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { WatchPlayerStage } from "@/renderer/components/player/watch-player-stage";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/renderer/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/renderer/components/ui/dropdown-menu";
import { useNowPlaying } from "@/renderer/context/now-playing-context";
import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { useWatchKeyboard } from "@/renderer/hooks/use-watch-keyboard";
import {
  getShowComments,
  getShowEngagement,
  postGalleryUpload,
  postShowComment,
  postShowLike,
  type ShowCommentRow,
  type ShowEngagementResponse,
} from "@/renderer/lib/anivault-api";
import { type ShowDetails, getAniCli } from "@/renderer/lib/ani-cli-bridge";
import { cachedGetEpisodes, cachedGetShowDetails } from "@/renderer/lib/ani-session-cache";
import { showToast } from "@/renderer/lib/av-toast";
import { describeMediaErrorSuffix } from "@/renderer/lib/media-error";
import { isPlaybackUrlCopySafe } from "@/renderer/lib/playback-url-clipboard";
import { cn } from "@/renderer/lib/utils";
import { sortEpisodeLabels } from "@/renderer/lib/episode-sort";
import { getRecentlyWatched } from "@/renderer/lib/recently-watched-bridge";
import {
  getVideoFrameDataUrlPng,
  recordVideoClipFromElement,
  saveVideoFrameAsPng,
} from "@/renderer/lib/watch-capture";
import type { OfflineDownloadAddResult } from "@/shared/offline-downloads-types";

/** How many automatic reconnects after a playback error before showing the manual overlay. */
const MAX_AUTO_RECONNECT = 5;

/** Show search when episode count exceeds this (Nexus-style dense grid). */
const EPISODE_FILTER_THRESHOLD = 8;

const EpisodePillGrid = memo(function EpisodePillGrid({
  episodes,
  currentEpisode,
  loadingEpisode,
  onSelect,
}: {
  episodes: string[];
  currentEpisode: string;
  loadingEpisode: boolean;
  onSelect: (ep: string) => void;
}) {
  if (episodes.length === 0) {
    return <p className="text-sm text-zinc-500">No matches.</p>;
  }
  return (
    <div className="av-poster-grid grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
      {episodes.map((ep) => {
        const active = ep === currentEpisode;
        return (
          <button
            key={ep}
            type="button"
            onClick={() => onSelect(ep)}
            disabled={loadingEpisode}
            title={ep}
            className={cn(
              "min-h-[2.5rem] rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors",
              active
                ? "border-white/30 bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
                : "border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:bg-white/[0.07] hover:text-zinc-200"
            )}
          >
            <span className="line-clamp-2 break-words">{ep}</span>
          </button>
        );
      })}
    </div>
  );
});

interface WatchState {
  anime: { id: string; name: string; mode: "sub" | "dub" };
  episodes: string[];
  currentEpisode: string;
  /** When true, open on the latest episode (e.g. from recently uploaded tile) */
  preferLatest?: boolean;
}

export function WatchPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = location.state as WatchState | null;
  const hydratedFromQueryRef = useRef(false);

  const [playUrl, setPlayUrl] = useState<string>("");
  /** Bumps when a new stream URL is ready so the <video> remounts (retry after errors). */
  const [streamRevision, setStreamRevision] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [details, setDetails] = useState<ShowDetails | null>(null);
  const [, setLoading] = useState(true);
  const [loadingEpisode, setLoadingEpisode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Shown while automatic stream reconnect runs (after media errors). */
  const [reconnectNotice, setReconnectNotice] = useState<string | null>(null);
  const anime = state?.anime;
  const [episodes, setEpisodes] = useState<string[]>(() => state?.episodes ?? []);
  const initialEpisode = state?.currentEpisode ?? episodes[0] ?? "";

  const [currentEpisode, setCurrentEpisode] = useState<string>(initialEpisode);

  const watchHydrationQueryKey = useMemo(() => {
    const id = searchParams.get("id");
    const mode = searchParams.get("mode");
    const ep = searchParams.get("ep");
    return `${id ?? ""}\u0001${mode ?? ""}\u0001${ep ?? ""}`;
  }, [searchParams.toString()]);

  useEffect(() => {
    if (state?.anime) return;
    if (hydratedFromQueryRef.current) return;
    const id = searchParams.get("id");
    const mode = searchParams.get("mode");
    const ep = searchParams.get("ep") ?? "";
    if (!id || (mode !== "sub" && mode !== "dub")) return;
    hydratedFromQueryRef.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const details = await cachedGetShowDetails(id, () => getAniCli().getShowDetails(id));
        if (cancelled) return;
        const name = details?.name ?? id;
        const eps = await cachedGetEpisodes(id, mode, () => getAniCli().getEpisodes(id, mode));
        if (cancelled || eps.length === 0) {
          hydratedFromQueryRef.current = false;
          return;
        }
        const nextEp = ep && eps.includes(ep) ? ep : eps[0];
        navigate("/watch", {
          replace: true,
          state: {
            anime: { id, name, mode },
            episodes: eps,
            currentEpisode: nextEp,
          },
        });
      } catch (e) {
        hydratedFromQueryRef.current = false;
        setError(e instanceof Error ? e.message : "Could not open from link");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state?.anime, watchHydrationQueryKey, navigate]);

  useEffect(() => {
    const s = location.state as WatchState | null;
    if (!s?.anime) return;
    setEpisodes(s.episodes ?? []);
    setCurrentEpisode(s.currentEpisode ?? s.episodes?.[0] ?? "");
  }, [location.state]);

  const [episodeFilter, setEpisodeFilter] = useState("");
  const [engagement, setEngagement] = useState<ShowEngagementResponse | null>(null);
  const [comments, setComments] = useState<ShowCommentRow[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [socialErr, setSocialErr] = useState<string | null>(null);
  const [localDislikes, setLocalDislikes] = useState(0);

  const [useNativeVideoControls, setUseNativeVideoControls] = useState(true);
  const [playerSeekStepSec, setPlayerSeekStepSec] = useState(5);
  const [skipIntroSeconds, setSkipIntroSeconds] = useState(90);
  const [defaultPlaybackSpeed, setDefaultPlaybackSpeed] = useState(1);
  const [upNext, setUpNext] = useState<{ episode: string; sec: number } | null>(null);
  const [offlineQueueReady, setOfflineQueueReady] = useState(false);
  const [clipRecording, setClipRecording] = useState(false);
  const [clipDurationMs, setClipDurationMs] = useState(10_000);

  const autoPlayNextRef = useRef(true);
  const lastProgressSaveRef = useRef(0);

  useEffect(() => {
    if (!window.anivault) return;
    void window.anivault.getAllConfig().then((c) => {
      setUseNativeVideoControls(c.useNativeVideoControls);
      setPlayerSeekStepSec(c.playerSeekStepSec);
      setSkipIntroSeconds(
        typeof c.skipIntroSeconds === "number" && !Number.isNaN(c.skipIntroSeconds)
          ? Math.min(300, Math.max(15, c.skipIntroSeconds))
          : 90
      );
      setDefaultPlaybackSpeed(c.defaultPlaybackSpeed);
      autoPlayNextRef.current = c.autoPlayNextEpisode;
      setOfflineQueueReady(
        Boolean(c.offlineDownloadsEnabled && (c.offlineDownloadsPath ?? "").trim().length > 0)
      );
    });
  }, []);

  const sortedEpisodes = useMemo(() => sortEpisodeLabels(episodes), [episodes]);

  const filteredEpisodes = useMemo(() => {
    const q = episodeFilter.trim().toLowerCase();
    if (!q) return sortedEpisodes;
    return sortedEpisodes.filter((ep) => ep.toLowerCase().includes(q));
  }, [sortedEpisodes, episodeFilter]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerSectionRef = useRef<HTMLDivElement | null>(null);
  const { setSession: setNowPlayingSession } = useNowPlaying();
  /** Snapshot for unmount — keep mini-player when browsing other routes. */
  const miniSnapshotRef = useRef<{
    playUrl: string;
    anime: WatchState["anime"];
    episodes: string[];
    currentEpisode: string;
    details: ShowDetails | null;
  } | null>(null);
  /** Seconds to seek to after the next successful load (set before reload). */
  const resumeAfterLoadRef = useRef<number | null>(null);
  /** Last known position when playback failed (for manual retry after overlay). */
  const lastPlaybackTimeRef = useRef<number | null>(null);
  const autoReconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current != null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const loadStream = useCallback(
    async (ep: string, opts?: { resumeFrom?: number | null }) => {
      if (!anime?.id || !ep) return;
      clearReconnectTimeout();
      if (opts?.resumeFrom != null && opts.resumeFrom > 0) {
        resumeAfterLoadRef.current = opts.resumeFrom;
      } else {
        resumeAfterLoadRef.current = null;
        if (window.watchProgress) {
          try {
            const p = await window.watchProgress.get(anime.id, ep, anime.mode);
            if (p && p.durationSec > 30 && p.positionSec >= 12) {
              const ratio = p.positionSec / p.durationSec;
              if (ratio < 0.92) {
                resumeAfterLoadRef.current = p.positionSec;
              }
            }
          } catch {
            /* ignore */
          }
        }
      }
      setLoadingEpisode(true);
      setError(null);
      setPlaybackError(null);
      setReconnectNotice(null);
      try {
        const aniCli = getAniCli();
        const { url, referer } = await aniCli.getStreamUrl(anime.id, ep, anime.mode);
        const base = await aniCli.getStreamProxyBaseUrl();
        const urlWithProxy = `${base}/stream?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`;
        setPlayUrl(urlWithProxy);
        setStreamRevision((r) => r + 1);
        setCurrentEpisode(ep);
        try {
          await getRecentlyWatched().record(anime.id, ep, anime.mode, anime.name);
        } catch {
          // Ignore - recording is best-effort
        }
      } catch (err) {
        setReconnectNotice(null);
        const msg = err instanceof Error ? err.message : "Failed to load stream";
        setError(
          /network|fetch|timeout|ECONNREFUSED/i.test(msg)
            ? `${msg} — check your connection or try again.`
            : msg
        );
      } finally {
        setLoadingEpisode(false);
      }
    },
    [anime, clearReconnectTimeout]
  );

  useEffect(() => {
    return () => {
      clearReconnectTimeout();
    };
  }, [clearReconnectTimeout]);

  useEffect(() => {
    if (!state?.anime) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const aniCli = getAniCli();
    const initialEpisodes = state.episodes ?? [];
    void Promise.all([
      cachedGetShowDetails(state.anime.id, () => aniCli.getShowDetails(state.anime.id)),
      initialEpisodes.length === 0
        ? cachedGetEpisodes(state.anime.id, state.anime.mode, () =>
            aniCli.getEpisodes(state.anime.id, state.anime.mode)
          )
        : Promise.resolve(initialEpisodes),
    ])
      .then(async ([d, epList]) => {
        if (cancelled) return;
        setDetails(d);

        let episodesToUse = initialEpisodes;
        if (initialEpisodes.length === 0 && Array.isArray(epList)) {
          episodesToUse = epList;
          setEpisodes(epList);
        }

        const fallbackEpisode = episodesToUse[0] ?? "";
        const preferredEpisode =
          state.preferLatest && episodesToUse.length > 0
            ? episodesToUse[episodesToUse.length - 1]
            : state.currentEpisode || fallbackEpisode;

        if (!preferredEpisode) return;
        setCurrentEpisode(preferredEpisode);
        await loadStream(preferredEpisode);
      })
      .catch(() => {
        if (!cancelled)
          setDetails({ id: state.anime.id, name: state.anime.name, thumbnail: null, type: "TV" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    state?.anime?.id,
    state?.anime?.name,
    state?.anime?.mode,
    state?.episodes,
    state?.currentEpisode,
    state?.preferLatest,
    loadStream,
  ]);

  const onEpisodeSelect = useCallback(
    (ep: string) => {
      setCurrentEpisode(ep);
      void loadStream(ep);
      setEpisodeFilter("");
    },
    [loadStream]
  );

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const v = e.currentTarget;
      if (!anime || !window.watchProgress) return;
      const now = Date.now();
      if (now - lastProgressSaveRef.current < 4500) return;
      lastProgressSaveRef.current = now;
      const dur = v.duration;
      const t = v.currentTime;
      if (!Number.isFinite(dur) || dur <= 10 || !Number.isFinite(t) || t < 12) return;
      if (t / dur > 0.94) return;
      void window.watchProgress.save(anime.id, currentEpisode, anime.mode, t, dur);
    },
    [anime, currentEpisode]
  );

  const handleVideoEnded = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const v = e.currentTarget;
      if (anime && window.watchProgress && Number.isFinite(v.duration) && v.duration > 1) {
        void window.watchProgress.save(anime.id, currentEpisode, anime.mode, v.duration, v.duration);
      }
      const i = sortedEpisodes.indexOf(currentEpisode);
      const next = i >= 0 && i < sortedEpisodes.length - 1 ? sortedEpisodes[i + 1] : null;
      if (next && autoPlayNextRef.current) {
        setUpNext({ episode: next, sec: 5 });
      }
    },
    [anime, currentEpisode, sortedEpisodes]
  );

  useEffect(() => {
    if (!upNext) return;
    if (upNext.sec <= 0) {
      void loadStream(upNext.episode);
      setUpNext(null);
      return;
    }
    const id = window.setTimeout(() => {
      setUpNext((u) => (u && u.sec > 0 ? { ...u, sec: u.sec - 1 } : u));
    }, 1000);
    return () => clearTimeout(id);
  }, [upNext, loadStream]);

  const streamRecoveryHint = useMemo(() => {
    if (!error) return null;
    const i = sortedEpisodes.indexOf(currentEpisode);
    if (i >= 0 && i < sortedEpisodes.length - 1) {
      return `If this keeps failing, try “${sortedEpisodes[i + 1]}” or pick another episode below.`;
    }
    if (sortedEpisodes.length > 1) {
      return "Some episodes may not have a playable stream from current sources — try another episode.";
    }
    return null;
  }, [error, sortedEpisodes, currentEpisode]);

  const episodeNav = useMemo(() => {
    const i = sortedEpisodes.indexOf(currentEpisode);
    const onNext =
      i >= 0 && i < sortedEpisodes.length - 1
        ? () => {
            setUpNext(null);
            void loadStream(sortedEpisodes[i + 1]);
          }
        : undefined;
    const onPrev =
      i > 0
        ? () => {
            setUpNext(null);
            void loadStream(sortedEpisodes[i - 1]);
          }
        : undefined;
    if (!onNext && !onPrev) return undefined;
    return { onNext, onPrev };
  }, [sortedEpisodes, currentEpisode, loadStream]);

  const toggleFullscreen = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void v.requestFullscreen?.();
    }
  }, []);

  const togglePictureInPicture = useCallback(() => {
    const v = videoRef.current;
    if (!v || !("pictureInPictureEnabled" in document) || !document.pictureInPictureEnabled) {
      return;
    }
    if (document.pictureInPictureElement) {
      void document.exitPictureInPicture();
    } else {
      void v.requestPictureInPicture?.();
    }
  }, []);

  useEffect(() => {
    if (anime) {
      miniSnapshotRef.current = {
        playUrl,
        anime,
        episodes,
        currentEpisode,
        details,
      };
    }
  }, [playUrl, anime, episodes, currentEpisode, details]);

  useEffect(() => {
    if (!playUrl || !anime) {
      return;
    }
    const displayName = details?.name ?? anime.name;
    setNowPlayingSession({
      title: displayName,
      episodeLine: `${currentEpisode} · ${anime.mode === "dub" ? "English dub" : "Japanese sub"}`,
      posterUrl: details?.thumbnail ?? null,
      getVideo: () => videoRef.current,
      onPrev: episodeNav?.onPrev,
      onNext: episodeNav?.onNext,
      canPrev: Boolean(episodeNav?.onPrev),
      canNext: Boolean(episodeNav?.onNext),
      onPictureInPicture: togglePictureInPicture,
      onFullscreen: toggleFullscreen,
      scrollToPlayer: () =>
        playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
      detached: false,
      resumeWatch: undefined,
    });
  }, [
    playUrl,
    anime,
    details?.name,
    details?.thumbnail,
    currentEpisode,
    episodeNav,
    setNowPlayingSession,
    togglePictureInPicture,
    toggleFullscreen,
  ]);

  useEffect(() => {
    return () => {
      const snap = miniSnapshotRef.current;
      if (!snap?.playUrl || !snap.anime) return;
      const displayName = snap.details?.name ?? snap.anime.name;
      setNowPlayingSession({
        title: displayName,
        episodeLine: `${snap.currentEpisode} · ${snap.anime.mode === "dub" ? "English dub" : "Japanese sub"}`,
        posterUrl: snap.details?.thumbnail ?? null,
        getVideo: () => null,
        onPrev: undefined,
        onNext: undefined,
        canPrev: false,
        canNext: false,
        onPictureInPicture: undefined,
        onFullscreen: undefined,
        scrollToPlayer: undefined,
        detached: true,
        resumeWatch: () =>
          navigate("/watch", {
            replace: false,
            state: {
              anime: snap.anime,
              episodes: snap.episodes,
              currentEpisode: snap.currentEpisode,
            } as WatchState,
          }),
      });
    };
  }, [navigate, setNowPlayingSession]);

  const persistVolume = useCallback(() => {
    const v = videoRef.current;
    if (!v || !window.anivault) return;
    const vol = v.volume;
    if (typeof vol === "number" && !Number.isNaN(vol)) {
      void window.anivault.setConfig({ volumeDefault: vol });
    }
  }, []);

  const retryStream = useCallback(() => {
    if (!currentEpisode) return;
    clearReconnectTimeout();
    autoReconnectAttemptRef.current = 0;
    setReconnectNotice(null);
    const el = videoRef.current;
    const fromVideo =
      el && !Number.isNaN(el.currentTime) && el.currentTime > 0 ? el.currentTime : null;
    const resumeFrom = fromVideo ?? lastPlaybackTimeRef.current ?? undefined;
    setPlayUrl("");
    setPlaybackError(null);
    setError(null);
    void loadStream(currentEpisode, resumeFrom != null ? { resumeFrom } : undefined);
  }, [clearReconnectTimeout, currentEpisode, loadStream]);

  const handleVideoError = useCallback(() => {
    const el = videoRef.current;
    const lastKnownTime =
      el && !Number.isNaN(el.currentTime) && el.currentTime > 0 ? el.currentTime : 0;
    lastPlaybackTimeRef.current =
      lastKnownTime > 0 ? lastKnownTime : lastPlaybackTimeRef.current;

    const ep = currentEpisode;

    autoReconnectAttemptRef.current += 1;
    const n = autoReconnectAttemptRef.current;

    if (n <= MAX_AUTO_RECONNECT) {
      setReconnectNotice(
        t("watch.reconnectNotice", { current: String(n), max: String(MAX_AUTO_RECONNECT) })
      );
      const delayMs = n === 1 ? 0 : Math.min(1000 * 2 ** (n - 2), 8000);
      clearReconnectTimeout();
      setPlayUrl("");
      setPlaybackError(null);
      const run = () => {
        void loadStream(ep, lastKnownTime > 0 ? { resumeFrom: lastKnownTime } : undefined);
      };
      if (delayMs === 0) {
        run();
      } else {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          run();
        }, delayMs);
      }
      return;
    }

    autoReconnectAttemptRef.current = 0;
    setReconnectNotice(null);
    setPlaybackError(
      t("watch.playbackFailedAfterRetries") + describeMediaErrorSuffix(el)
    );
  }, [clearReconnectTimeout, currentEpisode, loadStream, t]);

  const applyResumeIfNeeded = useCallback((video: HTMLVideoElement) => {
    const resume = resumeAfterLoadRef.current;
    if (resume == null || resume <= 0 || Number.isNaN(resume)) return;
    resumeAfterLoadRef.current = null;
    const dur = video.duration;
    let target = resume;
    if (Number.isFinite(dur) && dur > 0) {
      target = Math.min(resume, Math.max(0, dur - 0.25));
    }
    video.currentTime = Math.max(0, target);
  }, []);

  const handleVideoPlaying = useCallback(() => {
    autoReconnectAttemptRef.current = 0;
    setReconnectNotice(null);
  }, []);

  const handleSkipIntro = useCallback(() => {
    const v = videoRef.current;
    if (!v || !playUrl || loadingEpisode) return;
    const add = skipIntroSeconds;
    const dur = v.duration;
    const next = v.currentTime + add;
    if (Number.isFinite(dur) && dur > 1) {
      v.currentTime = Math.min(Math.max(0, next), Math.max(0, dur - 0.5));
    } else {
      v.currentTime = Math.max(0, next);
    }
  }, [playUrl, loadingEpisode, skipIntroSeconds]);

  const handleQueueOffline = useCallback(() => {
    if (!anime || !offlineQueueReady) return;
    void window.offlineDownloads
      .add({
        showId: anime.id,
        showName: anime.name,
        episode: currentEpisode,
        mode: anime.mode,
      })
      .then((r: OfflineDownloadAddResult) => {
        if (r.ok) {
          // i18n t() is typed loosely for dynamic keys
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          showToast(t("watch.toastQueueOfflineAdded"));
        } else {
          showToast(String(r.error), 4200);
        }
      });
  }, [anime, currentEpisode, offlineQueueReady, t]);

  const handleSaveFrame = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !playUrl || loadingEpisode) return;
    const base = anime?.id ?? "frame";
    const r = await saveVideoFrameAsPng(v, base);
    if (r.ok) showToast(t("watch.toastFrameSaved"));
    else showToast(t("watch.toastFrameFailed"), 4200);
  }, [anime?.id, playUrl, loadingEpisode, t]);

  const handleRecordClip = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !playUrl || loadingEpisode || clipRecording) return;
    setClipRecording(true);
    const r = await recordVideoClipFromElement(v, clipDurationMs);
    setClipRecording(false);
    if (r.ok) showToast(t("watch.toastClipSaved"));
    else showToast(t("watch.toastClipFailed"), 4800);
  }, [playUrl, loadingEpisode, clipRecording, clipDurationMs, t]);

  const handleSubmitFrameToGallery = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !playUrl || loadingEpisode || !anime) return;
    const token = await window.anivault.getConfig("authToken");
    if (!token?.trim()) {
      showToast(t("watch.toastGalleryNeedAuth"));
      return;
    }
    const dataUrl = getVideoFrameDataUrlPng(v);
    if (!dataUrl) {
      showToast(t("watch.toastFrameFailed"), 4200);
      return;
    }
    const title = `${anime.name} — ${currentEpisode}`.slice(0, 200);
    const r = await postGalleryUpload(title, dataUrl);
    if (r.ok) {
      showToast(t("watch.toastGallerySubmitted"));
      navigate("/gallery?tab=upload");
    } else {
      showToast(r.error ?? t("watch.toastGalleryFailed"), 4800);
    }
  }, [anime, currentEpisode, loadingEpisode, navigate, playUrl, t]);

  useWatchKeyboard(videoRef, Boolean(playUrl), playerSeekStepSec, episodeNav, togglePictureInPicture);

  useEffect(() => {
    if (!anime?.id) return;
    let cancelled = false;
    setSocialErr(null);
    try {
      const key = `av-dislike-${anime.id}`;
      setLocalDislikes(Number(localStorage.getItem(key)) || 0);
    } catch {
      setLocalDislikes(0);
    }
    void getShowEngagement(anime.id).then((r) => {
      if (!cancelled && r.ok && r.data) setEngagement(r.data);
    });
    void getShowComments(anime.id, 25, 0).then((r) => {
      if (!cancelled && r.ok && r.data?.comments) setComments(r.data.comments);
      else if (!cancelled && !r.ok) setSocialErr(r.error ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [anime?.id]);

  const onToggleLike = useCallback(async () => {
    if (!anime?.id) return;
    const next = !(engagement?.userLiked ?? false);
    const r = await postShowLike(anime.id, next);
    if (r.ok) {
      const e = await getShowEngagement(anime.id);
      if (e.ok && e.data) setEngagement(e.data);
    }
  }, [anime?.id, engagement?.userLiked]);

  const onBumpDislike = useCallback(() => {
    if (!anime?.id) return;
    const key = `av-dislike-${anime.id}`;
    const n = localDislikes + 1;
    setLocalDislikes(n);
    try {
      localStorage.setItem(key, String(n));
    } catch {
      /* ignore */
    }
  }, [anime?.id, localDislikes]);

  const onSubmitComment = useCallback(async () => {
    if (!anime?.id || !commentBody.trim()) return;
    setCommentBusy(true);
    const r = await postShowComment(anime.id, commentBody.trim());
    setCommentBusy(false);
    if (r.ok) {
      setCommentBody("");
      const g = await getShowComments(anime.id, 25, 0);
      if (g.ok && g.data?.comments) setComments(g.data.comments);
      const e = await getShowEngagement(anime.id);
      if (e.ok && e.data) setEngagement(e.data);
    } else {
      setSocialErr(r.error ?? "Could not post comment");
    }
  }, [anime?.id, commentBody]);

  const queryHydrating =
    !state?.anime &&
    Boolean(searchParams.get("id")) &&
    (searchParams.get("mode") === "sub" || searchParams.get("mode") === "dub");

  if (queryHydrating) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 bg-[var(--av-bg)] p-8 text-zinc-100">
        <p className="text-center text-sm text-zinc-400">Opening from link…</p>
      </div>
    );
  }

  if (!state?.anime) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 bg-[var(--av-bg)] p-8 text-zinc-100">
        <p className="text-center text-sm text-zinc-500">
          No anime selected. Go back and pick an episode to play.
        </p>
        <Button
          asChild
          variant="outline"
          className="rounded-full border-[var(--av-border)] bg-[var(--av-surface)] text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
        >
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  const displayName = details?.name ?? anime.name;
  const showEpisodeFilter = sortedEpisodes.length > EPISODE_FILTER_THRESHOLD;
  const inputNexus =
    "rounded-lg border border-[var(--av-border)] bg-[var(--av-bg)] text-sm text-[var(--av-text)] placeholder:text-[var(--av-muted-foreground)] focus-visible:border-[var(--av-accent-dim)] focus-visible:ring-[var(--av-accent-muted)]";

  const likes = engagement?.likesCount ?? 0;
  const ratioDenom = likes + localDislikes;
  const likeRatioPct = ratioDenom > 0 ? Math.round((likes / ratioDenom) * 100) : 50;

  const copyWatchDeepLink = useCallback(() => {
    try {
      const href = window.location.href;
      const hashIdx = href.indexOf("#");
      const base = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
      const link = `${base}#/watch?id=${encodeURIComponent(anime.id)}&mode=${anime.mode}&ep=${encodeURIComponent(currentEpisode)}`;
      void navigator.clipboard.writeText(link).then(
        () => showToast(t("watch.toastLinkCopied")),
        () => showToast(t("watch.toastCopyFailed"), 3200)
      );
    } catch {
      showToast(t("watch.toastCopyFailed"), 3200);
    }
  }, [anime.id, anime.mode, currentEpisode, t]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--av-bg)] text-zinc-100">
      <header className="flex shrink-0 flex-col gap-2 border-b border-white/[0.08] bg-[var(--av-bg)] px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-10 w-10 shrink-0 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          >
            <Link to="/" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-base font-semibold tracking-tight text-zinc-100"
              title={`${displayName} (${anime.mode === "dub" ? "Dub" : "Sub"})`}
            >
              {displayName}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              {anime.mode === "dub" ? "English dub" : "Japanese sub"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            title={t("watch.copyLinkTitle")}
            aria-label={t("watch.copyLinkTitle")}
            onClick={copyWatchDeepLink}
          >
            <Copy className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <nav
        className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-white/[0.06] px-3 py-1.5 text-[11px] text-zinc-500 sm:px-4"
        aria-label="Breadcrumb"
      >
        <Link to="/discover" className="transition-colors hover:text-zinc-200">
          Discover
        </Link>
        <span className="text-zinc-600" aria-hidden>
          /
        </span>
        <Link
          to={`/anime/${encodeURIComponent(anime.id)}`}
          state={{
            anime: {
              id: anime.id,
              name: displayName,
              episodeCount: 0,
              mode: anime.mode,
            },
          }}
          className="min-w-0 max-w-[40vw] truncate transition-colors hover:text-zinc-200"
        >
          {displayName}
        </Link>
        <span className="text-zinc-600" aria-hidden>
          /
        </span>
        <span className="min-w-0 max-w-[30vw] truncate font-medium text-zinc-300">{currentEpisode}</span>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 pb-8 pt-4 sm:px-5">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <div ref={playerSectionRef} className="relative w-full scroll-mt-24">
            {upNext ? (
              <div className="absolute inset-0 z-[45] flex flex-col items-center justify-center gap-4 rounded-2xl bg-black/88 px-6 text-center backdrop-blur-md">
                <p className="text-sm font-semibold text-zinc-100">Up next</p>
                <p className="max-w-sm text-xs text-zinc-300">{upNext.episode}</p>
                <p className="text-4xl font-bold tabular-nums text-white">
                  {upNext.sec > 0 ? upNext.sec : 0}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full bg-white text-black hover:bg-zinc-200"
                    onClick={() => {
                      const ep = upNext.episode;
                      setUpNext(null);
                      void loadStream(ep);
                    }}
                  >
                    Play now
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
                    onClick={() => setUpNext(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="relative rounded-xl outline-none ring-offset-2 ring-offset-black focus-visible:ring-2 focus-visible:ring-zinc-500">
                  <WatchPlayerStage
                    playUrl={playUrl}
                    streamRevision={streamRevision}
                    videoRef={videoRef}
                    loadingEpisode={loadingEpisode}
                    loadingHint={reconnectNotice}
                    error={error}
                    recoveryHint={streamRecoveryHint}
                    playbackError={playbackError}
                    useNativeControls={useNativeVideoControls}
                    defaultPlaybackSpeed={defaultPlaybackSpeed}
                    onLoadedMetadata={(e) => {
                      applyResumeIfNeeded(e.currentTarget);
                      if (window.anivault) {
                        void window.anivault.getConfig("volumeDefault").then((vol) => {
                          if (typeof vol === "number" && !Number.isNaN(vol)) {
                            e.currentTarget.volume = Math.min(1, Math.max(0, vol));
                          }
                        });
                      }
                    }}
                    onPlaying={handleVideoPlaying}
                    onVideoError={handleVideoError}
                    onVolumeChange={persistVolume}
                    onRetry={retryStream}
                    retryLoading={loadingEpisode}
                    toggleFullscreen={toggleFullscreen}
                    togglePictureInPicture={togglePictureInPicture}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                  />
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="border-zinc-700 bg-zinc-900 text-sm text-zinc-100">
                <ContextMenuItem
                  className="focus:bg-zinc-800"
                  disabled={!playUrl || !isPlaybackUrlCopySafe(playUrl)}
                  onSelect={() => {
                    if (!playUrl || !isPlaybackUrlCopySafe(playUrl)) return;
                    void navigator.clipboard.writeText(playUrl).then(
                      () => showToast(t("contextMenu.toastCopiedPlaybackUrl")),
                      () => showToast(t("contextMenu.toastCopyPlaybackUnavailable"), 3200)
                    );
                  }}
                >
                  <Link2 className="mr-2 h-3.5 w-3.5 opacity-80" />
                  {t("contextMenu.copyPlaybackUrl")}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>

          {playUrl ? (
            <p className="text-center text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
              <span className="text-zinc-500">Space</span> play/pause ·{" "}
              <span className="text-zinc-500">← →</span> seek ({playerSeekStepSec}s) ·{" "}
              <span className="text-zinc-500">F</span> fullscreen ·{" "}
              <span className="text-zinc-500">P</span> PiP ·{" "}
              <span className="text-zinc-500">M</span> mute ·{" "}
              <span className="text-zinc-500">N</span> next ·{" "}
              <span className="text-zinc-500">B</span> back
            </p>
          ) : null}

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {t("watch.playbackAssists")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{t("watch.playbackAssistsHint")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!playUrl || loadingEpisode}
                className="rounded-xl border-white/15 bg-white/[0.06] text-zinc-200 hover:bg-white/10"
                title={t("watch.skipIntroTitle", { sec: String(skipIntroSeconds) })}
                onClick={handleSkipIntro}
              >
                <SkipForward className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                {t("watch.skipIntro")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!playUrl || loadingEpisode || !offlineQueueReady}
                className="rounded-xl border-white/15 bg-white/[0.06] text-zinc-200 hover:bg-white/10 disabled:text-zinc-500"
                title={
                  offlineQueueReady
                    ? t("watch.queueOfflineTitle")
                    : t("watch.queueOfflineNeedSettings")
                }
                onClick={handleQueueOffline}
              >
                <Download className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                {t("watch.queueOffline")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!playUrl || loadingEpisode}
                className="rounded-xl border-white/15 bg-white/[0.06] text-zinc-200 hover:bg-white/10"
                title={t("watch.saveFrameTitle")}
                onClick={() => void handleSaveFrame()}
              >
                <ImageIcon className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                {t("watch.saveFrame")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!playUrl || loadingEpisode}
                className="rounded-xl border-emerald-500/30 bg-emerald-950/20 text-zinc-100 hover:bg-emerald-950/35"
                title={t("watch.submitFrameGalleryTitle")}
                onClick={() => void handleSubmitFrameToGallery()}
              >
                <ImagePlus className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                {t("watch.submitFrameGallery")}
              </Button>
              <label className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] text-zinc-400">
                <span className="whitespace-nowrap">{t("watch.clipDurationLabel")}</span>
                <select
                  value={clipDurationMs}
                  disabled={clipRecording}
                  onChange={(e) => setClipDurationMs(Number(e.target.value))}
                  className="max-w-[120px] rounded-md border border-white/15 bg-zinc-950 px-1.5 py-0.5 text-zinc-200"
                >
                  <option value={5000}>{t("watch.clipDuration5")}</option>
                  <option value={10000}>{t("watch.clipDuration10")}</option>
                  <option value={30000}>{t("watch.clipDuration30")}</option>
                </select>
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!playUrl || loadingEpisode || clipRecording}
                className="rounded-xl border-white/15 bg-white/[0.06] text-zinc-200 hover:bg-white/10 disabled:text-zinc-500"
                title={t("watch.recordClipTitle")}
                onClick={() => void handleRecordClip()}
              >
                <Camera className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                {clipRecording ? t("watch.recordingClip") : t("watch.recordClip")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={sortedEpisodes.length <= 1}
                    className="rounded-xl border-white/15 bg-white/[0.06] text-zinc-200 hover:bg-white/10 disabled:text-zinc-500"
                    title={t("watch.chaptersTitle")}
                  >
                    <ListOrdered className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                    {t("watch.chapters")}
                    <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-64 overflow-y-auto border-zinc-700 bg-zinc-900 text-zinc-100"
                >
                  {sortedEpisodes.map((ep) => (
                    <DropdownMenuItem
                      key={ep}
                      className="focus:bg-zinc-800"
                      onSelect={() => onEpisodeSelect(ep)}
                    >
                      {ep}
                      {ep === currentEpisode ? ` · ${t("watch.nowPlaying")}` : ""}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {details?.description ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Synopsis</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {details.description.replace(/<[^>]+>/g, "")}
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Reactions</p>
            <p className="mt-1 text-xs text-zinc-500">
              Likes sync when signed in with the AniVault companion server; dislikes are stored on this device only.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant={engagement?.userLiked ? "default" : "outline"}
                size="sm"
                className="gap-2 rounded-xl border-white/15"
                onClick={() => void onToggleLike()}
              >
                <ThumbsUp className="h-4 w-4" />
                {likes}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl border-white/15"
                onClick={onBumpDislike}
              >
                <ThumbsDown className="h-4 w-4" />
                {localDislikes}
              </Button>
              <div className="min-w-[140px] flex-1 rounded-full bg-white/5 px-3 py-2">
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>Like tilt</span>
                  <span className="tabular-nums text-zinc-300">{likeRatioPct}% up</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-zinc-500 to-zinc-200 transition-all"
                    style={{ width: `${likeRatioPct}%` }}
                  />
                </div>
              </div>
            </div>
            {socialErr ? (
              <p className="mt-2 text-xs text-amber-400/90" role="status">
                {socialErr}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <MessageCircle className="h-3.5 w-3.5" />
              Comments
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Write a note (requires server + account)…"
                className={inputNexus}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void onSubmitComment();
                  }
                }}
              />
              <Button
                type="button"
                className="shrink-0 rounded-xl"
                disabled={commentBusy || !commentBody.trim()}
                onClick={() => void onSubmitComment()}
              >
                Post
              </Button>
            </div>
            <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-sm">
              {comments.length === 0 ? (
                <li className="text-xs text-zinc-500">No comments yet.</li>
              ) : (
                comments.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-zinc-300"
                  >
                    <p className="text-xs">{c.body}</p>
                    <p className="mt-1 text-[10px] text-zinc-600">
                      {c.user_email ?? "User"} · {new Date(c.created_at).toLocaleString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div id="watch-episodes" className="scroll-mt-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Episodes
            </p>
            {showEpisodeFilter ? (
              <Input
                placeholder="Filter episodes…"
                className={cn(inputNexus, "mt-3")}
                value={episodeFilter}
                onChange={(e) => setEpisodeFilter(e.target.value)}
              />
            ) : null}
            <div className="mt-3">
              <EpisodePillGrid
                episodes={filteredEpisodes}
                currentEpisode={currentEpisode}
                loadingEpisode={loadingEpisode}
                onSelect={onEpisodeSelect}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
