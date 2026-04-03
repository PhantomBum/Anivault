import { Sparkles } from "lucide-react";
import React from "react";

import type { SettingsTranslate } from "./settings-types";

type Props = {
  translate: SettingsTranslate;
};

export function LabsSettingsPanel({ translate }: Props) {
  return (
    <div
      id="settings-labs"
      className="relative overflow-hidden rounded-2xl border border-[var(--av-accent)]/25 bg-[linear-gradient(135deg,rgba(99,102,241,0.12)_0%,rgba(24,24,27,0.92)_45%,rgba(9,9,11,0.98)_100%)] p-8 scroll-mt-28"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--av-accent)]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="relative space-y-5">
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
    </div>
  );
}
