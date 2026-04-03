import { Button } from "@/renderer/components/ui/button";
import { showToast } from "@/renderer/lib/av-toast";
import updateLogsText from "@/renderer/data/update-logs.txt?raw";
import React, { useState } from "react";
import type { SettingsTranslate } from "./settings-types";

type Props = {
  appVersion: string;
  translate: SettingsTranslate;
};

export function UpdatesSettingsPanel({ appVersion, translate }: Props) {
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  return (
    <>
      <div id="settings-updates" className="space-y-2 scroll-mt-28">
        <span className="text-sm font-medium text-[var(--av-muted)]">App version</span>
        <button
          type="button"
          className="block w-fit rounded-lg border border-transparent px-1 py-0.5 text-left text-base tabular-nums text-[var(--av-muted-foreground)] transition-colors hover:border-[var(--av-border)] hover:bg-[var(--av-surface-hover)]"
          title={translate("settings.toastVersionCopied")}
          onClick={() => {
            if (!appVersion) return;
            void navigator.clipboard.writeText(appVersion).then(() => {
              showToast(translate("settings.toastVersionCopied"));
            });
          }}
        >
          {appVersion || "—"}
        </button>
        <p className="text-[11px] text-[var(--av-muted)]">{translate("settings.versionCopyHint")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl px-5 text-sm uppercase transition-transform active:scale-[0.98]"
          onClick={() => {
            setUpdateMsg(null);
            void window.app.checkElectronUpdates().then((r) => {
              if (r.kind === "skipped") {
                setUpdateMsg("Auto-update runs in installed builds only.");
              } else if (r.kind === "ok") {
                if (r.isUpdateAvailable && r.version) {
                  setUpdateMsg(
                    `Update available: v${r.version} (you have v${r.currentVersion}). Download runs in the background; restart when prompted.`
                  );
                } else {
                  setUpdateMsg(`Up to date (v${r.currentVersion}).`);
                }
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
        <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">{updateMsg}</p>
      ) : null}
      <div className="space-y-3">
        <span className="text-sm font-medium text-[var(--av-muted)]">Update logs</span>
        <pre className="max-h-80 overflow-auto rounded-xl border border-[var(--av-border)] bg-[var(--av-bg)] p-4 text-xs leading-relaxed text-[var(--av-muted-foreground)] whitespace-pre-wrap font-mono">
          {updateLogsText.trim()}
        </pre>
      </div>
      <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
        Background update polling is off by default. After you publish GitHub Releases with NSIS/electron-updater
        assets, set <code className="font-mono">ANIVAULT_AUTO_UPDATE=1</code> to enable. Manual &quot;Check for
        updates&quot; may show a message until <code className="font-mono">latest.yml</code> exists. Restart still
        applies downloads.
      </p>
      <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
        <span className="font-medium text-[var(--av-muted)]">How to test auto-update:</span> install an{" "}
        <span className="font-medium">older</span> release from GitHub, then publish a <span className="font-medium">newer</span>{" "}
        one (same repo) that includes <code className="font-mono">latest.yml</code> and{" "}
        <code className="font-mono">AniVaultUnvaultedSetup.exe</code> from CI. In the old build, open Settings → Check
        for updates. For detailed logs, launch the installed <code className="font-mono">anivault-unvaulted.exe</code>{" "}
        from a terminal with <code className="font-mono">set ANIVAULT_UPDATER_DEBUG=1</code> (Windows).
      </p>
    </>
  );
}
