import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/renderer/components/ui/tabs";
import { useAnivaultConfig } from "@/renderer/context/anivault-config-context";
import { applyShellAppearance } from "@/renderer/helpers/shell-appearance";
import { applyUiDensityToShell } from "@/renderer/helpers/ui-density";
import { showToast } from "@/renderer/lib/av-toast";
import {
  SETTINGS_TABS,
  filterSettingsSearch,
  type SettingsTab,
} from "@/renderer/lib/settings-search-index";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";
import type { OfflineDownloadItem } from "@/shared/offline-downloads-types";
import { Copy, Database, Keyboard, Palette, Search, Shield, Sparkles } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearchParams } from "react-router-dom";

import { AppearanceSettingsPanel } from "./settings/appearance-panel";
import { DataSettingsPanel } from "./settings/data-panel";
import { LabsSettingsPanel } from "./settings/labs-panel";
import { LanguageSettingsPanel } from "./settings/language-panel";
import { PlaybackSettingsPanel } from "./settings/playback-panel";
import { PrivacySettingsPanel } from "./settings/privacy-panel";
import { settingsTabContentClassName, settingsTabTriggerClassName } from "./settings/settings-constants";
import { ShortcutsSettingsPanel } from "./settings/shortcuts-panel";
import { TranslationSettingsPanel } from "./settings/translation-panel";
import { UpdatesSettingsPanel } from "./settings/updates-panel";

const SETTINGS_LAST_TAB_KEY = "anivault-settings-last-tab";

