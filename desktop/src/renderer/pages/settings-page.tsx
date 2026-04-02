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
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { applyUiDensityToShell } from "@/renderer/helpers/ui-density";
import { translateText } from "@/renderer/lib/translation";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";
import updateLogsText from "@/renderer/data/update-logs.txt?raw";

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "pt-BR", label: "Português (BR)" },
];

export function SettingsPage() {
  const { i18n } = useTranslation();
  const [cfg, setCfg] = useState<AnivaultStoreSchema | null>(null);
  const [saved, setSaved] = useState(false);
  const [translateSample, setTranslateSample] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>("");
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

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

  const persist = async (partial: Partial<AnivaultStoreSchema>) => {
    if (!window.anivault) return;
    await window.anivault.setConfig(partial);
    setCfg((c) => (c ? { ...c, ...partial } : c));
    if (partial.uiDensity != null) applyUiDensityToShell(partial.uiDensity);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (!cfg) {
    return (
      <div className="text-sm text-[var(--av-muted)]">Loading settings…</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 text-[var(--av-text)]">
      <div className="border-b border-[var(--av-border)] pb-5">
        <h2 className="text-lg font-bold tracking-tight text-[var(--av-text)]">Settings</h2>
        <p className="mt-1 text-sm text-[var(--av-muted)]">
          Playback · language · translation · updates
        </p>
      </div>

      <Tabs defaultValue="playback" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-[var(--av-border)] bg-[linear-gradient(145deg,#1c1c21_0%,#18181b_55%,#141418_100%)] p-1 sm:grid-cols-4">
          <TabsTrigger
            value="playback"
            className="rounded-xl text-xs transition-all data-[state=active]:bg-[var(--av-accent-muted)] data-[state=active]:text-[var(--av-text)] data-[state=active]:shadow-sm"
          >
            Playback
          </TabsTrigger>
          <TabsTrigger
            value="language"
            className="rounded-xl text-xs transition-all data-[state=active]:bg-[var(--av-accent-muted)] data-[state=active]:text-[var(--av-text)] data-[state=active]:shadow-sm"
          >
            Language
          </TabsTrigger>
          <TabsTrigger
            value="translation"
            className="rounded-xl text-xs transition-all data-[state=active]:bg-[var(--av-accent-muted)] data-[state=active]:text-[var(--av-text)] data-[state=active]:shadow-sm"
          >
            Translation
          </TabsTrigger>
          <TabsTrigger
            value="updates"
            className="rounded-xl text-xs transition-all data-[state=active]:bg-[var(--av-accent-muted)] data-[state=active]:text-[var(--av-text)] data-[state=active]:shadow-sm"
          >
            Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="playback"
          className="mt-6 space-y-4 rounded-2xl border border-[var(--av-border)] bg-[linear-gradient(145deg,#1c1c21_0%,#18181b_55%,#141418_100%)] p-5 shadow-sm transition-shadow"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-[var(--av-muted)]">Default volume</span>
              <p className="text-[10px] text-[var(--av-muted-foreground)]">
                Applied when opening the player
              </p>
            </div>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              className="w-24 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs tabular-nums"
              value={cfg.volumeDefault}
              onChange={(e) =>
                void persist({ volumeDefault: Number.parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-[var(--av-muted)]">Prefetch next episode</span>
              <p className="text-[10px] text-[var(--av-muted-foreground)]">Resolve metadata when idle</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-[var(--av-border)] accent-zinc-400"
              checked={cfg.prefetchNextEpisode}
              onChange={(e) => void persist({ prefetchNextEpisode: e.target.checked })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-[var(--av-muted)]">Auto-play next episode</span>
              <p className="text-[10px] text-[var(--av-muted-foreground)]">
                After one episode ends, show a short countdown then continue the series
              </p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-[var(--av-border)] accent-zinc-400"
              checked={cfg.autoPlayNextEpisode}
              onChange={(e) => void persist({ autoPlayNextEpisode: e.target.checked })}
            />
          </div>

          <div className="border-t border-[var(--av-border)] pt-4">
            <p className="mb-3 text-xs font-medium text-[var(--av-muted)]">Interface</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-[var(--av-muted-foreground)]">UI density</span>
              <Select
                value={cfg.uiDensity}
                onValueChange={(v) =>
                  void persist({ uiDensity: v as AnivaultStoreSchema["uiDensity"] })
                }
              >
                <SelectTrigger className="w-full rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-[var(--av-border)] pt-4">
            <p className="mb-3 text-xs font-medium text-[var(--av-muted)]">Player</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-[var(--av-muted)]">Native video controls</span>
                  <p className="text-[10px] text-[var(--av-muted-foreground)]">
                    Browser controls vs custom bar (when off)
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-[var(--av-border)] accent-zinc-400"
                  checked={cfg.useNativeVideoControls}
                  onChange={(e) => void persist({ useNativeVideoControls: e.target.checked })}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-[var(--av-muted-foreground)]">Seek step (keyboard)</span>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  step={1}
                  className="w-full rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs sm:w-24"
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-[var(--av-muted-foreground)]">Default speed</span>
                <Select
                  value={String(cfg.defaultPlaybackSpeed)}
                  onValueChange={(v) => void persist({ defaultPlaybackSpeed: Number.parseFloat(v) })}
                >
                  <SelectTrigger className="w-full rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs sm:w-36">
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
            </div>
          </div>

          <div className="border-t border-[var(--av-border)] pt-4">
            <p className="mb-3 text-xs font-medium text-[var(--av-muted)]">Server</p>
            <p className="mb-2 text-[10px] text-[var(--av-muted-foreground)]">
              Cloud account and optional features use this API base (local AniVault server by default).
            </p>
            <Input
              className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] font-mono text-xs"
              value={cfg.apiBaseUrl}
              onChange={(e) => void persist({ apiBaseUrl: e.target.value.trim() })}
            />
          </div>
        </TabsContent>

        <TabsContent
          value="language"
          className="mt-6 space-y-4 rounded-2xl border border-[var(--av-border)] bg-[linear-gradient(145deg,#1c1c21_0%,#18181b_55%,#141418_100%)] p-5 shadow-sm"
        >
          <div className="space-y-2">
            <span className="text-xs font-medium text-[var(--av-muted)]">App language</span>
            <Select
              value={i18n.language}
              onValueChange={(lng) => {
                void i18n.changeLanguage(lng);
                localStorage.setItem("i18nLng", lng);
              }}
            >
              <SelectTrigger className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs">
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

        <TabsContent
          value="translation"
          className="mt-6 space-y-4 rounded-2xl border border-[var(--av-border)] bg-[linear-gradient(145deg,#1c1c21_0%,#18181b_55%,#141418_100%)] p-5 shadow-sm"
        >
          <div className="space-y-2">
            <span className="text-xs font-medium text-[var(--av-muted)]">Provider</span>
            <Select
              value={cfg.translationProvider}
              onValueChange={(v) =>
                void persist({ translationProvider: v as AnivaultStoreSchema["translationProvider"] })
              }
            >
              <SelectTrigger className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="deepl">DeepL (API key)</SelectItem>
                <SelectItem value="google">Google Cloud Translate (API key)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-[var(--av-muted)]">API key (stored locally)</span>
            <Input
              type="password"
              className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] font-mono text-xs"
              placeholder="••••••••"
              value={cfg.translationApiKey}
              onChange={(e) => void persist({ translationApiKey: e.target.value })}
            />
          </div>
          <p className="text-[10px] leading-relaxed text-[var(--av-muted-foreground)]">
            When using AniVault Cloud with a signed-in account, server-side translation may use the
            server&apos;s DeepL key if configured. Keys you enter here stay on this device only.
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-[var(--av-border)] text-xs"
            onClick={() => {
              void (async () => {
                try {
                  const out = await translateText(
                    "Hello from AniVault",
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
            <p className="text-[10px] text-[var(--av-muted)]">{translateSample}</p>
          ) : null}
        </TabsContent>

        <TabsContent
          value="updates"
          className="mt-6 space-y-5 rounded-2xl border border-[var(--av-border)] bg-[linear-gradient(145deg,#1c1c21_0%,#18181b_55%,#141418_100%)] p-5 shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-xs font-medium text-[var(--av-muted)]">App version</span>
            <p className="text-sm tabular-nums text-[var(--av-muted-foreground)]">{appVersion || "—"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl text-xs uppercase transition-transform active:scale-[0.98]"
              onClick={() => {
                setUpdateMsg(null);
                void window.app.checkElectronUpdates().then((r) => {
                  if (r.kind === "skipped") {
                    setUpdateMsg("Auto-update runs in installed builds only.");
                  } else if (r.kind === "ok") {
                    setUpdateMsg(
                      r.version
                        ? `Checking… channel reports v${r.version} (download may be in progress).`
                        : "Update check sent."
                    );
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
            <p className="text-[10px] leading-relaxed text-[var(--av-muted-foreground)]">{updateMsg}</p>
          ) : null}
          <div className="space-y-2">
            <span className="text-xs font-medium text-[var(--av-muted)]">Update logs</span>
            <pre className="max-h-48 overflow-auto rounded-xl border border-[var(--av-border)] bg-[var(--av-bg)] p-3 text-[10px] leading-relaxed text-[var(--av-muted-foreground)] whitespace-pre-wrap font-mono">
              {updateLogsText.trim()}
            </pre>
          </div>
          <p className="text-[10px] leading-relaxed text-[var(--av-muted-foreground)]">
            Background update polling is off by default. After you publish GitHub Releases with
            Squirrel/electron-updater files, set <code className="font-mono">ANIVAULT_AUTO_UPDATE=1</code>{" "}
            to enable. Manual &quot;Check for updates&quot; may show a message until{" "}
            <code className="font-mono">latest.yml</code> exists. Restart still applies downloads.
          </p>
        </TabsContent>
      </Tabs>

      {saved ? (
        <p className="text-center text-[10px] tracking-wide text-[var(--av-muted)]">Saved</p>
      ) : null}
    </div>
  );
}
