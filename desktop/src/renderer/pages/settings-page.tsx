import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/renderer/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/renderer/components/ui/tabs";
import { Database, FolderOpen, Palette, Search } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { applyShellAppearance } from "@/renderer/helpers/shell-appearance";
import { applyUiDensityToShell } from "@/renderer/helpers/ui-density";
import { useAnivaultConfig } from "@/renderer/context/anivault-config-context";
import {
  SETTINGS_TABS,
  filterSettingsSearch,
  type SettingsTab,
} from "@/renderer/lib/settings-search-index";
import { testAnivaultServerConnection } from "@/renderer/lib/anivault-api";
import { translateText } from "@/renderer/lib/translation";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";
import { APP_DISPLAY_NAME } from "@/shared/app-brand";
import type { OfflineDownloadItem } from "@/shared/offline-downloads-types";
import updateLogsText from "@/renderer/data/update-logs.txt?raw";

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "pt-BR", label: "Português (BR)" },
];

const settingsTabTriggerClassName =
  "flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[var(--av-muted)] transition-colors data-[state=active]:bg-[var(--av-accent-muted)] data-[state=active]:text-[var(--av-text)] data-[state=active]:shadow-none data-[state=inactive]:hover:bg-[var(--av-surface-hover)]";

const settingsTabContentClassName =
  "mt-8 min-h-[32rem] space-y-6 rounded-2xl border border-[var(--av-border)] bg-[linear-gradient(145deg,#1c1c21_0%,#18181b_55%,#141418_100%)] p-6 shadow-sm transition-opacity duration-200 motion-safe:animate-av-route-in md:p-8";

