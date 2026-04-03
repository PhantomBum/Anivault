import { Calendar, Clock, ExternalLink, Loader2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { anivaultFetch } from "@/renderer/lib/anivault-api";
import { fetchAniListAiringSchedule, type AniListScheduleEntry } from "@/renderer/lib/anilist-schedule";
import { useTranslation } from "react-i18next";

type ScheduleEntry = {
  id: string;
  title: string;
  air_date: string;
  air_at_iso: string;
  note: string | null;
};

const LOCAL_FALLBACK: ScheduleEntry[] = (() => {
  const out: ScheduleEntry[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(14 + i, 30, 0, 0);
    const iso = d.toISOString();
    out.push({
      id: `local-${i}`,
      title: i === 0 ? "Today — open Discover for catalog picks" : `Week highlight · day ${i + 1}`,
      air_date: iso.slice(0, 10),
      air_at_iso: iso,
      note:
        i === 0
          ? "Offline preview. Connect your AniVault companion server for editorial rows, or use AniList data when online."
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
    air_at_iso: r.air_at_iso,
    note: r.note,
  }));
}

function formatLocalTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatDayHeading(
  dateKey: string,
  labels: { today: string; tomorrow: string }
): string {
  try {
    const d = new Date(`${dateKey}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateKey;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cmp = new Date(d);
    cmp.setHours(0, 0, 0, 0);
    const diff = (cmp.getTime() - today.getTime()) / (24 * 3600 * 1000);
    if (diff === 0) return labels.today;
    if (diff === 1) return labels.tomorrow;
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  } catch {
    return dateKey;
  }
}

export function SchedulePage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ScheduleEntry[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [source, setSource] = useState<"anilist" | "server" | "local">("local");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const al = await fetchAniListAiringSchedule();
      if (cancelled) return;
      if (al && al.length > 0) {
        setRows(mapAniList(al));
        setSource("anilist");
        setErr(null);
        setLoading(false);
        return;
      }

      const res = await anivaultFetch<{ entries: ScheduleEntry[] }>("/api/schedule");
      if (cancelled) return;
      if (res.ok && res.data?.entries && res.data.entries.length > 0) {
        setRows(
          res.data.entries.map((e) => ({
            ...e,
            air_at_iso: e.air_at_iso ?? `${e.air_date}T12:00:00.000Z`,
          }))
        );
        setSource("server");
        setErr(null);
        setLoading(false);
        return;
      }

      setErr(res.error ?? (al === null ? null : "AniList schedule unavailable"));
      setRows(LOCAL_FALLBACK);
      setSource("local");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byDay = useMemo(() => {
    const m = new Map<string, ScheduleEntry[]>();
    for (const r of rows) {
      const k = r.air_date;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.air_at_iso.localeCompare(b.air_at_iso));
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 text-[var(--av-text)]">
      <header className="flex flex-col gap-2 border-b border-[var(--av-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--av-accent)]">
            {t("schedule.kicker")}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{t("schedule.title")}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--av-muted)]">
            {source === "anilist" ? (
              <>{t("schedule.anilistBlurb")}</>
            ) : source === "server" ? (
              <>{t("schedule.serverBlurb")}</>
            ) : (
              <>{t("schedule.localBlurb")}</>
            )}
          </p>
        </div>
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] px-4 py-2 text-sm font-medium text-[var(--av-text)] transition-colors hover:bg-[var(--av-surface-hover)]"
        >
          {t("schedule.discover")}
          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
        </Link>
      </header>

      {source === "local" && err ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/95" role="status">
          {err ? `${t("schedule.localNotePrefix")} ${err}. ` : null}
          {t("schedule.localNoteSuffix")}
        </p>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)]/40 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--av-accent)]" aria-hidden />
          <p className="text-sm text-[var(--av-muted)]">{t("schedule.loading")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {byDay.length === 0 ? (
            <p className="rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] px-4 py-8 text-center text-sm text-[var(--av-muted)]">
              {t("schedule.empty")}
            </p>
          ) : (
            byDay.map(([dateKey, items]) => (
              <section key={dateKey} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--av-accent)]" aria-hidden />
                  <h2 className="m-0 text-base font-semibold tracking-tight">
                    {formatDayHeading(dateKey, {
                      today: t("schedule.today"),
                      tomorrow: t("schedule.tomorrow"),
                    })}
                    <span className="ml-2 font-normal text-[var(--av-muted)]">· {dateKey}</span>
                  </h2>
                </div>
                <ul className="space-y-2">
                  {items.map((r) => (
                    <li
                      key={r.id}
                      className="av-card rounded-xl border border-[var(--av-border)]/90 bg-[var(--av-surface)]/50 px-4 py-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-av-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 font-medium leading-snug">{r.title}</p>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--av-bg)] px-2 py-1 text-[11px] tabular-nums text-[var(--av-muted)]">
                          <Clock className="h-3 w-3" aria-hidden />
                          {formatLocalTime(r.air_at_iso)}
                        </span>
                      </div>
                      {r.note ? (
                        <p className="mt-1.5 text-xs text-[var(--av-muted-foreground)]">{r.note}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}
