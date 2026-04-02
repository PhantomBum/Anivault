import { Maximize2, Pause, PictureInPicture2, Play, Volume2, VolumeX } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { Button } from "@/renderer/components/ui/button";
import { cn } from "@/renderer/lib/utils";

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

function closestRate(r: number): number {
  return RATES.reduce((best, x) => (Math.abs(x - r) < Math.abs(best - r) ? x : best));
}

type WatchCustomControlsProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onFullscreen: () => void;
  onPictureInPicture: () => void;
  defaultPlaybackSpeed: number;
  visible: boolean;
};

/** Custom controls: monochrome progress, glass bottom bar. */
export function WatchCustomControls({
  videoRef,
  onFullscreen,
  onPictureInPicture,
  defaultPlaybackSpeed,
  visible,
}: WatchCustomControlsProps) {
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [rate, setRate] = useState(defaultPlaybackSpeed);

  const sync = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setPaused(v.paused);
    setMuted(v.muted);
    setVolume(v.volume);
    setCurrent(v.currentTime);
    setDuration(Number.isFinite(v.duration) ? v.duration : 0);
    setRate(v.playbackRate);
    try {
      const b = v.buffered;
      if (b.length > 0 && Number.isFinite(v.duration) && v.duration > 0) {
        setBufferedEnd(b.end(b.length - 1));
      } else {
        setBufferedEnd(0);
      }
    } catch {
      setBufferedEnd(0);
    }
  }, [videoRef]);

  useEffect(() => {
    setRate(defaultPlaybackSpeed);
  }, [defaultPlaybackSpeed]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tick = () => sync();
    v.addEventListener("timeupdate", tick);
    v.addEventListener("progress", tick);
    v.addEventListener("loadedmetadata", tick);
    v.addEventListener("play", tick);
    v.addEventListener("pause", tick);
    v.addEventListener("volumechange", tick);
    v.addEventListener("ratechange", tick);
    sync();
    return () => {
      v.removeEventListener("timeupdate", tick);
      v.removeEventListener("progress", tick);
      v.removeEventListener("loadedmetadata", tick);
      v.removeEventListener("play", tick);
      v.removeEventListener("pause", tick);
      v.removeEventListener("volumechange", tick);
      v.removeEventListener("ratechange", tick);
    };
  }, [videoRef, sync]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    sync();
  };

  const setVol = (vol: number) => {
    const v = videoRef.current;
    if (!v) return;
    const next = Math.min(1, Math.max(0, vol));
    v.volume = next;
    if (next > 0 && v.muted) v.muted = false;
    sync();
  };

  const scrub = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    setCurrent(t);
  };

  const fmt = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const dur = duration > 0 ? duration : 1;
  const playedPct = Math.min(100, (current / dur) * 100);
  const bufPct = Math.min(100, bufferedEnd > 0 ? (bufferedEnd / dur) * 100 : 0);

  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-20 flex flex-col border-t border-zinc-800/80 bg-zinc-950/95 px-3 pb-3 pt-3 transition-opacity duration-200 ease-out sm:px-4",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="flex flex-col gap-2.5">
        <div className="relative px-0.5">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-zinc-600/50"
              style={{ width: `${bufPct}%` }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-zinc-200"
              style={{ width: `${playedPct}%` }}
            />
            <input
              type="range"
              min={0}
              max={dur}
              step={0.1}
              value={Math.min(current, dur)}
              onChange={(e) => scrub(Number.parseFloat(e.target.value))}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              aria-label="Seek"
            />
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={paused ? "Play" : "Pause"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-600 bg-zinc-100 text-zinc-950 shadow-sm transition hover:bg-white"
            >
              {paused ? (
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              ) : (
                <Pause className="h-5 w-5 fill-current" />
              )}
            </button>
            <span className="min-w-0 tabular-nums text-xs font-medium text-zinc-400 sm:text-sm">
              <span className="text-zinc-100">{fmt(current)}</span>
              <span className="text-zinc-600"> / </span>
              <span className="text-zinc-500">{fmt(duration)}</span>
            </span>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 lg:max-w-md lg:justify-center">
            <button
              type="button"
              className="shrink-0 rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={muted ? 0 : volume}
              onChange={(e) => setVol(Number.parseFloat(e.target.value))}
              className="h-1.5 w-full min-w-0 flex-1 cursor-pointer accent-zinc-400"
              aria-label="Volume"
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <label className="flex items-center">
              <span className="sr-only">Playback speed</span>
              <select
                value={String(closestRate(rate))}
                onChange={(e) => {
                  const v = videoRef.current;
                  const next = Number.parseFloat(e.target.value);
                  if (v) v.playbackRate = next;
                  setRate(next);
                }}
                className="h-9 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-xs font-medium text-zinc-200 outline-none transition hover:border-zinc-500 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-500"
              >
                {RATES.map((r) => (
                  <option key={r} value={String(r)} className="bg-zinc-900">
                    {r === 1 ? "1×" : `${r}×`}
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={onPictureInPicture}
              title="Picture in picture"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={onFullscreen}
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="hidden text-center text-[10px] leading-tight text-zinc-600 sm:block">
          Space · play/pause · M · mute · F · fullscreen · ← / → · seek
        </p>
      </div>
    </div>
  );
}
