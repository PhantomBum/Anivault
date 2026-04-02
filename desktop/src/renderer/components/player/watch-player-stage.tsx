import { Loader2, Maximize2, PictureInPicture2, RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { WatchCustomControls } from "@/renderer/components/player/watch-custom-controls";
import { Button } from "@/renderer/components/ui/button";

const CONTROLS_HIDE_MS = 4000;

type WatchPlayerStageProps = {
  playUrl: string;
  streamRevision: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  loadingEpisode: boolean;
  error: string | null;
  /** Shown under load failure (e.g. try another episode). */
  recoveryHint?: string | null;
  playbackError: string | null;
  useNativeControls: boolean;
  defaultPlaybackSpeed: number;
  onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onPlaying: () => void;
  onVideoError: () => void;
  onVolumeChange: () => void;
  onRetry: () => void;
  retryLoading: boolean;
  toggleFullscreen: () => void;
  togglePictureInPicture: () => void;
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onEnded?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
};

/** Letterboxed player: black stage, neutral frame, minimal chrome. */
export function WatchPlayerStage({
  playUrl,
  streamRevision,
  videoRef,
  loadingEpisode,
  error,
  recoveryHint,
  playbackError,
  useNativeControls,
  defaultPlaybackSpeed,
  onLoadedMetadata,
  onPlaying,
  onVideoError,
  onVolumeChange,
  onRetry,
  retryLoading,
  toggleFullscreen,
  togglePictureInPicture,
  onTimeUpdate,
  onEnded,
}: WatchPlayerStageProps) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
      hideTimerRef.current = null;
    }, CONTROLS_HIDE_MS);
  }, []);

  useEffect(() => {
    if (useNativeControls) return;
    bumpControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [playUrl, streamRevision, useNativeControls, bumpControls]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-[0_12px_40px_-12px_rgba(0,0,0,0.75)] ring-1 ring-zinc-800/80">
      <div className="relative flex aspect-video w-full items-center justify-center bg-black">
        {loadingEpisode && !playUrl ? (
          <div className="flex flex-col items-center gap-3 text-zinc-500">
            <Loader2 className="h-12 w-12 animate-spin text-zinc-400" />
            <span className="text-sm font-medium tracking-wide text-zinc-400">Loading stream…</span>
          </div>
        ) : error && !playUrl ? (
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <p className="max-w-sm text-sm text-red-400/95">{error}</p>
            {recoveryHint ? (
              <p className="max-w-md text-xs leading-relaxed text-zinc-500">{recoveryHint}</p>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15"
              onClick={onRetry}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : playUrl ? (
          <div
            className="group relative h-full w-full"
            onMouseMove={!useNativeControls ? bumpControls : undefined}
            onMouseLeave={
              !useNativeControls
                ? () => {
                    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                    hideTimerRef.current = setTimeout(() => {
                      setControlsVisible(false);
                      hideTimerRef.current = null;
                    }, 800);
                  }
                : undefined
            }
          >
            {useNativeControls ? (
              <div className="pointer-events-none absolute right-3 top-3 z-10 flex gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="pointer-events-auto h-9 w-9 rounded-full border border-zinc-700 bg-zinc-950/90 text-zinc-100 shadow-md hover:bg-zinc-900"
                  onClick={toggleFullscreen}
                  title="Fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="pointer-events-auto h-9 w-9 rounded-full border border-zinc-700 bg-zinc-950/90 text-zinc-100 shadow-md hover:bg-zinc-900"
                  onClick={togglePictureInPicture}
                  title="Picture in picture"
                >
                  <PictureInPicture2 className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
            <video
              ref={videoRef}
              key={streamRevision}
              className="h-full w-full object-contain bg-black"
              controls={useNativeControls}
              controlsList="nodownload"
              autoPlay
              playsInline
              src={playUrl}
              onLoadedMetadata={(e) => {
                e.currentTarget.playbackRate = defaultPlaybackSpeed;
                onLoadedMetadata(e);
              }}
              onPlaying={onPlaying}
              onError={onVideoError}
              onVolumeChange={onVolumeChange}
              onTimeUpdate={onTimeUpdate}
              onEnded={onEnded}
            />
            {!useNativeControls ? (
              <WatchCustomControls
                videoRef={videoRef}
                onFullscreen={toggleFullscreen}
                onPictureInPicture={togglePictureInPicture}
                defaultPlaybackSpeed={defaultPlaybackSpeed}
                visible={controlsVisible}
              />
            ) : null}
            {playbackError ? (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/92 px-6 text-center">
                <p className="max-w-md text-sm leading-relaxed text-zinc-200">{playbackError}</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={retryLoading}
                  className="rounded-full border border-white/25 bg-white/10 text-white hover:bg-white/20"
                  onClick={onRetry}
                >
                  {retryLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reload stream
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center text-zinc-500">
            <span className="text-sm">Select an episode to play</span>
          </div>
        )}
      </div>
    </div>
  );
}
