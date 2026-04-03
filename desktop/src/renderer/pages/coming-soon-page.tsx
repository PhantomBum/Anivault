import { Button } from "@/renderer/components/ui/button";
import { Construction } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

/**
 * Unified placeholder for routes reserved for future features (community, gallery, clips).
 */
export function ComingSoonPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-16 text-center text-[var(--av-text)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] shadow-av-md">
        <Construction className="h-8 w-8 text-[var(--av-accent)]" aria-hidden />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{t("comingSoon.title")}</h2>
        <p className="text-sm leading-relaxed text-[var(--av-muted-foreground)]">{t("comingSoon.body")}</p>
      </div>
      <Button type="button" variant="secondary" className="rounded-xl" asChild>
        <Link to="/">{t("comingSoon.backHome")}</Link>
      </Button>
    </div>
  );
}
