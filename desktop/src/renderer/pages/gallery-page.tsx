import { ImageIcon, Loader2, RefreshCw, Scissors } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/renderer/components/ui/tabs";
import { anivaultFetch, type MeResponse } from "@/renderer/lib/anivault-api";

type GalleryItem = {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected";
  imageUrl: string | null;
  kind?: string;
  clipMeta?: {
    animeId?: string | null;
    animeName?: string | null;
    startSec?: number;
    endSec?: number;
  } | null;
};

export type GalleryPageTab = "browse" | "clips" | "upload" | "queue";

export type GalleryPageProps = {
  /** Default tab on mount (e.g. `/clips` opens the Clips tab). */
  defaultTab?: GalleryPageTab;
};

export function GalleryPage({ defaultTab = "browse" }: GalleryPageProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [pending, setPending] = useState<GalleryItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const loadApproved = useCallback(async () => {
    setErr(null);
    const res = await anivaultFetch<{ items: GalleryItem[] }>("/api/gallery?status=approved");
    if (!res.ok) {
      setErr(res.error ?? "Failed");
      setItems([]);
    } else {
      setItems(res.data?.items ?? []);
    }
  }, []);

  const loadPending = useCallback(async () => {
    const res = await anivaultFetch<{ items: GalleryItem[] }>("/api/gallery?status=pending");
    if (!res.ok) {
      setPending([]);
      return;
    }
    setPending(res.data?.items ?? []);
  }, []);

  const loadMe = useCallback(async () => {
    const res = await anivaultFetch<MeResponse>("/api/me");
    if (res.ok && res.data?.user) setMe(res.data.user);
    else setMe(null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    await loadMe();
    await loadApproved();
    await loadPending();
    setLoading(false);
  }, [loadApproved, loadMe, loadPending]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (itemId: string) => {
    const res = await anivaultFetch("/api/moderation/approve", {
      method: "POST",
      body: JSON.stringify({ itemId }),
    });
    if (!res.ok) {
      setErr(res.error ?? "Approve failed");
      return;
    }
    void load();
  };

  const onPickFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      void submitUpload(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const submitUpload = async (imageBase64: string) => {
    if (!uploadTitle.trim()) {
      setUploadMsg("Title required");
      return;
    }
    setUploadBusy(true);
    setUploadMsg(null);
    const res = await anivaultFetch("/api/gallery/upload", {
      method: "POST",
      body: JSON.stringify({ title: uploadTitle.trim(), imageBase64 }),
    });
    setUploadBusy(false);
    if (!res.ok) {
      setUploadMsg(res.error ?? "Upload failed");
      return;
    }
    setUploadMsg("Submitted for review");
    setUploadTitle("");
    void load();
  };

  const imageItems = items.filter((i) => (i.kind ?? "image") !== "clip");
  const clipItems = items.filter((i) => (i.kind ?? "image") === "clip");

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-2 text-[var(--av-text)]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--av-accent)]">
            Gallery
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Community art & clips</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--av-muted)]">
            Moderated uploads from the companion server. Images and player clips share the same review
            queue.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-2xl border-[var(--av-border)] bg-[var(--av-surface)] text-xs uppercase"
          onClick={() => void load()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-2 gap-1 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] p-1 sm:grid-cols-4">
          <TabsTrigger
            value="browse"
            className="rounded-xl text-xs uppercase data-[state=active]:bg-[var(--av-bg)]"
          >
            Art
          </TabsTrigger>
          <TabsTrigger
            value="clips"
            className="rounded-xl text-xs uppercase data-[state=active]:bg-[var(--av-bg)]"
          >
            Clips
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="rounded-xl text-xs uppercase data-[state=active]:bg-[var(--av-bg)]"
            disabled={!me}
          >
            Upload
          </TabsTrigger>
          <TabsTrigger
            value="queue"
            className="rounded-xl text-xs uppercase data-[state=active]:bg-[var(--av-bg)]"
            disabled={!me?.moderator}
          >
            Queue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--av-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : err ? (
            <p className="text-sm text-red-400" role="alert">
              {err}
            </p>
          ) : imageItems.length === 0 ? (
            <p className="text-sm text-[var(--av-muted)]">No approved art yet.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {imageItems.map((it) => (
                <li
                  key={it.id}
                  className="overflow-hidden rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg-elevated)] shadow-sm"
                >
                  {it.imageUrl ? (
                    <img
                      src={it.imageUrl}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-[var(--av-surface)] text-xs text-[var(--av-muted)]">
                      No image
                    </div>
                  )}
                  <p className="truncate p-3 text-xs font-semibold uppercase tracking-wide">
                    {it.title}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="clips" className="mt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--av-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : clipItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--av-border)] bg-[var(--av-surface)] p-8 text-center">
              <Scissors className="mx-auto h-10 w-10 text-[var(--av-muted)]" />
              <p className="mt-3 text-sm text-[var(--av-muted)]">No approved clips yet.</p>
              <Link
                to="/clips"
                className="mt-2 inline-block text-sm font-medium text-[var(--av-accent)] underline-offset-4 hover:underline"
              >
                Open clips hub
              </Link>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clipItems.map((it) => (
                <li
                  key={it.id}
                  className="overflow-hidden rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg-elevated)]"
                >
                  {it.imageUrl ? (
                    <img src={it.imageUrl} alt="" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-[var(--av-surface)] text-xs">
                      No thumbnail
                    </div>
                  )}
                  <div className="space-y-1 p-3">
                    <p className="font-semibold leading-snug">{it.title}</p>
                    {it.clipMeta?.animeName ? (
                      <p className="text-xs text-[var(--av-muted)]">{it.clipMeta.animeName}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent
          value="upload"
          className="mt-6 space-y-3 rounded-3xl border border-[var(--av-border)] bg-[var(--av-surface)] p-6"
        >
          {!me ? (
            <p className="text-sm text-[var(--av-muted)]">Sign in under Account to upload.</p>
          ) : (
            <>
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-wide text-[var(--av-muted)]">Title</span>
                <Input
                  className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Piece title"
                />
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm file:mr-2 file:rounded-xl file:border file:border-[var(--av-border)] file:bg-[var(--av-bg)] file:px-3 file:py-2"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  disabled={uploadBusy}
                />
              </div>
              {uploadMsg ? (
                <p className="text-xs font-medium text-[var(--av-muted)]">{uploadMsg}</p>
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="queue" className="mt-6 space-y-4">
          {!me?.moderator ? (
            <p className="text-sm text-[var(--av-muted)]">Moderator tools require server role.</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-[var(--av-muted)]">No pending items.</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((it) => (
                <li
                  key={it.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg-elevated)] p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {(it.kind ?? "image") === "clip" ? (
                        <Scissors className="h-4 w-4 shrink-0 text-[var(--av-accent)]" />
                      ) : (
                        <ImageIcon className="h-4 w-4 shrink-0 text-[var(--av-muted)]" />
                      )}
                      <p className="truncate font-semibold">{it.title}</p>
                    </div>
                    <p className="font-mono text-[10px] text-[var(--av-muted-foreground)]">{it.id}</p>
                  </div>
                  {it.imageUrl ? (
                    <img
                      src={it.imageUrl}
                      alt=""
                      className="h-16 w-28 rounded-lg object-cover"
                    />
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl text-xs uppercase"
                    onClick={() => void approve(it.id)}
                  >
                    Approve
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
