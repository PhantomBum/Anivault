import React, { createContext, useContext, useMemo, useState } from "react";

export type NowPlayingSession = {
  title: string;
  episodeLine: string;
  posterUrl: string | null;
  getVideo: () => HTMLVideoElement | null;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev: boolean;
  canNext: boolean;
  onPictureInPicture?: () => void;
  onFullscreen?: () => void;
  scrollToPlayer?: () => void;
};

type NowPlayingContextValue = {
  session: NowPlayingSession | null;
  setSession: (s: NowPlayingSession | null) => void;
};

const NowPlayingContext = createContext<NowPlayingContextValue | null>(null);

export function NowPlayingProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<NowPlayingSession | null>(null);
  const value = useMemo(() => ({ session, setSession }), [session]);
  return <NowPlayingContext.Provider value={value}>{children}</NowPlayingContext.Provider>;
}

export function useNowPlaying() {
  const ctx = useContext(NowPlayingContext);
  if (!ctx) {
    throw new Error("useNowPlaying must be used within NowPlayingProvider");
  }
  return ctx;
}
