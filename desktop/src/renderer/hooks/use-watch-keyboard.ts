import { type RefObject, useEffect } from "react";

/**
 * Space: play/pause · ←/→ seek · F fullscreen · P PiP · M mute · N/B next/prev episode (when provided)
 */
export function useWatchKeyboard(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  seekStepSec = 5,
  episodeNav?: { onNext?: () => void; onPrev?: () => void },
  onPictureInPicture?: () => void
) {
  useEffect(() => {
    if (!enabled) return;

    const step = seekStepSec;

    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current;
      if (!v) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "KeyN" && episodeNav?.onNext) {
        e.preventDefault();
        episodeNav.onNext();
        return;
      }
      if (e.code === "KeyB" && episodeNav?.onPrev) {
        e.preventDefault();
        episodeNav.onPrev();
        return;
      }

      if (e.code === "KeyP" && onPictureInPicture) {
        e.preventDefault();
        onPictureInPicture();
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (v.paused) void v.play();
          else v.pause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - step);
          break;
        case "ArrowRight":
          e.preventDefault();
          v.currentTime = Math.min(
            Number.isFinite(v.duration) && v.duration > 0 ? v.duration : v.currentTime + step,
            v.currentTime + step
          );
          break;
        case "KeyF":
          e.preventDefault();
          if (document.fullscreenElement) void document.exitFullscreen();
          else void v.requestFullscreen?.();
          break;
        case "KeyM":
          e.preventDefault();
          v.muted = !v.muted;
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, videoRef, seekStepSec, episodeNav, onPictureInPicture]);
}
