import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/renderer/components/ui/select";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";
import React from "react";

import type { PersistConfig } from "./settings-types";

type Props = {
  cfg: AnivaultStoreSchema;
  persist: PersistConfig;
};

export function AppearanceSettingsPanel({ cfg, persist }: Props) {
  return (
    <>
      <div id="settings-chroma" className="space-y-3 scroll-mt-28">
        <span className="text-sm font-medium text-[var(--av-muted)]">Color emphasis</span>
        <p className="text-xs text-[var(--av-muted-foreground)]">
          Full keeps poster colors; Monochrome uses grayscale on thumbnails and cards (not the video player).
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
          onValueChange={(v) => void persist({ shellPreset: v as AnivaultStoreSchema["shellPreset"] })}
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
          onValueChange={(v) => void persist({ uiDensity: v as AnivaultStoreSchema["uiDensity"] })}
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
          Smooth cursor animation and shell blur effects are built into this build for a consistent HiAnime-style
          experience. Clicks still register at the system pointer — the custom graphic follows for display only.
        </p>
        <ul className="mt-4 space-y-3 text-sm text-[var(--av-muted)]">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--av-accent)]" />
            <span>
              <span className="font-medium text-[var(--av-text)]">Smooth cursor</span> — white branded pointer with
              eased motion
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--av-accent)]" />
            <span>
              <span className="font-medium text-[var(--av-text)]">Shell visual effects</span> — frosted title bar,
              sidebar, and overlays
            </span>
          </li>
        </ul>
      </div>
    </>
  );
}
