import React, { useEffect, useState } from "react";

import { anivaultFetch } from "@/renderer/lib/anivault-api";

type ScheduleEntry = {
  id: string;
  title: string;
  air_date: string;
  note: string | null;
};

const LOCAL_FALLBACK: ScheduleEntry[] = (() => {
  const out: ScheduleEntry[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    out.push({
      id: `local-${i}`,
      title: i === 0 ? "Today — open Discover for new picks" : `Week highlight · day ${i + 1}`,
      air_date: d.toISOString().slice(0, 10),
      note:
        i === 0
          ? "Connect the AniVault server for editorial calendar entries. This row is a local placeholder."
          : null,
    });
  }
  return out;
})();

export function SchedulePage() {
  const [rows, setRows] = useState<ScheduleEntry[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await anivaultFetch<{ entries: ScheduleEntry[] }>("/api/schedule");
      if (cancelled) return;
      if (res.ok && res.data?.entries && res.data.entries.length > 0) {
        setRows(res.data.entries);
        setUsedFallback(false);
        setErr(null);
        return;
      }
      setErr(res.error ?? null);
      setRows(LOCAL_FALLBACK);
      setUsedFallback(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 text-[var(--av-text)]">
      <p className="text-sm text-[var(--av-muted)]">
        Editorial dates from your AniVault server (not licensors&apos; broadcast schedules). If the
        server is offline, a local week preview is shown.
      </p>
      {usedFallback && err ? (
        <p className="text-sm text-amber-400/95" role="status">
          Server calendar unavailable ({err}). Showing offline preview.
        </p>
      ) : null}
      {!usedFallback && err ? (
        <p className="text-sm text-amber-400" role="status">
          {err}
        </p>
      ) : null}
      <ul className="space-y-2">
        {rows.length === 0 && !err ? (
          <li className="rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] px-4 py-6 text-center text-sm text-[var(--av-muted)]">
            No schedule entries yet.
          </li>
        ) : (
          rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] px-4 py-3"
            >
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-[var(--av-muted)]">{r.air_date}</p>
              {r.note ? <p className="mt-1 text-sm text-[var(--av-muted-foreground)]">{r.note}</p> : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
