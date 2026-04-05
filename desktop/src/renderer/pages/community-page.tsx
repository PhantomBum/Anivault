import { Hash, LayoutGrid, MessageCircle, RefreshCw, Server } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { AvFutureSurface } from "@/renderer/components/av-future-surface";
import { CommunityLocalThreadsPanel } from "@/renderer/components/community-local-threads-panel";
import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { anivaultFetch } from "@/renderer/lib/anivault-api";

type Server = { id: string; name: string; slug: string; description: string | null };

export function CommunityPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportReason, setReportReason] = useState<Record<string, string>>({});
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const res = await anivaultFetch<{ servers: Server[] }>("/api/community/servers");
    if (!res.ok) {
      setErr(res.error ?? "Failed to load");
      setServers([]);
    } else {
      setServers(res.data?.servers ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const serverChips = useMemo(
    () => servers.map((s) => ({ id: s.id, name: s.name })),
    [servers]
  );

  const reportServer = async (serverId: string) => {
    setReportMsg(null);
    const token = await window.anivault.getConfig("authToken");
    if (!token) {
      setReportMsg("Sign in (Account) to report");
      return;
    }
    const res = await anivaultFetch("/api/reports", {
      method: "POST",
      body: JSON.stringify({
        targetType: "server",
        targetId: serverId,
        reason: reportReason[serverId] ?? "",
      }),
    });
    setReportMsg(res.ok ? "Report submitted" : res.error ?? "Report failed");
  };

  return (
    <AvFutureSurface
      variant="community"
      className="av-page-shell max-w-5xl space-y-6 p-4 text-[var(--av-text)] md:p-5"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="av-page-section-label text-[var(--av-accent)]">Community</p>
          <h1 className="mt-1 text-lg font-bold tracking-tight md:text-xl">Hub & discussions</h1>
          <p className="mt-1 max-w-xl text-xs text-[var(--av-muted)]">
            Offline threads stay on this device. When the companion API is online, browse hubs and file
            reports from the right column.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-lg border-[var(--av-border)] bg-[var(--av-surface)] text-[11px] font-medium uppercase text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
          onClick={() => void load()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <section id="local-threads" className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 shrink-0 text-[var(--av-accent)]" aria-hidden />
            <h2 className="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--av-muted)]">
              Local threads
            </h2>
          </div>
          <CommunityLocalThreadsPanel servers={serverChips} />
        </section>

        <section className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 shrink-0 text-[var(--av-accent)]" aria-hidden />
            <h2 className="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--av-muted)]">
              Companion servers
            </h2>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--av-muted)]">Loading servers…</p>
          ) : err ? (
            <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-6 text-sm text-red-200">
              <p className="font-medium">{err}</p>
              <p className="mt-2 text-xs text-red-200/80">
                Start the companion server (see <code className="font-mono">anivault/server</code>) or set
                the API base URL under Settings → Security.
              </p>
            </div>
          ) : servers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--av-border)] bg-[var(--av-surface)]/40 p-8 text-center text-sm text-[var(--av-muted)]">
              No servers advertised yet.
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {servers.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col rounded-3xl border border-[var(--av-border)] bg-[var(--av-bg-elevated)] p-5 shadow-sm transition-colors hover:border-[var(--av-accent-dim)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--av-surface)] text-[var(--av-accent)]">
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold leading-tight">{s.name}</h3>
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] tabular-nums text-[var(--av-muted)]">
                        <Hash className="h-3 w-3" />
                        {s.slug}
                      </p>
                      {s.description ? (
                        <p className="mt-2 text-sm text-[var(--av-muted)]">{s.description}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 border-t border-[var(--av-border)] pt-4 sm:flex-row sm:items-end">
                    <Input
                      className="min-w-0 flex-1 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-xs"
                      placeholder="Report reason (optional)"
                      value={reportReason[s.id] ?? ""}
                      onChange={(e) =>
                        setReportReason((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-xl border-[var(--av-border)] text-xs uppercase"
                      onClick={() => void reportServer(s.id)}
                    >
                      Report
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {reportMsg ? (
        <p className="text-center text-xs font-medium text-[var(--av-muted)]">{reportMsg}</p>
      ) : null}
    </AvFutureSurface>
  );
}
