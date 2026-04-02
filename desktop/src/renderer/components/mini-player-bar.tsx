import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/renderer/components/ui/dropdown-menu";
import { useNowPlaying } from "@/renderer/context/now-playing-context";
import { cn } from "@/renderer/lib/utils";
import {
  Maximize2,
  MoreHorizontal,
  Pause,
  PictureInPicture2,
  Play,
  SkipBack,
  SkipForward,
  SquareArrowUpRight,
  Volume2,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MiniPlayerBar() {
  const { session } = useNowPlaying();
  const [tick, setTick] = useState(0);
  const [volume, setVolume] = useState(1);
  const useMarqueeTitle = (session?.title.length ?? 0) > 34;

  const video = session?.getVideo() ?? null;
  const current = video && Number.isFinite(video.currentTime) ? video.currentTime : 0;
  const duration =
    video && Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  const paused = video ? video.paused : true;
  const progress = duration > 0 ? Math.min(1, current / duration) : 0;

  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [session]);

  useEffect(() => {
    if (video && typeof video.volume === "number") {
      setVolume(video.volume);
    }
  }, [video, tick]);

  const togglePlay = useCallback(() => {
    const v = session?.getVideo();
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => {
        /* ignore */
      });
    } else {
      v.pause();
    }
    setTick((t) => t + 1);
  }, [session]);

  const onBarPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const v = session?.getVideo();
      if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      v.currentTime = ratio * v.duration;
      setTick((t) => t + 1);
    },
    [session]
  );

  const setVol = useCallback(
    (next: number) => {
      const v = session?.getVideo();
      if (!v) return;
      const clamped = Math.min(1, Math.max(0, next));
      v.volume = clamped;
      setVolume(clamped);
      setTick((t) => t + 1);
    },
    [session]
  );

  if (!session) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto fixed bottom-0 right-0 z-[65] flex flex-col border-t border-[var(--av-border)] bg-[var(--av-bg-elevated)]/95 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl",
        "left-0 md:left-[var(--av-sidebar-w)]"
      )}
      role="region"
      aria-label="Now playing"
    >
      {/* Progress (Spotify-style strip) */}
      <div
        className="group relative h-1 w-full cursor-pointer bg-zinc-800/90"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onBarPointer(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          onBarPointer(e);
        }}
      >
        <div
          className="absolute inset-y-0 left-0 bg-[var(--av-accent-dim)] transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />
      </div>

      <div className="flex min-h-[4.25rem] items-center gap-3 px-3 py-2 sm:gap-4 sm:px-4">
        {/* Art + titles */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10">
            {session.posterUrl ? (
              <img
                src={session.posterUrl}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-[10px] font-medium text-zinc-500">
                AniVault
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div
              className={cn(
                "text-sm font-semibold leading-tight text-[var(--av-text)]",
                useMarqueeTitle ? "overflow-hidden" : "truncate"
              )}
              title={session.title}
            >
              {useMarqueeTitle ? (
                <div className="flex w-max max-w-none animate-av-title-marquee whitespace-nowrap">
                  <span className="shrink-0 pr-10">{session.title}</span>
                  <span className="shrink-0 pr-10">{session.title}</span>
                </div>
              ) : (
                session.title
              )}
            </div>
            <p className="truncate text-xs text-[var(--av-muted)]">{session.episodeLine}</p>
          </div>
        </div>

        {/* Transport */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25"
            aria-label="Previous episode"
            disabled={!session.canPrev}
            onClick={() => session.onPrev?.()}
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label={paused ? "Play" : "Pause"}
            onClick={togglePlay}
          >
            {paused ? <Play className="ml-0.5 h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25"
            aria-label="Next episode"
            disabled={!session.canNext}
            onClick={() => session.onNext?.()}
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden min-w-[4.5rem] flex-col items-end text-[10px] tabular-nums text-zinc-500 sm:flex">
          <span>
            {formatTime(current)} / {formatTime(duration)}
          </span>
        </div>

        {/* More */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="More options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Playback
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="gap-2"
              onClick={() => session.scrollToPlayer?.()}
            >
              <SquareArrowUpRight className="h-4 w-4" />
              Scroll to player
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => session.onPictureInPicture?.()}>
              <PictureInPicture2 className="h-4 w-4" />
              Picture in picture
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => session.onFullscreen?.()}>
              <Maximize2 className="h-4 w-4" />
              Fullscreen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal">
              <Volume2 className="h-3.5 w-3.5" />
              Volume
            </DropdownMenuLabel>
            <div className="px-2 pb-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                className="h-2 w-full cursor-pointer accent-[var(--av-accent-dim)]"
                aria-label="Volume"
                onChange={(e) => setVol(Number(e.target.value))}
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
