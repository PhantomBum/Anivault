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
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MiniPlayerBar() {
  const location = useLocation();
  const { session } = useNowPlaying();
  const hideOnAnimeDetail = /^\/anime\/[^/]+$/.test(location.pathname);
  const [tick, setTick] = useState(0);
  const [volume, setVolume] = useState(1);
  const useMarqueeTitle = (session?.title.length ?? 0) > 42;

  const video = session?.getVideo() ?? null;
  const isDetached = Boolean(session?.detached && session?.resumeWatch);
  const current = video && Number.isFinite(video.currentTime) ? video.currentTime : 0;
  const duration =
    video && Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  const paused = video ? video.paused : true;
  const progress = useMemo(() => {
    if (isDetached) return 0;
    return duration > 0 ? Math.min(1, current / duration) : 0;
  }, [isDetached, duration, current]);

  useEffect(() => {
    if (!session || isDetached) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 400);
    return () => clearInterval(id);
  }, [session, isDetached]);

  useEffect(() => {
    if (video && typeof video.volume === "number") {
      setVolume(video.volume);
    }
  }, [video, tick]);

  const togglePlay = useCallback(() => {
    if (!session) return;
    if (session.detached && session.resumeWatch) {
      session.resumeWatch();
      return;
    }
    const v = session.getVideo();
    if (!v) {
      session.resumeWatch?.();
      return;
    }
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
      if (isDetached || !v || !Number.isFinite(v.duration) || v.duration <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      v.currentTime = ratio * v.duration;
      setTick((t) => t + 1);
    },
    [session, isDetached]
  );

  const setVol = useCallback(
    (next: number) => {
      const v = session?.getVideo();
      if (isDetached || !v) return;
      const clamped = Math.min(1, Math.max(0, next));
      v.volume = clamped;
      setVolume(clamped);
      setTick((t) => t + 1);
    },
    [session, isDetached]
  );

  if (!session || hideOnAnimeDetail) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-3 z-[65] flex justify-center px-3 md:bottom-4 md:pl-[calc(var(--av-sidebar-w)+0.75rem)] md:pr-5"
    >
      <div
        className={cn(
          "av-mini-player pointer-events-auto flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg-elevated)] shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
          "md:max-w-lg"
        )}
        role="region"
        aria-label="Now playing"
      >
      <div
        className={cn(
          "group relative h-0.5 w-full bg-zinc-800/80",
          isDetached ? "cursor-default opacity-60" : "cursor-pointer"
        )}
        onPointerDown={(e) => {
          if (isDetached) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          onBarPointer(e);
        }}
        onPointerMove={(e) => {
          if (isDetached || e.buttons !== 1) return;
          onBarPointer(e);
        }}
      >
        <div
          className="absolute inset-y-0 left-0 bg-[var(--av-accent-dim)] transition-[width] duration-300 ease-out [transition-delay:45ms]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex min-h-0 items-center gap-2 px-2 py-1.5 sm:gap-3 sm:px-3 sm:py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-900 ring-1 ring-white/10">
            {session.posterUrl ? (
              <img
                src={session.posterUrl}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-[9px] font-medium text-zinc-500">
                AV
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div
              className={cn(
                "text-[13px] font-semibold leading-snug text-[var(--av-text)]",
                useMarqueeTitle ? "overflow-hidden" : "truncate"
              )}
              title={session.title}
            >
              {useMarqueeTitle ? (
                <div className="flex w-max max-w-none animate-av-title-marquee whitespace-nowrap">
                  <span className="shrink-0 pr-8">{session.title}</span>
                  <span className="shrink-0 pr-8">{session.title}</span>
                </div>
              ) : (
                session.title
              )}
            </div>
            <p className="truncate text-[11px] leading-tight text-[var(--av-muted)]">
              {isDetached ? "Paused · leave to browse — tap play to resume" : session.episodeLine}
            </p>
            <p className="mt-0.5 text-[10px] tabular-nums text-zinc-500 sm:hidden">
              {formatTime(current)} · {formatTime(duration)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-25"
            aria-label="Previous episode"
            disabled={isDetached || !session.canPrev}
            onClick={() => session.onPrev?.()}
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="mx-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-md transition-transform hover:scale-[1.03] active:scale-95"
            aria-label={isDetached ? "Resume in player" : paused ? "Play" : "Pause"}
            onClick={togglePlay}
          >
            {isDetached || paused ? (
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            ) : (
              <Pause className="h-4 w-4 fill-current" />
            )}
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-25"
            aria-label="Next episode"
            disabled={isDetached || !session.canNext}
            onClick={() => session.onNext?.()}
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden min-w-[3.5rem] text-right text-[10px] tabular-nums text-zinc-500 sm:block">
          {formatTime(current)} / {formatTime(duration)}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
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
    </div>
  );
}
