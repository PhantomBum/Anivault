import React, { useState } from "react";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { anivaultFetch } from "@/renderer/lib/anivault-api";

export function RequestSeriesPage() {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        setMsg("Request received. Thank you!");
        setTitle("");
        setNote("");
      } else {
        setMsg(res.error ?? "Request failed");
      }
    })();
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-4 text-[var(--av-text)]">
      <p className="text-sm text-[var(--av-muted)]">
        Suggest a series for the catalog. Requests are reviewed; availability depends on ani-cli
        sources.
      </p>
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--av-muted)]">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Series name"
          className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)]"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--av-muted)]">Note (optional)</label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Year, season, or link"
          className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)]"
        />
      </div>
      <Button type="button" className="rounded-xl" disabled={busy} onClick={submit}>
        {busy ? "Sending…" : "Submit request"}
      </Button>
      {msg ? (
        <p className="text-sm text-[var(--av-muted)]" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
