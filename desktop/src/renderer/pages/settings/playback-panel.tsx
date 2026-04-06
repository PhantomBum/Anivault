import { Input } from "@/renderer/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/renderer/components/ui/select";
import { Button } from "@/renderer/components/ui/button";
import { DEFAULT_COMPANION_API_BASE_URL, type AnivaultStoreSchema } from "@/shared/anivault-types";
import React from "react";

import type { PersistConfig, SettingsTranslate } from "./settings-types";

type Props = {
  cfg: AnivaultStoreSchema;
  persist: PersistConfig;
  translate: SettingsTranslate;
};

export function PlaybackSettingsPanel({ cfg, persist, translate }: Props) {
  return (
    <>
      <div
        id="settings-volume"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 scroll-mt-28"
      >
        <div>
          <span className="text-sm font-medium text-[var(--av-muted)]">Default volume</span>
          <p className="mt-1 text-xs text-[var(--av-muted-foreground)]">Applied when opening the player</p>
        </div>
        <Input
          type="number"
          min={0}
          max={1}
          step={0.05}
          className="h-11 w-full max-w-[8rem] rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm tabular-nums sm:w-28"
          value={cfg.volumeDefault}
          onChange={(e) => void persist({ volumeDefault: Number.parseFloat(e.target.value) || 0 })}
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
                  playerSeekStepSec: Math.min(120, Math.max(1, Number.parseInt(e.target.value, 10) || 5)),
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
                {translate("settings.playbackSkipIntro")}
              </span>
              <p className="mt-1 text-xs text-[var(--av-muted-foreground)]">
                {translate("settings.playbackSkipIntroHelp")}
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
                  skipIntroSeconds: Math.min(300, Math.max(15, Number.parseInt(e.target.value, 10) || 90)),
                })
              }
            />
          </div>
          <div
            id="settings-window-always-on-top"
            className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6 scroll-mt-28"
          >
            <div>
              <span className="text-sm font-medium text-[var(--av-muted)]">
                {translate("settings.windowAlwaysOnTop")}
              </span>
              <p className="mt-1 text-xs text-[var(--av-muted-foreground)]">
                {translate("settings.windowAlwaysOnTopHelp")}
              </p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 rounded border border-[var(--av-border)] accent-zinc-400"
              checked={cfg.windowAlwaysOnTop}
              onChange={(e) => void persist({ windowAlwaysOnTop: e.target.checked })}
            />
          </div>
        </div>
      </div>

      <div id="settings-server" className="border-t border-[var(--av-border)] pt-6 scroll-mt-28">
        <p className="mb-3 text-sm font-semibold text-[var(--av-text)]">Server</p>
        <p className="mb-3 text-xs text-[var(--av-muted-foreground)]">
          Cloud account and optional features use this API base (local AniVault companion server by default).
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            className="h-11 flex-1 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] font-mono text-sm"
            value={cfg.apiBaseUrl}
            onChange={(e) => void persist({ apiBaseUrl: e.target.value.trim() })}
            placeholder={DEFAULT_COMPANION_API_BASE_URL}
            aria-label="Companion API base URL"
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 rounded-xl text-xs"
            onClick={() => void persist({ apiBaseUrl: DEFAULT_COMPANION_API_BASE_URL })}
          >
            Use default
          </Button>
        </div>
        <p className="mt-2 text-[10px] text-[var(--av-muted-foreground)]">
          Default: <span className="font-mono">{DEFAULT_COMPANION_API_BASE_URL}</span> — run{" "}
          <span className="font-mono">npm start</span> in the <span className="font-mono">server</span> folder.
        </p>
      </div>
    </>
  );
}
