import { AvFutureSurface, type AvFutureVariant } from "@/renderer/components/av-future-surface";
import { Button } from "@/renderer/components/ui/button";
import { cn } from "@/renderer/lib/utils";
import { Image, Scissors, Sparkles, Users } from "lucide-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

function chipsFromI18n(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.length > 0);
}

/**
 * Full “unvaulted preview” for reserved routes — matches Settings → Studio gradient language.
 */
export function ComingSoonPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const config = useMemo((): {
    variant: AvFutureVariant;
    ns: "community" | "gallery" | "clips";
    icon: React.ReactNode;
  } => {
    if (pathname.startsWith("/gallery")) {
      return {
        variant: "gallery",
        ns: "gallery",
        icon: <Image className="h-6 w-6 text-rose-300" aria-hidden />,
      };
    }
    if (pathname.startsWith("/clips")) {
      return {
        variant: "clips",
        ns: "clips",
        icon: <Scissors className="h-6 w-6 text-cyan-300" aria-hidden />,
      };
    }
    return {
      variant: "community",
      ns: "community",
      icon: <Users className="h-6 w-6 text-indigo-300" aria-hidden />,
    };
  }, [pathname]);

  const chips = chipsFromI18n(t(`comingSoon.${config.ns}.chips`, { returnObjects: true }));

  return (
    <div className="av-page-shell max-w-3xl py-6 text-[var(--av-text)]">
      <AvFutureSurface variant={config.variant} className="p-5 sm:p-7">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--av-border)]/90 bg-[var(--av-bg)]/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--av-muted)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--av-accent)]" aria-hidden />
              {t(`comingSoon.${config.ns}.kicker`)}
            </div>
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/25 shadow-inner",
                "ring-1 ring-white/5"
              )}
            >
              {config.icon}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(`comingSoon.${config.ns}.title`)}</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--av-muted-foreground)]">
              {t(`comingSoon.${config.ns}.body`)}
            </p>
          </div>

          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {chips.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-[var(--av-border)]/80 bg-[var(--av-surface)]/45 px-3 py-1.5 text-[11px] font-medium text-[var(--av-muted)] backdrop-blur-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--av-accent)]">
            {t(`comingSoon.${config.ns}.badge`)}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" className="rounded-xl bg-[var(--av-text)] text-[var(--av-bg)] hover:opacity-90" asChild>
              <Link to="/">{t("comingSoon.backHome")}</Link>
            </Button>
            <Button type="button" variant="secondary" className="rounded-xl border-[var(--av-border)] bg-[var(--av-surface)]/80" asChild>
              <Link to="/settings?tab=labs">{t("comingSoon.openStudio")}</Link>
            </Button>
          </div>
        </div>
      </AvFutureSurface>
    </div>
  );
}
