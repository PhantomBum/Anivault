import { Button } from "@/renderer/components/ui/button";
import { testAnivaultServerConnection } from "@/renderer/lib/anivault-api";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";
import type { OfflineDownloadItem } from "@/shared/offline-downloads-types";
import { FolderOpen, RefreshCw } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

import type { PersistConfig, SettingsTranslate } from "./settings-types";

type Props = {
  cfg: AnivaultStoreSchema;
  persist: PersistConfig;
  translate: SettingsTranslate;
  offlineQueue: OfflineDownloadItem[];
  refreshOfflineQueue: () => void;
  connMsg: string | null;
  setConnMsg: (v: string | null) => void;
  connBusy: boolean;
  setConnBusy: (v: boolean) => void;
};

export function DataSettingsPanel({
  cfg,
  persist,
  translate,
  offlineQueue,
  refreshOfflineQueue,
  connMsg,
  setConnMsg,
  connBusy,
  setConnBusy,
}: Props) {
  return (
    <>
      <section id="settings-data-backup" className="space-y-3 scroll-mt-28">
        <h3 className="text-sm font-semibold text-[var(--av-text)]">{translate("settings.dataBackupTitle")}</h3>
        <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
          {translate("settings.dataBackupLead")}{" "}
          <Link className="font-medium text-[var(--av-accent)] underline-offset-2 hover:underline" to="/lists">
            {translate("lists.title")}
          </Link>{" "}
          {translate("settings.dataBackupTrail")}
        </p>
      </section>

      <section
        id="settings-data-downloads"
        className="mt-8 space-y-3 border-t border-[var(--av-border)] pt-8 scroll-mt-28"
      >
        <h3 className="text-sm font-semibold text-[var(--av-text)]">{translate("settings.dataDownloadsTitle")}</h3>
        <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
          {translate("settings.dataDownloadsBody")}
        </p>
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--av-border)]/80 bg-[var(--av-bg)]/30 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-[var(--av-muted)]">{translate("settings.offlineDownloads")}</span>
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 rounded border border-[var(--av-border)] accent-[var(--av-accent)]"
              checked={cfg.offlineDownloadsEnabled ?? false}
              onChange={(e) => void persist({ offlineDownloadsEnabled: e.target.checked })}
            />
          </div>
          <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
            {translate("settings.offlineDownloadsHelp")}
          </p>
          {cfg.offlineDownloadsEnabled ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl border-[var(--av-border)]"
                  onClick={() => {
                    if (!window.app?.pickDownloadsFolder) return;
                    void window.app.pickDownloadsFolder().then((p) => {
                      if (p) void persist({ offlineDownloadsPath: p });
                    });
                  }}
                >
                  {translate("settings.offlineDownloadsChoose")}
                </Button>
                {cfg.offlineDownloadsPath ? (
                  <>
                    <span className="text-xs text-[var(--av-muted)]">
                      {translate("settings.offlineDownloadsPath")}:{" "}
                      <code className="break-all font-mono text-[11px] text-[var(--av-text)]">
                        {cfg.offlineDownloadsPath}
                      </code>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 text-xs"
                      onClick={() => void persist({ offlineDownloadsPath: "" })}
                    >
                      {translate("settings.offlineDownloadsClear")}
                    </Button>
                  </>
                ) : null}
              </div>
              {cfg.offlineDownloadsPath ? (
                <div
                  id="settings-offline-queue"
                  className="mt-4 space-y-3 border-t border-[var(--av-border)]/60 pt-4 scroll-mt-28"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--av-muted)]">
                      {translate("settings.offlineQueueTitle")}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => refreshOfflineQueue()}
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                        {translate("settings.refreshQueue")}
                      </Button>
                      {offlineQueue.some((i) => i.status === "complete") ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            void window.offlineDownloads.clearCompleted().then(refreshOfflineQueue);
                          }}
                        >
                          {translate("settings.offlineQueueClearDone")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {offlineQueue.length === 0 ? (
                    <p className="text-xs text-[var(--av-muted-foreground)]">
                      {translate("settings.offlineQueueEmpty")}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {offlineQueue.map((row) => (
                        <li
                          key={row.id}
                          className="flex flex-col gap-2 rounded-xl border border-[var(--av-border)]/60 bg-[var(--av-bg)]/40 p-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[var(--av-text)]">
                              {row.showName}{" "}
                              <span className="text-[var(--av-muted)]">· {row.episode}</span>{" "}
                              <span className="text-[11px] uppercase text-[var(--av-muted)]">{row.mode}</span>
                            </p>
                            <p className="mt-1 text-[11px] text-[var(--av-muted-foreground)]">
                              {row.status === "queued" && translate("settings.offlineStatusQueued")}
                              {row.status === "downloading" && translate("settings.offlineStatusDownloading")}
                              {row.status === "complete" && translate("settings.offlineStatusComplete")}
                              {row.status === "failed" && translate("settings.offlineStatusFailed")}
                            </p>
                            {row.error ? (
                              <p className="mt-1 text-[11px] leading-snug text-amber-600/95 dark:text-amber-400/95">
                                {row.error}
                              </p>
                            ) : null}
                            {row.status === "complete" && row.localPath ? (
                              <p className="mt-1 break-all font-mono text-[10px] text-[var(--av-muted)]">
                                {row.localPath}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            {row.status === "failed" ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg text-xs"
                                onClick={() => {
                                  void window.offlineDownloads.retry(row.id).then((r) => {
                                    if (r.ok) refreshOfflineQueue();
                                  });
                                }}
                              >
                                {translate("settings.offlineQueueRetry")}
                              </Button>
                            ) : null}
                            {row.status === "complete" && row.localPath ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg px-2"
                                title={translate("settings.offlineQueueReveal")}
                                onClick={() => {
                                  const p = row.localPath;
                                  if (p) void window.offlineDownloads.reveal(p);
                                }}
                              >
                                <FolderOpen className="h-3.5 w-3.5" aria-hidden />
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              disabled={row.status === "downloading"}
                              onClick={() => {
                                void window.offlineDownloads.remove(row.id).then((r) => {
                                  if (r.ok) refreshOfflineQueue();
                                });
                              }}
                            >
                              {translate("settings.offlineQueueRemove")}
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>

      <section
        id="settings-data-api"
        className="mt-8 space-y-3 border-t border-[var(--av-border)] pt-8 scroll-mt-28"
      >
        <h3 className="text-sm font-semibold text-[var(--av-text)]">{translate("settings.dataApiTitle")}</h3>
        <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">
          {translate("settings.dataApiBody")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-[var(--av-border)] px-5 text-sm"
            disabled={connBusy}
            onClick={() => {
              setConnMsg(null);
              setConnBusy(true);
              void testAnivaultServerConnection()
                .then((r) => {
                  setConnMsg(`${r.ok ? "OK" : "Error"}: ${r.message}`);
                })
                .finally(() => setConnBusy(false));
            }}
          >
            {connBusy ? translate("settings.testingConnection") : translate("settings.testConnection")}
          </Button>
        </div>
        {connMsg ? (
          <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]" role="status">
            {connMsg}
          </p>
        ) : null}
      </section>
    </>
  );
}
