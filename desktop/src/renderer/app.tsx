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

function RouteFallback() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-5 bg-[var(--av-bg)] px-6 text-[var(--av-muted)] motion-safe:animate-av-fade-in">
      <AvLoadingBar className="max-w-[200px] motion-safe:animate-av-soft-pulse" />
      <span className="text-[var(--av-text)] motion-safe:animate-av-fade-up">Loading…</span>
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
      <SmoothCursorHost />
      <AvToastHost />
      <AppGate>
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
              <Route path="/browse" element={<Navigate to="/discover" replace />} />
              <Route path="/explore" element={<Navigate to="/discover" replace />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/request-series" element={<RequestSeriesPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/anime/:id" element={<AnimeDetailsPage />} />
              <Route path="/anime" element={<AnimeSearchPage />} />
              <Route path="/watch" element={<WatchPage />} />
              <Route path="/player" element={<PlayerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/community" element={<Navigate to="/" replace />} />
              <Route path="/gallery" element={<Navigate to="/" replace />} />
              <Route path="/clips" element={<Navigate to="/" replace />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
      </AppGate>
    </AnivaultConfigProvider>
  );
}

void initI18n();

const root = createRoot(document.getElementById("app"));
root.render(<App />);