export function SettingsPage() {
  const { i18n, t } = useTranslation();
  const { refresh } = useAnivaultConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo((): SettingsTab => {
    const t = searchParams.get("tab") ?? "";
    return SETTINGS_TABS.includes(t as SettingsTab) ? (t as SettingsTab) : "playback";
  }, [searchParams]);
  const [cfg, setCfg] = useState<AnivaultStoreSchema | null>(null);
  const [saved, setSaved] = useState(false);
  const [translateSample, setTranslateSample] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>("");
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [findQuery, setFindQuery] = useState("");
  const [connMsg, setConnMsg] = useState<string | null>(null);
  const [connBusy, setConnBusy] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineDownloadItem[]>([]);

  const searchHits = useMemo(() => filterSettingsSearch(findQuery), [findQuery]);

  const load = useCallback(async () => {
    if (!window.anivault) return;
    const all = await window.anivault.getAllConfig();
    setCfg(all);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!cfg) return;
    applyUiDensityToShell(cfg.uiDensity);
  }, [cfg]);

  useEffect(() => {
    void window.app.version().then((v) => setAppVersion(String(v)));
  }, []);

  useEffect(() => {
    if (!cfg?.offlineDownloadsEnabled) {
      setOfflineQueue([]);
      return;
    }
    const load = () => {
      refreshOfflineQueue();
    };
    load();
    const timer = window.setInterval(load, 2800);
    return () => window.clearInterval(timer);
  }, [cfg?.offlineDownloadsEnabled, refreshOfflineQueue]);

  const refreshOfflineQueue = useCallback(() => {
    void window.offlineDownloads.list().then(setOfflineQueue);
  }, []);

  const persist = async (partial: Partial<AnivaultStoreSchema>) => {
    if (!window.anivault) return;
    await window.anivault.setConfig(partial);
    setCfg((c) => {
      const next = c ? { ...c, ...partial } : c;
      if (next && (partial.chromaticEmphasis != null || partial.shellPreset != null)) {
        applyShellAppearance({
          chromaticEmphasis: next.chromaticEmphasis,
          shellPreset: next.shellPreset,
        });
      }
      return next;
    });
    if (partial.uiDensity != null) applyUiDensityToShell(partial.uiDensity);
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (!cfg) {
    return (
      <div className="text-sm text-[var(--av-muted)]">{t("settings.loading")}</div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-1 pb-10 text-[var(--av-text)]">
      <div className="border-b border-[var(--av-border)] pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--av-text)] md:text-[1.75rem]">
          {t("settings.title")}
        </h2>
        <p className="mt-2 text-base text-[var(--av-muted)]">{t("settings.subtitle")}</p>
        <div className="relative mt-4 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--av-muted)]"
            aria-hidden
          />
          <Input
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            placeholder={t("settings.findPlaceholder")}
            className="h-11 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] pl-10 pr-3 text-sm"
            aria-label={t("settings.findAria")}
            autoComplete="off"
          />
          {searchHits.length > 0 ? (
            <ul
              className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] py-1 shadow-av-lg"
              role="listbox"
            >
              {searchHits.map((h) => (
                <li key={h.id} role="option">
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--av-surface-hover)]"
                    onClick={() => {
                      setSearchParams({ tab: h.tab }, { replace: true });
                      setFindQuery("");
                      window.setTimeout(() => {
                        document.getElementById(h.anchorId)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }, 50);
                    }}
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--av-muted)]">
                      {h.category}
                    </span>
                    <span className="block font-medium text-[var(--av-text)]">{h.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          const next = SETTINGS_TABS.includes(v as SettingsTab) ? v : "playback";
          setSearchParams({ tab: next }, { replace: true });
        }}
        className="w-full min-h-[40rem]"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 items-stretch gap-1.5 rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] p-1.5 sm:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="playback" className={settingsTabTriggerClassName}>
            Playback
          </TabsTrigger>
          <TabsTrigger value="appearance" className={settingsTabTriggerClassName}>
            <Palette className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="language" className={settingsTabTriggerClassName}>
            Language
          </TabsTrigger>
          <TabsTrigger value="translation" className={settingsTabTriggerClassName}>
            Translation
          </TabsTrigger>
          <TabsTrigger value="updates" className={settingsTabTriggerClassName}>
            Updates
          </TabsTrigger>
          <TabsTrigger value="data" className={settingsTabTriggerClassName}>
            <Database className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playback" className={settingsTabContentClassName}>
          <div
            id="settings-volume"
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 scroll-mt-28"
          >
            <div>
              <span className="text-sm font-medium text-[var(--av-muted)]">Default volume</span>
              <p className="mt-1 text-xs text-[var(--av-muted-foreground)]">
                Applied when opening the player
              </p>
            </div>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              className="h-11 w-full max-w-[8rem] rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm tabular-nums sm:w-28"
              value={cfg.volumeDefault}
              onChange={(e) =>
                void persist({ volumeDefault: Number.parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div
            id="settings-prefetch"
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 scroll-mt-28"
          >
            <div>
              <span className="text-sm font-medium text-[var(--av-muted)]">Prefetch next episode</span>
              <p className="mt-1 text-xs text-[var(--av-muted-foreground)]">Resolve metadata when idle</p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 rounded border border-[var(--av-border)] accent-zinc-400"
              checked={cfg.prefetchNextEpisode}
              onChange={(e) => void persist({ prefetchNextEpisode: e.target.checked })}
            />
          </div>
          <div
            id="settings-autoplay"
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 scroll-mt-28"
          >
            <div>
              <span className="text-sm font-medium text-[var(--av-muted)]">Auto-play next episode</span>
              <p className="mt-1 text-xs text-[var(--av-muted-foreground)]">
                After one episode ends, show a short countdown then continue the series
              </p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 rounded border border-[var(--av-border)] accent-zinc-400"
              checked={cfg.autoPlayNextEpisode}
              onChange={(e) => void persist({ autoPlayNextEpisode: e.target.checked })}
            />
          </div>

          <div className="border-t border-[var(--av-border)] pt-6">
            <p className="mb-4 text-sm font-semibold text-[var(--av-text)]">Player</p>
            <div className="space-y-5">
              <div
                id="settings-native-controls"
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 scroll-mt-28"
              >
                <div>
                  <span className="text-sm font-medium text-[var(--av-muted)]">Native video controls</span>
                  <p className="mt-1 text-xs text-[var(--av-muted-foreground)]">
                    Browser controls vs custom bar (when off)
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 rounded border border-[var(--av-border)] accent-zinc-400"
                  checked={cfg.useNativeVideoControls}
                  onChange={(e) => void persist({ useNativeVideoControls: e.target.checked })}
                />
              </div>
              <div
                id="settings-seek"
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between scroll-mt-28"
              >
                <span className="text-sm text-[var(--av-muted-foreground)]">Seek step (keyboard)</span>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  step={1}
                  className="h-11 w-full rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm sm:w-28"
                  value={cfg.playerSeekStepSec}
                  onChange={(e) =>
                    void persist({
                      playerSeekStepSec: Math.min(
                        120,
                        Math.max(1, Number.parseInt(e.target.value, 10) || 5)
                      ),
                    })
                  }
                />
              </div>
              <div
                id="settings-speed"
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between scroll-mt-28"
              >
                <span className="text-sm text-[var(--av-muted-foreground)]">Default speed</span>
                <Select
                  value={String(cfg.defaultPlaybackSpeed)}
                  onValueChange={(v) => void persist({ defaultPlaybackSpeed: Number.parseFloat(v) })}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        {r}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div
                id="settings-skip-intro"
                className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between scroll-mt-28"
              >
                <div>
                  <span className="text-sm text-[var(--av-muted-foreground)]">
                    {t("settings.playbackSkipIntro")}
                  </span>
                  <p className="mt-1 text-xs text-[var(--av-muted-foreground)]">
                    {t("settings.playbackSkipIntroHelp")}
                  </p>
                </div>
                <Input
                  type="number"
                  min={15}
                  max={300}
                  step={5}
                  className="h-11 w-full rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm tabular-nums sm:w-28"
                  value={cfg.skipIntroSeconds ?? 90}
                  onChange={(e) =>
                    void persist({
                      skipIntroSeconds: Math.min(
                        300,
                        Math.max(15, Number.parseInt(e.target.value, 10) || 90)
                      ),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div id="settings-server" className="border-t border-[var(--av-border)] pt-6 scroll-mt-28">
            <p className="mb-3 text-sm font-semibold text-[var(--av-text)]">Server</p>
            <p className="mb-3 text-xs text-[var(--av-muted-foreground)]">
              Cloud account and optional features use this API base (local AniVault companion server by default).
            </p>
            <Input
              className="h-11 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] font-mono text-sm"
              value={cfg.apiBaseUrl}
              onChange={(e) => void persist({ apiBaseUrl: e.target.value.trim() })}
            />
          </div>
        </TabsContent>

        <TabsContent value="appearance" className={settingsTabContentClassName}>
          <div id="settings-chroma" className="space-y-3 scroll-mt-28">
            <span className="text-sm font-medium text-[var(--av-muted)]">Color emphasis</span>
            <p className="text-xs text-[var(--av-muted-foreground)]">
              Full keeps poster colors; Monochrome uses grayscale on thumbnails and cards (not the video
              player).
            </p>
            <Select
              value={cfg.chromaticEmphasis}
              onValueChange={(v) =>
                void persist({ chromaticEmphasis: v as AnivaultStoreSchema["chromaticEmphasis"] })
              }
            >
              <SelectTrigger className="h-12 w-full max-w-md rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full color</SelectItem>
                <SelectItem value="mono">Monochrome UI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div id="settings-shell" className="space-y-3 scroll-mt-28">
            <span className="text-sm font-medium text-[var(--av-muted)]">Shell theme</span>
            <p className="text-xs text-[var(--av-muted-foreground)]">
              Background and surface balance. Light/dark still follows the title bar theme toggle.
            </p>
            <Select
              value={cfg.shellPreset}
              onValueChange={(v) =>
                void persist({ shellPreset: v as AnivaultStoreSchema["shellPreset"] })
              }
            >
              <SelectTrigger className="h-12 w-full max-w-md rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="midnight">Midnight (default)</SelectItem>
                <SelectItem value="charcoal">Charcoal</SelectItem>
                <SelectItem value="slate">Slate</SelectItem>
                <SelectItem value="paper">Ink</SelectItem>
                <SelectItem value="ember">Ember</SelectItem>
                <SelectItem value="ocean">Ocean</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div id="settings-mature" className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 scroll-mt-28">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div>
                <span className="text-sm font-medium text-[var(--av-text)]">Allow mature (18+) content</span>
                <p className="mt-1 text-xs text-[var(--av-muted-foreground)]">
                  When off, ecchi and adult-tagged series are hidden from grids and details stay gated.
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 shrink-0 rounded border border-[var(--av-border)] accent-amber-500"
                checked={cfg.allowMatureContent ?? false}
                onChange={(e) => void persist({ allowMatureContent: e.target.checked })}
              />
            </div>
          </div>

          <div id="settings-density" className="space-y-3 scroll-mt-28">
            <span className="text-sm font-medium text-[var(--av-muted)]">UI density</span>
            <p className="text-xs text-[var(--av-muted-foreground)]">
              Controls spacing and padding across lists, cards, and the shell.
            </p>
            <Select
              value={cfg.uiDensity}
              onValueChange={(v) =>
                void persist({ uiDensity: v as AnivaultStoreSchema["uiDensity"] })
              }
            >
              <SelectTrigger className="h-12 w-full max-w-md rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-[var(--av-border)]/80 bg-[var(--av-bg)]/40 p-5">
            <p className="text-sm font-semibold text-[var(--av-text)]">Visual polish (always on)</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--av-muted-foreground)]">
              Smooth cursor animation and shell blur effects are built into this build for a consistent
              HiAnime-style experience. Clicks still register at the system pointer — the custom graphic
              follows for display only.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--av-muted)]">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--av-accent)]" />
                <span>
                  <span className="font-medium text-[var(--av-text)]">Smooth cursor</span> — white branded
                  pointer with eased motion
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--av-accent)]" />
                <span>
                  <span className="font-medium text-[var(--av-text)]">Shell visual effects</span> — frosted
                  title bar, sidebar, and overlays
                </span>
              </li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="language" className={settingsTabContentClassName}>
          <div id="settings-language" className="space-y-3 scroll-mt-28">
            <span className="text-sm font-medium text-[var(--av-muted)]">App language</span>
            <Select
              value={i18n.language}
              onValueChange={(lng) => {
                void i18n.changeLanguage(lng);
                localStorage.setItem("i18nLng", lng);
              }}
            >
              <SelectTrigger className="h-12 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="translation" className={settingsTabContentClassName}>
          <div id="settings-translation-provider" className="space-y-3 scroll-mt-28">
            <span className="text-sm font-medium text-[var(--av-muted)]">Provider</span>
            <Select
              value={cfg.translationProvider}
              onValueChange={(v) =>
                void persist({ translationProvider: v as AnivaultStoreSchema["translationProvider"] })
              }
            >
              <SelectTrigger className="h-12 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="deepl">DeepL (API key)</SelectItem>
                <SelectItem value="google">Google Cloud Translate (API key)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div id="settings-translation-key" className="space-y-3 scroll-mt-28">
            <span className="text-sm font-medium text-[var(--av-muted)]">API key (stored locally)</span>
            <Input
              type="password"
              className="h-11 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] font-mono text-sm"
              placeholder="••••••••"
              value={cfg.translationApiKey}
              onChange={(e) => void persist({ translationApiKey: e.target.value })}
            />
          </div>
          <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
            When using {APP_DISPLAY_NAME} with a signed-in account, server-side translation may use the
            server&apos;s DeepL key if configured. Keys you enter here stay on this device only.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-[var(--av-border)] px-5 text-sm"
            onClick={() => {
              void (async () => {
                try {
                  const out = await translateText(
                    `Hello from ${APP_DISPLAY_NAME}`,
                    i18n.language || "en-US",
                    cfg.translationProvider,
                    cfg.translationApiKey
                  );
                  setTranslateSample(out);
                } catch (e) {
                  setTranslateSample(e instanceof Error ? e.message : "Error");
                }
              })();
            }}
          >
            Test translation
          </Button>
          {translateSample ? (
            <p className="text-sm text-[var(--av-muted)]">{translateSample}</p>
          ) : null}
        </TabsContent>

        <TabsContent value="updates" className={settingsTabContentClassName}>
          <div id="settings-updates" className="space-y-2 scroll-mt-28">
            <span className="text-sm font-medium text-[var(--av-muted)]">App version</span>
            <p className="text-base tabular-nums text-[var(--av-muted-foreground)]">{appVersion || "—"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-5 text-sm uppercase transition-transform active:scale-[0.98]"
              onClick={() => {
                setUpdateMsg(null);
                void window.app.checkElectronUpdates().then((r) => {
                  if (r.kind === "skipped") {
                    setUpdateMsg("Auto-update runs in installed builds only.");
                  } else if (r.kind === "ok") {
                    if (r.isUpdateAvailable && r.version) {
                      setUpdateMsg(
                        `Update available: v${r.version} (you have v${r.currentVersion}). Download runs in the background; restart when prompted.`
                      );
                    } else {
                      setUpdateMsg(`Up to date (v${r.currentVersion}).`);
                    }
                  } else {
                    const m = r.message;
                    if (/404|latest\.yml|Not Found/i.test(m)) {
                      setUpdateMsg(
                        "No updater metadata on GitHub yet (expected until you publish releases with latest.yml). You can ignore this for now."
                      );
                    } else {
                      setUpdateMsg(m);
                    }
                  }
                });
              }}
            >
              Check for updates
            </Button>
          </div>
          {updateMsg ? (
            <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">{updateMsg}</p>
          ) : null}
          <div className="space-y-3">
            <span className="text-sm font-medium text-[var(--av-muted)]">Update logs</span>
            <pre className="max-h-80 overflow-auto rounded-xl border border-[var(--av-border)] bg-[var(--av-bg)] p-4 text-xs leading-relaxed text-[var(--av-muted-foreground)] whitespace-pre-wrap font-mono">
              {updateLogsText.trim()}
            </pre>
          </div>
          <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
            Background update polling is off by default. After you publish GitHub Releases with
            NSIS/electron-updater assets, set <code className="font-mono">ANIVAULT_AUTO_UPDATE=1</code>{" "}
            to enable. Manual &quot;Check for updates&quot; may show a message until{" "}
            <code className="font-mono">latest.yml</code> exists. Restart still applies downloads.
          </p>
          <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
            <span className="font-medium text-[var(--av-muted)]">How to test auto-update:</span> install an{" "}
            <span className="font-medium">older</span> release from GitHub, then publish a{" "}
            <span className="font-medium">newer</span> one (same repo) that includes{" "}
            <code className="font-mono">latest.yml</code> and <code className="font-mono">AniVaultUnvaultedSetup.exe</code>{" "}
            from CI.
            In the old build, open Settings → Check for updates. For detailed logs, launch the installed{" "}
            <code className="font-mono">anivault-unvaulted.exe</code> from a terminal with{" "}
            <code className="font-mono">set ANIVAULT_UPDATER_DEBUG=1</code> (Windows).
          </p>
        </TabsContent>

        <TabsContent value="data" className={settingsTabContentClassName}>
          <section id="settings-data-backup" className="space-y-3 scroll-mt-28">
            <h3 className="text-sm font-semibold text-[var(--av-text)]">{t("settings.dataBackupTitle")}</h3>
            <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
              {t("settings.dataBackupLead")}{" "}
              <Link className="font-medium text-[var(--av-accent)] underline-offset-2 hover:underline" to="/lists">
                {t("lists.title")}
              </Link>{" "}
              {t("settings.dataBackupTrail")}
            </p>
          </section>

          <section
            id="settings-data-downloads"
            className="mt-8 space-y-3 border-t border-[var(--av-border)] pt-8 scroll-mt-28"
          >
            <h3 className="text-sm font-semibold text-[var(--av-text)]">{t("settings.dataDownloadsTitle")}</h3>
            <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
              {t("settings.dataDownloadsBody")}
            </p>
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--av-border)]/80 bg-[var(--av-bg)]/30 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-[var(--av-muted)]">{t("settings.offlineDownloads")}</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 rounded border border-[var(--av-border)] accent-[var(--av-accent)]"
                  checked={cfg.offlineDownloadsEnabled ?? false}
                  onChange={(e) => void persist({ offlineDownloadsEnabled: e.target.checked })}
                />
              </div>
              <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
                {t("settings.offlineDownloadsHelp")}
              </p>
              {cfg.offlineDownloadsEnabled ? (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 rounded-xl border-[var(--av-border)]"
                      onClick={() => {
                        if (!window.app?.pickDownloadsFolder) return;
                        void window.app.pickDownloadsFolder().then((p) => {
                          if (p) void persist({ offlineDownloadsPath: p });
                        });
                      }}
                    >
                      {t("settings.offlineDownloadsChoose")}
                    </Button>
                    {cfg.offlineDownloadsPath ? (
                      <>
                        <span className="text-xs text-[var(--av-muted)]">
                          {t("settings.offlineDownloadsPath")}:{" "}
                          <code className="break-all font-mono text-[11px] text-[var(--av-text)]">
                            {cfg.offlineDownloadsPath}
                          </code>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 text-xs"
                          onClick={() => void persist({ offlineDownloadsPath: "" })}
                        >
                          {t("settings.offlineDownloadsClear")}
                        </Button>
                      </>
                    ) : null}
                  </div>
                  {cfg.offlineDownloadsPath ? (
                    <div
                      id="settings-offline-queue"
                      className="mt-4 space-y-3 border-t border-[var(--av-border)]/60 pt-4 scroll-mt-28"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--av-muted)]">
                          {t("settings.offlineQueueTitle")}
                        </h4>
                        {offlineQueue.some((i) => i.status === "complete") ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                              void window.offlineDownloads.clearCompleted().then(refreshOfflineQueue);
                            }}
                          >
                            {t("settings.offlineQueueClearDone")}
                          </Button>
                        ) : null}
                      </div>
                      {offlineQueue.length === 0 ? (
                        <p className="text-xs text-[var(--av-muted-foreground)]">
                          {t("settings.offlineQueueEmpty")}
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {offlineQueue.map((row) => (
                            <li
                              key={row.id}
                              className="flex flex-col gap-2 rounded-xl border border-[var(--av-border)]/60 bg-[var(--av-bg)]/40 p-3 sm:flex-row sm:items-start sm:justify-between"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-[var(--av-text)]">
                                  {row.showName}{" "}
                                  <span className="text-[var(--av-muted)]">· {row.episode}</span>{" "}
                                  <span className="text-[11px] uppercase text-[var(--av-muted)]">
                                    {row.mode}
                                  </span>
                                </p>
                                <p className="mt-1 text-[11px] text-[var(--av-muted-foreground)]">
                                  {row.status === "queued" && t("settings.offlineStatusQueued")}
                                  {row.status === "downloading" && t("settings.offlineStatusDownloading")}
                                  {row.status === "complete" && t("settings.offlineStatusComplete")}
                                  {row.status === "failed" && t("settings.offlineStatusFailed")}
                                </p>
                                {row.error ? (
                                  <p className="mt-1 text-[11px] leading-snug text-amber-600/95 dark:text-amber-400/95">
                                    {row.error}
                                  </p>
                                ) : null}
                                {row.status === "complete" && row.localPath ? (
                                  <p className="mt-1 break-all font-mono text-[10px] text-[var(--av-muted)]">
                                    {row.localPath}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex shrink-0 flex-wrap gap-2">
                                {row.status === "failed" ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-lg text-xs"
                                    onClick={() => {
                                      void window.offlineDownloads.retry(row.id).then((r) => {
                                        if (r.ok) refreshOfflineQueue();
                                      });
                                    }}
                                  >
                                    {t("settings.offlineQueueRetry")}
                                  </Button>
                                ) : null}
                                {row.status === "complete" && row.localPath ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-lg px-2"
                                    title={t("settings.offlineQueueReveal")}
                                    onClick={() => {
                                      const p = row.localPath;
                                      if (p) void window.offlineDownloads.reveal(p);
                                    }}
                                  >
                                    <FolderOpen className="h-3.5 w-3.5" aria-hidden />
                                  </Button>
                                ) : null}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs"
                                  disabled={row.status === "downloading"}
                                  onClick={() => {
                                    void window.offlineDownloads.remove(row.id).then((r) => {
                                      if (r.ok) refreshOfflineQueue();
                                    });
                                  }}
                                >
                                  {t("settings.offlineQueueRemove")}
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </section>

          <section
            id="settings-telemetry"
            className="mt-8 space-y-3 border-t border-[var(--av-border)] pt-8 scroll-mt-28"
          >
            <h3 className="text-sm font-semibold text-[var(--av-text)]">{t("settings.telemetryTitle")}</h3>
            <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">{t("settings.telemetryBody")}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <span className="text-sm font-medium text-[var(--av-muted)]">{t("settings.telemetryCheckbox")}</span>
              <input
                type="checkbox"
                className="h-5 w-5 shrink-0 rounded border border-[var(--av-border)] accent-[var(--av-accent)]"
                checked={cfg.telemetryOptIn ?? false}
                onChange={(e) => void persist({ telemetryOptIn: e.target.checked })}
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-[var(--av-muted)]">{t("settings.telemetryEndpoint")}</span>
              <p className="text-xs text-[var(--av-muted-foreground)]">{t("settings.telemetryEndpointHelp")}</p>
              <Input
                className="h-11 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] font-mono text-sm"
                placeholder="https://…"
                value={cfg.telemetryEndpoint ?? ""}
                onChange={(e) => void persist({ telemetryEndpoint: e.target.value.trim() })}
              />
            </div>
          </section>

          <section
            id="settings-data-api"
            className="mt-8 space-y-3 border-t border-[var(--av-border)] pt-8 scroll-mt-28"
          >
            <h3 className="text-sm font-semibold text-[var(--av-text)]">{t("settings.dataApiTitle")}</h3>
            <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
              {t("settings.dataApiBody")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl border-[var(--av-border)] px-5 text-sm"
                disabled={connBusy}
                onClick={() => {
                  setConnMsg(null);
                  setConnBusy(true);
                  void testAnivaultServerConnection()
                    .then((r) => {
                      setConnMsg(`${r.ok ? "OK" : "Error"}: ${r.message}`);
                    })
                    .finally(() => setConnBusy(false));
                }}
              >
                {connBusy ? t("settings.testingConnection") : t("settings.testConnection")}
              </Button>
            </div>
            {connMsg ? (
              <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]" role="status">
                {connMsg}
              </p>
            ) : null}
          </section>
        </TabsContent>
      </Tabs>

      {saved ? (
        <p className="text-center text-sm tracking-wide text-[var(--av-muted)]">{t("settings.saved")}</p>
      ) : null}
    </div>
  );
}
