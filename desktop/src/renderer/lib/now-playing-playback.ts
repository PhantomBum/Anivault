import type { NowPlayingSession } from "@/renderer/context/now-playing-context";

/** Shared play/pause / resume behavior for the mini player bar and global shortcuts. */
export function toggleNowPlayingPlayback(session: NowPlayingSession | null): void {
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
      /* ignore autoplay / codec errors */
    });
  } else {
    v.pause();
  }
}
