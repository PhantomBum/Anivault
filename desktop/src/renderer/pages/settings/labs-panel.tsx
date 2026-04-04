import { AvFutureSurface } from "@/renderer/components/av-future-surface";
import { cn } from "@/renderer/lib/utils";
import {
  Clapperboard,
  Grid3x3,
  ImageIcon,
  MessageSquarePlus,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

import type { SettingsTranslate } from "./settings-types";

type Props = {
  translate: SettingsTranslate;
};

const linkClass =
  "inline-flex items-center gap-2 rounded-xl border border-[var(--av-border)]/90 bg-[var(--av-bg)]/55 px-4 py-3 text-sm font-medium text-[var(--av-text)] transition-colors hover:border-[var(--av-accent-dim)] hover:bg-[var(--av-surface-hover)]";

export function LabsSettingsPanel({ translate }: Props) {
  const chips = [
    translate("settings.labsChip1"),
    translate("settings.labsChip2"),
    translate("settings.labsChip3"),
    translate("settings.labsChip4"),
  ];

  return (
    <AvFutureSurface variant="studio" id="settings-labs" className="scroll-mt-28 p-8">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--av-border)] bg-[var(--av-bg)]/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--av-muted)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--av-accent)]" aria-hidden />
          {translate("settings.labsKicker")}
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-[var(--av-text)]">{translate("settings.labsTitle")}</h3>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--av-muted-foreground)]">
          {translate("settings.labsBody")}
        </p>

        <div className="flex flex-wrap gap-2">
          {chips.map((label) => (
            <span
              key={label}
              className="rounded-full border border-[var(--av-border)]/80 bg-[var(--av-surface)]/50 px-3 py-1 text-[11px] font-medium text-[var(--av-muted)]"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--av-muted)]">
            {translate("settings.labsLinksHeading")}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link to="/community" className={cn(linkClass)}>
              <Users className="h-4 w-4 shrink-0 text-indigo-300" aria-hidden />
              {translate("settings.labsLinkCommunity")}
            </Link>
            <Link to="/gallery" className={cn(linkClass)}>
              <ImageIcon className="h-4 w-4 shrink-0 text-rose-300" aria-hidden />
              {translate("settings.labsLinkGallery")}
            </Link>
            <Link to="/clips" className={cn(linkClass)}>
              <Clapperboard className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden />
              {translate("settings.labsLinkClips")}
            </Link>
            <Link to="/browse" className={cn(linkClass)}>
              <Grid3x3 className="h-4 w-4 shrink-0 text-[var(--av-accent)]" aria-hidden />
              {translate("settings.labsLinkBrowse")}
            </Link>
            <Link to="/settings?tab=updates" className={cn(linkClass)}>
              <Settings className="h-4 w-4 shrink-0 text-[var(--av-muted)]" aria-hidden />
              {translate("settings.labsLinkUpdates")}
            </Link>
            <Link to="/request-series" className={cn(linkClass)}>
              <MessageSquarePlus className="h-4 w-4 shrink-0 text-[var(--av-muted)]" aria-hidden />
              {translate("settings.labsLinkRequestSeries")}
            </Link>
          </div>
        </div>

        <p className="max-w-2xl border-t border-[var(--av-border)]/60 pt-5 text-xs leading-relaxed text-[var(--av-muted-foreground)]">
          {translate("settings.labsAudit62")}
        </p>

        <p className="text-xs font-medium text-[var(--av-accent)]">{translate("settings.labsBadge")}</p>
      </div>
    </AvFutureSurface>
  );
}
