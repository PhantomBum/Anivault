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

const studioLinkCard =
  "group relative flex min-h-[4.5rem] flex-col justify-center gap-1 overflow-hidden rounded-2xl border border-[var(--av-border)]/75 bg-gradient-to-br from-[var(--av-bg)]/70 via-[var(--av-surface)]/45 to-[var(--av-bg)]/80 p-4 text-left shadow-sm transition-all duration-200 hover:border-[var(--av-accent-dim)]/50 hover:shadow-[0_12px_40px_-16px_rgba(99,102,241,0.45)] active:scale-[0.99]";

export function LabsSettingsPanel({ translate }: Props) {
  const chips = [
    translate("settings.labsChip1"),
    translate("settings.labsChip2"),
    translate("settings.labsChip3"),
    translate("settings.labsChip4"),
  ];

  const links: {
    to: string;
    icon: React.ReactNode;
    label: string;
    bar: string;
    glow: string;
  }[] = [
    {
      to: "/community",
      icon: <Users className="h-5 w-5 shrink-0 text-indigo-300" aria-hidden />,
      label: translate("settings.labsLinkCommunity"),
      bar:
        "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 to-violet-500 opacity-90 transition-opacity group-hover:opacity-100",
      glow: "group-hover:shadow-indigo-500/20",
    },
    {
      to: "/gallery",
      icon: <ImageIcon className="h-5 w-5 shrink-0 text-rose-300" aria-hidden />,
      label: translate("settings.labsLinkGallery"),
      bar:
        "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 to-fuchsia-500 opacity-90 transition-opacity group-hover:opacity-100",
      glow: "group-hover:shadow-rose-500/15",
    },
    {
      to: "/clips",
      icon: <Clapperboard className="h-5 w-5 shrink-0 text-cyan-300" aria-hidden />,
      label: translate("settings.labsLinkClips"),
      bar:
        "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-sky-500 opacity-90 transition-opacity group-hover:opacity-100",
      glow: "group-hover:shadow-cyan-500/20",
    },
    {
      to: "/browse",
      icon: <Grid3x3 className="h-5 w-5 shrink-0 text-violet-200" aria-hidden />,
      label: translate("settings.labsLinkBrowse"),
      bar:
        "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-400 to-indigo-500 opacity-90 transition-opacity group-hover:opacity-100",
      glow: "group-hover:shadow-violet-500/15",
    },
    {
      to: "/settings?tab=updates",
      icon: <Settings className="h-5 w-5 shrink-0 text-zinc-300" aria-hidden />,
      label: translate("settings.labsLinkUpdates"),
      bar:
        "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-zinc-500 to-zinc-600 opacity-90 transition-opacity group-hover:opacity-100",
      glow: "",
    },
    {
      to: "/request-series",
      icon: <MessageSquarePlus className="h-5 w-5 shrink-0 text-amber-200/90" aria-hidden />,
      label: translate("settings.labsLinkRequestSeries"),
      bar:
        "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-90 transition-opacity group-hover:opacity-100",
      glow: "group-hover:shadow-amber-500/10",
    },
  ];

  return (
    <AvFutureSurface variant="studio" id="settings-labs" className="scroll-mt-28 p-0">
      <div className="relative p-8 md:p-10">
        <div
          className="pointer-events-none absolute right-0 top-1/2 h-64 w-64 -translate-y-1/2 translate-x-1/4 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-600/10 blur-3xl"
          aria-hidden
        />
        <div className="relative space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-gradient-to-r from-indigo-500/15 to-fuchsia-500/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-100/90">
              <Sparkles className="h-3.5 w-3.5 text-indigo-200" aria-hidden />
              {translate("settings.labsKicker")}
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-[var(--av-text)] md:text-3xl">
              {translate("settings.labsTitle")}
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--av-muted-foreground)] md:text-[0.9375rem]">
              {translate("settings.labsBody")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {chips.map((label) => (
              <span
                key={label}
                className="rounded-full border border-[var(--av-border)]/70 bg-gradient-to-br from-[var(--av-surface)]/80 to-indigo-950/20 px-3.5 py-1 text-[11px] font-medium text-[var(--av-muted)]"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--av-muted)]">
              {translate("settings.labsLinksHeading")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(studioLinkCard, item.glow)}
                >
                  <span className={item.bar} aria-hidden />
                  <span className="pointer-events-none absolute -right-6 bottom-0 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                  <span className="relative flex items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] shadow-inner">
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1 pt-1 text-sm font-semibold leading-snug text-[var(--av-text)]">
                      {item.label}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <p className="max-w-2xl border-t border-[var(--av-border)]/50 pt-6 text-xs leading-relaxed text-[var(--av-muted-foreground)]">
            {translate("settings.labsAudit62")}
          </p>

          <p className="text-xs font-medium text-indigo-300/90">{translate("settings.labsBadge")}</p>
        </div>
      </div>
    </AvFutureSurface>
  );
}
