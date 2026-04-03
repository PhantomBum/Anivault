import { AvFutureSurface } from "@/renderer/components/av-future-surface";
import { Sparkles } from "lucide-react";
import React from "react";

import type { SettingsTranslate } from "./settings-types";

type Props = {
  translate: SettingsTranslate;
};

export function LabsSettingsPanel({ translate }: Props) {
  return (
    <AvFutureSurface variant="studio" id="settings-labs" className="scroll-mt-28 p-8">
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--av-border)] bg-[var(--av-bg)]/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--av-muted)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--av-accent)]" aria-hidden />
          {translate("settings.labsKicker")}
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-[var(--av-text)]">{translate("settings.labsTitle")}</h3>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--av-muted-foreground)]">
          {translate("settings.labsBody")}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {["Automation", "Sync & backup", "Themes & layouts", "Plugins"].map((label) => (
            <span
              key={label}
              className="rounded-full border border-[var(--av-border)]/80 bg-[var(--av-surface)]/50 px-3 py-1 text-[11px] font-medium text-[var(--av-muted)]"
            >
              {label}
            </span>
          ))}
        </div>
        <p className="text-xs font-medium text-[var(--av-accent)]">{translate("settings.labsBadge")}</p>
      </div>
    </AvFutureSurface>
  );
}