export function SettingsPage() {
  const { i18n, t: translate } = useTranslation();
  const { refresh } = useAnivaultConfig();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") ?? "";
  const findFieldRef = useRef<HTMLInputElement | null>(null);
  const findWrapRef = useRef<HTMLDivElement | null>(null);

  const activeTab = useMemo((): SettingsTab => {
    if (SETTINGS_TABS.includes(tabParam as SettingsTab)) {
      return tabParam as SettingsTab;
    }
    try {
      const stored = sessionStorage.getItem(SETTINGS_LAST_TAB_KEY);
      if (stored && SETTINGS_TABS.includes(stored as SettingsTab)) {
        return stored as SettingsTab;
      }
    } catch {
      /* ignore */
    }
    return "playback";
  }, [tabParam]);

  const [cfg, setCfg] = useState<AnivaultStoreSchema | null>(null);
  const [saved, setSaved] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");
  const [findQuery, setFindQuery] = useState("");
  const [connMsg, setConnMsg] = useState<string | null>(null);
  const [connBusy, setConnBusy] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineDownloadItem[]>([]);

  const searchHits = useMemo(() => filterSettingsSearch(findQuery), [findQuery]);

  useEffect(() => {
    if (SETTINGS_TABS.includes(tabParam as SettingsTab)) return;
    try {
      const stored = sessionStorage.getItem(SETTINGS_LAST_TAB_KEY);
      if (stored && SETTINGS_TABS.includes(stored as SettingsTab)) {
        setSearchParams({ tab: stored }, { replace: true });
      }
    } catch {
      /* ignore */
    }
  }, [tabParam, setSearchParams]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SETTINGS_LAST_TAB_KEY, activeTab);
    } catch {
      /* ignore */
    }
  }, [activeTab]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!findWrapRef.current) return;
      if (e.target instanceof Node && !findWrapRef.current.contains(e.target)) {
        setFindQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "," && !e.ctrlKey && !e.metaKey) {
        const el = e.target;
        if (
          el instanceof HTMLElement &&
          (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
        ) {
          return;
        }
        if (location.pathname !== "/settings") return;
        e.preventDefault();
        const i = SETTINGS_TABS.indexOf(activeTab);
        const next = SETTINGS_TABS[(i + 1) % SETTINGS_TABS.length];
        setSearchParams({ tab: next }, { replace: true });
        return;
      }
      if (e.key === "Escape") {
        setFindQuery("");
        return;
      }
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target;
      if (
        el instanceof HTMLElement &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
      ) {
        return;
      }
      if (location.pathname !== "/settings") return;
      e.preventDefault();
      findFieldRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [location.pathname, activeTab, setSearchParams]);

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

  const refreshOfflineQueue = useCallback(() => {
    void window.offlineDownloads.list().then(setOfflineQueue);
  }, []);

  useEffect(() => {
    if (!cfg?.offlineDownloadsEnabled) {
      setOfflineQueue([]);
      return;
    }
    const tick = () => {
      refreshOfflineQueue();
    };
    tick();
    const timer = window.setInterval(tick, 2800);
    return () => window.clearInterval(timer);
  }, [cfg?.offlineDownloadsEnabled, refreshOfflineQueue]);

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
    return <div className="text-sm text-[var(--av-muted)]">{translate("settings.loading")}</div>;
  }

  return (
    <div className="relative mx-auto max-w-5xl space-y-6 px-2 pb-12 text-[var(--av-text)] md:px-3">
      <div
        className="pointer-events-none absolute inset-x-0 -top-6 h-48 rounded-[40%] bg-[radial-gradient(ellipse_90%_80%_at_50%_0%,rgba(99,102,241,0.14),transparent_65%)] opacity-90 md:h-56"
        aria-hidden
      />
      <div className="av-surface-raised relative overflow-hidden rounded-2xl border border-[var(--av-border)]/85 p-6 md:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl"
          aria-hidden
        />
        <div className="relative">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--av-text)] md:text-[1.75rem]">
          {translate("settings.title")}
        </h2>
        <p className="mt-2 text-base text-[var(--av-muted)]">{translate("settings.subtitle")}</p>
        <p className="mt-1 text-[11px] text-[var(--av-muted-foreground)]">{translate("settings.findShortcutHint")}</p>
        <div className="mt-4 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-start">
          <div ref={findWrapRef} className="relative min-w-0 flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--av-muted)]"
              aria-hidden
            />
            <Input
              ref={findFieldRef}
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder={translate("settings.findPlaceholder")}
              className="h-11 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] pl-10 pr-3 text-sm"
              aria-label={translate("settings.findAria")}
              autoComplete="off"
            />
            {searchHits.length > 0 ? (
              <ul
                className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] py-1 shadow-av-lg"
                role="listbox"
                aria-label={translate("settings.findAria")}
              >
                <li
                  role="presentation"
                  className="border-b border-[var(--av-border)]/50 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--av-muted)]"
                >
                  {translate("settings.findMatches", { count: searchHits.length })}
                </li>
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
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 gap-2 rounded-xl border-[var(--av-border)] px-4 text-sm"
            onClick={() => {
              try {
                const u = new URL(window.location.href);
                const rawHash = u.hash || "#/settings";
                const withoutHash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
                const [pathOnly, q] = withoutHash.split("?");
                const params = new URLSearchParams(q ?? "");
                params.set("tab", activeTab);
                const rebuilt = `${u.origin}${u.pathname}${u.search}#${pathOnly}?${params.toString()}`;
                void navigator.clipboard.writeText(rebuilt).then(() => {
                  showToast(translate("settings.toastLinkCopied"));
                });
              } catch {
                showToast(translate("settings.toastLinkCopied"), 2800);
              }
            }}
          >
            <Copy className="h-4 w-4 opacity-90" aria-hidden />
            {translate("settings.copyLink")}
          </Button>
        </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          const next = SETTINGS_TABS.includes(v as SettingsTab) ? v : "playback";
          setSearchParams({ tab: next }, { replace: true });
        }}
        className="w-full min-h-0"
      >
        <TabsList className="flex h-auto w-full flex-wrap items-stretch gap-1 rounded-2xl border border-[var(--av-border)]/80 bg-gradient-to-br from-indigo-500/[0.07] via-[var(--av-surface)]/95 to-cyan-500/[0.06] p-1.5 shadow-inner shadow-black/20 backdrop-blur-md">
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
          <TabsTrigger value="shortcuts" className={settingsTabTriggerClassName}>
            <Keyboard className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {translate("settings.tabShortcuts")}
          </TabsTrigger>
          <TabsTrigger value="updates" className={settingsTabTriggerClassName}>
            Updates
          </TabsTrigger>
          <TabsTrigger value="data" className={settingsTabTriggerClassName}>
            <Database className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Data
          </TabsTrigger>
          <TabsTrigger value="privacy" className={settingsTabTriggerClassName}>
            <Shield className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {translate("settings.tabPrivacy")}
          </TabsTrigger>
          <TabsTrigger value="labs" className={settingsTabTriggerClassName}>
            <Sparkles className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Studio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playback" className={settingsTabContentClassName}>
          <PlaybackSettingsPanel cfg={cfg} persist={persist} translate={translate} />
        </TabsContent>

        <TabsContent value="appearance" className={settingsTabContentClassName}>
          <AppearanceSettingsPanel cfg={cfg} persist={persist} />
        </TabsContent>

        <TabsContent value="language" className={settingsTabContentClassName}>
          <LanguageSettingsPanel i18n={i18n} />
        </TabsContent>

        <TabsContent value="translation" className={settingsTabContentClassName}>
          <TranslationSettingsPanel cfg={cfg} persist={persist} i18n={i18n} />
        </TabsContent>

        <TabsContent value="shortcuts" className={settingsTabContentClassName}>
          <ShortcutsSettingsPanel translate={translate} />
        </TabsContent>

        <TabsContent value="updates" className={settingsTabContentClassName}>
          <UpdatesSettingsPanel appVersion={appVersion} translate={translate} />
        </TabsContent>

        <TabsContent value="data" className={settingsTabContentClassName}>
          <DataSettingsPanel
            cfg={cfg}
            persist={persist}
            translate={translate}
            offlineQueue={offlineQueue}
            refreshOfflineQueue={refreshOfflineQueue}
            connMsg={connMsg}
            setConnMsg={setConnMsg}
            connBusy={connBusy}
            setConnBusy={setConnBusy}
          />
        </TabsContent>

        <TabsContent value="privacy" className={settingsTabContentClassName}>
          <PrivacySettingsPanel cfg={cfg} persist={persist} translate={translate} />
        </TabsContent>

        <TabsContent value="labs" className={settingsTabContentClassName}>
          <LabsSettingsPanel translate={translate} />
        </TabsContent>
      </Tabs>

      {saved ? (
        <p className="text-center text-sm tracking-wide text-[var(--av-muted)]" aria-live="polite">
          {translate("settings.saved")}
        </p>
      ) : null}
    </div>
  );
}
