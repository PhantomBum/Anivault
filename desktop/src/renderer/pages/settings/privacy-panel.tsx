import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { showToast } from "@/renderer/lib/av-toast";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";
import { FolderOpen } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { PersistConfig, SettingsTranslate } from "./settings-types";

type Props = {
  cfg: AnivaultStoreSchema;
  persist: PersistConfig;
  translate: SettingsTranslate;
};

export function PrivacySettingsPanel({ cfg, persist, translate }: Props) {
  const [userDataPath, setUserDataPath] = useState<string>("");

  useEffect(() => {
    void window.app.getUserDataPath().then((p) => setUserDataPath(p));
  }, []);

  const copyDiagnostics = async () => {
    try {
      const version = await window.app.version();
      const os = await window.app.os();
      const payload = {
        app: "AniVault Unvaulted",
        version,
        os,
        userDataPath,
        route: typeof window !== "undefined" ? window.location.hash : "",
        telemetryOptIn: Boolean(cfg.telemetryOptIn),
        telemetryEndpointSet: Boolean((cfg.telemetryEndpoint ?? "").trim()),
      };
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      showToast(translate("settings.toastDiagnosticsCopied"));
    } catch {
      showToast(translate("settings.toastDiagnosticsCopied"), 3200);
    }
  };

  return (
    <>
      <section id="settings-privacy-diagnostics" className="space-y-3 scroll-mt-28">
        <h3 className="text-sm font-semibold text-[var(--av-text)]">{translate("settings.privacyDiagTitle")}</h3>
        <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
          {translate("settings.privacyDiagBody")}
        </p>
        {userDataPath ? (
          <p className="break-all font-mono text-[11px] text-[var(--av-muted)]">{userDataPath}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 rounded-xl border-[var(--av-border)]"
            onClick={() => {
              void window.app.revealUserDataFolder();
            }}
          >
            <FolderOpen className="h-4 w-4" aria-hidden />
            {translate("settings.openUserDataFolder")}
          </Button>
          <Button type="button" variant="secondary" className="h-10 rounded-xl" onClick={() => void copyDiagnostics()}>
            {translate("settings.copyDiagnostics")}
          </Button>
        </div>
        <p className="text-xs text-[var(--av-muted-foreground)]">
          <Link className="font-medium text-[var(--av-accent)] underline-offset-2 hover:underline" to="/terms">
            {translate("settings.privacyTermsLink")}
          </Link>
        </p>
      </section>

      <section id="settings-telemetry" className="mt-8 space-y-3 border-t border-[var(--av-border)] pt-8 scroll-mt-28">
        <h3 className="text-sm font-semibold text-[var(--av-text)]">{translate("settings.telemetryTitle")}</h3>
        <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">{translate("settings.telemetryBody")}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span className="text-sm font-medium text-[var(--av-muted)]">{translate("settings.telemetryCheckbox")}</span>
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 rounded border border-[var(--av-border)] accent-[var(--av-accent)]"
            checked={cfg.telemetryOptIn ?? false}
            onChange={(e) => void persist({ telemetryOptIn: e.target.checked })}
          />
        </div>
        <div className="space-y-2">
          <span className="text-sm font-medium text-[var(--av-muted)]">{translate("settings.telemetryEndpoint")}</span>
          <p className="text-xs text-[var(--av-muted-foreground)]">{translate("settings.telemetryEndpointHelp")}</p>
          <Input
            className="h-11 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] font-mono text-sm"
            placeholder="https://…"
            value={cfg.telemetryEndpoint ?? ""}
            onChange={(e) => void persist({ telemetryEndpoint: e.target.value.trim() })}
          />
        </div>
      </section>
    </>
  );
}
