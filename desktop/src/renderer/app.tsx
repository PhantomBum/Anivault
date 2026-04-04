import React, { Suspense, useEffect, lazy } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";

import { initI18n } from "@/renderer/helpers/i18n/i18n";
import { updateAppLanguage } from "@/renderer/helpers/i18n/language-helpers";
import { syncThemeWithLocal } from "@/renderer/helpers/theme/theme-helper";
import { AvLoadingBar } from "@/renderer/components/av-loading-bar";
import { AppGate } from "@/renderer/components/app-gate";
import { AvToastHost } from "@/renderer/components/av-toast-host";
import { SmoothCursorHost } from "@/renderer/components/smooth-cursor-host";
import { RendererErrorBoundary } from "@/renderer/components/renderer-error-boundary";
import { UpdateAvailableDialog } from "@/renderer/components/update-available-dialog";
import { AnivaultConfigProvider } from "@/renderer/context/anivault-config-context";
import { NowPlayingProvider } from "@/renderer/context/now-playing-context";
import SidebarLayout from "@/renderer/layouts/sidebar-layout";

const WelcomePage = lazy(() =>
  import("@/renderer/pages/welcome-page").then((m) => ({ default: m.WelcomePage }))
);
const AnimeSearchPage = lazy(() =>
  import("@/renderer/pages/anime-search-page").then((m) => ({ default: m.AnimeSearchPage }))
);
const AnimeDetailsPage = lazy(() =>
  import("@/renderer/pages/anime-details-page").then((m) => ({ default: m.AnimeDetailsPage }))
);
const WatchPage = lazy(() =>
  import("@/renderer/pages/watch-page").then((m) => ({ default: m.WatchPage }))
);
const PlayerPage = lazy(() =>
  import("@/renderer/pages/player-page").then((m) => ({ default: m.PlayerPage }))
);
const SettingsPage = lazy(() =>
  import("@/renderer/pages/settings-page").then((m) => ({ default: m.SettingsPage }))
);
const AccountPage = lazy(() =>
  import("@/renderer/pages/account-page").then((m) => ({ default: m.AccountPage }))
);
const DiscoverPage = lazy(() =>
  import("@/renderer/pages/discover-page").then((m) => ({ default: m.DiscoverPage }))
);
const SchedulePage = lazy(() =>
  import("@/renderer/pages/schedule-page").then((m) => ({ default: m.SchedulePage }))
);
const RequestSeriesPage = lazy(() =>
  import("@/renderer/pages/request-series-page").then((m) => ({ default: m.RequestSeriesPage }))
);
const TermsPage = lazy(() =>
  import("@/renderer/pages/terms-page").then((m) => ({ default: m.TermsPage }))
);
const ListsPage = lazy(() =>
  import("@/renderer/pages/lists-page").then((m) => ({ default: m.ListsPage }))
);
const CommunityPage = lazy(() =>
  import("@/renderer/pages/community-page").then((m) => ({ default: m.CommunityPage }))
);
const GalleryPage = lazy(() =>
  import("@/renderer/pages/gallery-page").then((m) => ({ default: m.GalleryPage }))
);
const ClipsPage = lazy(() =>
  import("@/renderer/pages/clips-page").then((m) => ({ default: m.ClipsPage }))
);
const BrowsePage = lazy(() =>
  import("@/renderer/pages/browse-page").then((m) => ({ default: m.BrowsePage }))
);

function RouteFallback() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-6 bg-[var(--av-bg)] px-6 text-[var(--av-muted)] motion-safe:animate-av-fade-in">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] shadow-av-md motion-safe:animate-av-soft-pulse">
        <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-zinc-600/30 to-transparent" />
        <span className="relative text-sm font-bold tracking-tight text-zinc-100">AV</span>
      </div>
      <AvLoadingBar className="max-w-[220px] motion-safe:animate-av-soft-pulse" />
      <div className="text-center motion-safe:animate-av-fade-up">
        <p className="text-sm font-medium text-[var(--av-text)]">Loading view</p>
        <p className="mt-1 text-xs text-[var(--av-muted-foreground)]">Preparing layout and scripts…</p>
      </div>
    </div>
  );
}

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    void syncThemeWithLocal();
    void updateAppLanguage(i18n);
  }, [i18n]);

  return (
    <AnivaultConfigProvider>
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <SmoothCursorHost />
        <AvToastHost />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AppGate>
            <RendererErrorBoundary>
              <HashRouter>
                <UpdateAvailableDialog />
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route
                      element={
                        <NowPlayingProvider>
                          <SidebarLayout />
                        </NowPlayingProvider>
                      }
                    >
                      <Route path="/" element={<WelcomePage />} />
                      <Route path="/discover" element={<DiscoverPage />} />
                      <Route path="/browse" element={<BrowsePage />} />
                      <Route path="/explore" element={<Navigate to="/discover" replace />} />
                      <Route path="/schedule" element={<SchedulePage />} />
                      <Route path="/request-series" element={<RequestSeriesPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/anime/:id" element={<AnimeDetailsPage />} />
                      <Route path="/anime" element={<AnimeSearchPage />} />
                      <Route path="/watch" element={<WatchPage />} />
                      <Route path="/player" element={<PlayerPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/community" element={<CommunityPage />} />
                      <Route path="/gallery" element={<GalleryPage />} />
                      <Route path="/clips" element={<ClipsPage />} />
                      <Route path="/lists" element={<ListsPage />} />
                      <Route path="/account" element={<AccountPage />} />
                    </Route>
                  </Routes>
                </Suspense>
              </HashRouter>
            </RendererErrorBoundary>
          </AppGate>
        </div>
      </div>
    </AnivaultConfigProvider>
  );
}

/**
 * i18n must finish before the first render: `App` calls `useTranslation()`, and
 * mounting before `init` completes can leave the shell blank (no Suspense fallback).
 */
void initI18n().then(() => {
  const el = document.getElementById("app");
  if (!el) {
    // eslint-disable-next-line no-console
    console.error("[renderer] Missing #app — index.html not loaded correctly.");
    return;
  }
  const root = createRoot(el);
  root.render(<App />);
});
