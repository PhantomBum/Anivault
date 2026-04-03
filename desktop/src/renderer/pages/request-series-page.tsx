import React, { useCallback, useState } from "react";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { cn } from "@/renderer/lib/utils";
import { anivaultFetch } from "@/renderer/lib/anivault-api";
import { APP_DISPLAY_NAME } from "@/shared/app-brand";

const REQUEST_EMAIL = "ilikebagels1612@gmail.com";

function buildMailto(title: string, note: string): string {
  const subject = encodeURIComponent(`[${APP_DISPLAY_NAME}] Series request: ${title}`);
  const body = encodeURIComponent(
    `Requested title: ${title}\n\nNotes:\n${note || "(none)"}\n\n— Sent from ${APP_DISPLAY_NAME}`
  );
  return `mailto:${REQUEST_EMAIL}?subject=${subject}&body=${body}`;
}

export function RequestSeriesPage() {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openMailto = useCallback(() => {
    const t = title.trim();
    if (!t) {
      setMsg("Enter a series title.");
      return;
    }
    const url = buildMailto(t, note.trim());
    if (window.urlOpener) {
      void window.urlOpener.openUrl(url);
    } else {
      window.location.href = url;
    }
    setMsg("Opened your email app with a pre-filled message. Send when ready.");
  }, [note, title]);

  const submit = () => {
    setMsg(null);
    if (!title.trim()) {
      setMsg("Enter a series title.");
      return;
    }
    setBusy(true);
    void (async () => {
      const res = await anivaultFetch<{ id: string }>("/api/series-request", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), note: note.trim() || undefined }),
      });
      setBusy(false);
      if (res.ok) {
        setMsg("Request received on the server. You can also email the address below.");
        setTitle("");
        setNote("");
      } else {
        setMsg(
          res.error
            ? `Server: ${res.error}. Use “Email request” to send to ${REQUEST_EMAIL} directly.`
            : `Use “Email request” to send your suggestion to ${REQUEST_EMAIL}.`
        );
      }
    })();
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-4 text-[var(--av-text)]">
      <p className="text-sm leading-relaxed text-[var(--av-muted)]">
        Suggest a series for the catalog. Requests are sent to{" "}
        <span className="text-[var(--av-text)]">{REQUEST_EMAIL}</span> via your mail app, and mirrored
        to the companion server when it&apos;s online.
      </p>
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--av-muted)]">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Series name"
          className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] transition-[box-shadow,border-color] duration-200 focus-visible:border-[var(--av-accent-dim)]"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--av-muted)]">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Year, season, or link"
          rows={3}
          className={cn(
            "min-h-[88px] w-full resize-none rounded-xl border border-[var(--av-border)] bg-[var(--av-bg)] px-3 py-2 text-sm shadow-av-xs transition-[box-shadow,border-color] duration-200 placeholder:text-[var(--av-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--av-accent-muted)] focus-visible:ring-offset-0 focus-visible:ring-offset-[var(--av-bg)]"
          )}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="rounded-xl" disabled={busy} onClick={submit}>
          {busy ? "Sending…" : "Submit request"}
        </Button>
        <Button type="button" variant="secondary" className="rounded-xl border-[var(--av-border)]" onClick={openMailto}>
          Email request
        </Button>
      </div>
      {msg ? (
        <p className="text-sm text-[var(--av-muted)]" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
