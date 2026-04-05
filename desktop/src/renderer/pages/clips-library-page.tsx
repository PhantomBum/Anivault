import { Loader2, Scissors } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { anivaultFetch } from "@/renderer/lib/anivault-api";

type ClipItem = {
  id: string;
  title: string;
  status: string;
  kind: string;
  imageUrl: string | null;
  clipMeta: {
    animeId?: string | null;
    animeName?: string | null;
    startSec?: number;
    endSec?: number;
  } | null;
};

export function ClipsLibraryPage() {
  const [items, setItems] = useState<ClipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const res = await anivaultFetch<{ items: ClipItem[] }>("/api/gallery?status=approved&kind=clip");
    if (!res.ok) {
      setErr(res.error ?? "Failed to load clips");
      setItems([]);
    } else {
      setItems(res.data?.items ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="av-page-shell max-w-5xl space-y-4 text-[var(--av-text)]">
      <header className="av-page-hero flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="av-page-section-label text-[var(--av-accent)]">Clips</p>
          <h1 className="mt-1 text-lg font-bold tracking-tight md:text-xl">Community clips</h1>
          <p className="mt-1 max-w-xl text-xs text-[var(--av-muted)]">
            Short moments captured from the player and shared to the gallery (moderated). Create new
            clips from the watch screen.
          </p>
        </div>
        <Link
          to="/watch"
          className="text-sm font-medium text-[var(--av-accent)] underline-offset-4 hover:underline"
        >
          Go to player
        </Link>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--av-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading clips…
        </div>
      ) : err ? (
        <p className="text-sm text-red-400" role="alert">
          {err}
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--av-border)] bg-[var(--av-surface)] p-10 text-center">
          <Scissors className="mx-auto h-10 w-10 text-[var(--av-muted)]" />
          <p className="mt-3 text-sm text-[var(--av-muted)]">No approved clips yet.</p>
          <p className="mt-1 text-xs text-[var(--av-muted-foreground)]">
            While watching, use <strong className="text-[var(--av-text)]">Clip</strong> to submit a
            frame to the moderation queue.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <li
              key={it.id}
              className="overflow-hidden rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg-elevated)] shadow-sm"
            >
              {it.imageUrl ? (
                <img
                  src={it.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-[var(--av-surface)] text-xs text-[var(--av-muted)]">
                  No thumbnail
                </div>
              )}
              <div className="space-y-1 p-3">
                <p className="line-clamp-2 font-semibold leading-snug">{it.title}</p>
                {it.clipMeta?.animeName ? (
                  <p className="text-xs text-[var(--av-muted)]">{it.clipMeta.animeName}</p>
                ) : null}
                {it.clipMeta && (it.clipMeta.startSec ?? 0) >= 0 ? (
                  <p className="font-mono text-[10px] text-[var(--av-muted-foreground)]">
                    {Math.floor(it.clipMeta.startSec ?? 0)}s – {Math.floor(it.clipMeta.endSec ?? 0)}s
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
