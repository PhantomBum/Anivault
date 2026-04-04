import { Hash, LayoutGrid, RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

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
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-2 text-[var(--av-text)]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--av-accent)]">
            Community
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Servers & safety</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--av-muted)]">
            Companion API lists hubs and reports when online. Local threads below work offline (stored only on
            this device until server-backed sync exists).
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-2xl border-[var(--av-border)] bg-[var(--av-surface)] text-xs uppercase text-[var(--av-text)] hover:bg-[var(--av-surface-hover)]"
          onClick={() => void load()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </header>

      <CommunityLocalThreadsPanel servers={serverChips} />

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
        <p className="text-sm text-[var(--av-muted)]">No servers yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
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
      {reportMsg ? (
        <p className="text-center text-xs font-medium text-[var(--av-muted)]">{reportMsg}</p>
      ) : null}
    </div>
  );
}
