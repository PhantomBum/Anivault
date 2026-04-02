import React, { useEffect, useState } from "react";

import { anivaultFetch } from "@/renderer/lib/anivault-api";
import { fetchAniListAiringSchedule, type AniListScheduleEntry } from "@/renderer/lib/anilist-schedule";

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
      title: i === 0 ? "Today — open Discover for catalog picks" : `Week highlight · day ${i + 1}`,
      air_date: d.toISOString().slice(0, 10),
      note:
        i === 0
          ? "Offline preview. Connect your AniVault server for editorial rows, or use AniList data when online."
          : null,
    });
  }
  return out;
})();

function mapAniList(rows: AniListScheduleEntry[]): ScheduleEntry[] {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    air_date: r.air_date,
    note: r.note,
  }));
}

export function SchedulePage() {
  const [rows, setRows] = useState<ScheduleEntry[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [source, setSource] = useState<"anilist" | "server" | "local">("local");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const al = await fetchAniListAiringSchedule();
      if (cancelled) return;
      if (al && al.length > 0) {
        setRows(mapAniList(al));
        setSource("anilist");
        setErr(null);
        return;
      }

      const res = await anivaultFetch<{ entries: ScheduleEntry[] }>("/api/schedule");
      if (cancelled) return;
      if (res.ok && res.data?.entries && res.data.entries.length > 0) {
        setRows(res.data.entries);
        setSource("server");
        setErr(null);
        return;
      }

      setErr(res.error ?? (al === null ? null : "AniList schedule unavailable"));
      setRows(LOCAL_FALLBACK);
      setSource("local");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 text-[var(--av-text)]">
      <p className="text-sm text-[var(--av-muted)]">
        {source === "anilist" ? (
          <>
            Upcoming episode air times from{" "}
            <span className="text-[var(--av-text)]">AniList</span> (community metadata — not a
            licensor broadcast guarantee).
          </>
        ) : source === "server" ? (
          <>Editorial calendar from your AniVault server.</>
        ) : (
          <>
            Offline preview week. Online, AniVault loads AniList airing data automatically when the
            network allows.
          </>
        )}
      </p>
      {source === "local" && err ? (
        <p className="text-sm text-amber-400/95" role="status">
          {err ? `Calendar note: ${err}. ` : null}
          Showing built-in week preview.
        </p>
      ) : null}
      <ul className="space-y-2">
        {rows.length === 0 ? (
          <li className="rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] px-4 py-6 text-center text-sm text-[var(--av-muted)]">
            No schedule entries yet.
          </li>
        ) : (
          rows.map((r) => (
            <li
              key={r.id}
              className="av-card rounded-xl px-4 py-3 transition-transform duration-200 hover:-translate-y-px"
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
