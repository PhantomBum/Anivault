import { MessageCircle, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import {
  GENERAL_SERVER_ID,
  addLocalReply,
  addLocalThread,
  deleteLocalThread,
  listLocalThreads,
  type LocalThread,
} from "@/renderer/lib/community-local-threads";

type ServerChip = { id: string; name: string };

export function CommunityLocalThreadsPanel({ servers }: { servers: ServerChip[] }) {
  const { t } = useTranslation();
  const options = useMemo((): ServerChip[] => {
    const base: ServerChip[] = [{ id: GENERAL_SERVER_ID, name: t("communityHub.generalServer") }];
    const seen = new Set(base.map((x) => x.id));
    for (const s of servers) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        base.push(s);
      }
    }
    return base;
  }, [servers, t]);

  const [serverId, setServerId] = useState(GENERAL_SERVER_ID);
  const [threads, setThreads] = useState<LocalThread[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [replyByThread, setReplyByThread] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setThreads(listLocalThreads(serverId));
  }, [serverId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!options.some((o) => o.id === serverId)) {
      setServerId(options[0]?.id ?? GENERAL_SERVER_ID);
    }
  }, [options, serverId]);

  const onPostThread = () => {
    const th = addLocalThread(serverId, newTitle, newBody);
    if (th) {
      setNewTitle("");
      setNewBody("");
      refresh();
    }
  };

  const onPostReply = (threadId: string) => {
    const body = replyByThread[threadId] ?? "";
    if (!addLocalReply(serverId, threadId, body)) return;
    setReplyByThread((prev) => ({ ...prev, [threadId]: "" }));
    refresh();
  };

  const onDelete = (threadId: string) => {
    deleteLocalThread(serverId, threadId);
    refresh();
    if (openId === threadId) setOpenId(null);
  };

  return (
    <section className="rounded-3xl border border-[var(--av-border)] bg-[var(--av-surface)]/60 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--av-accent-muted)] text-[var(--av-accent)]">
            <MessageCircle className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--av-muted)]">
              {t("communityHub.localThreadsTitle")}
            </h2>
            <p className="mt-1 text-sm text-[var(--av-muted)]">{t("communityHub.localThreadsHint")}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="self-center text-[10px] font-semibold uppercase tracking-wider text-[var(--av-muted)]">
          {t("communityHub.spaceLabel")}
        </span>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setServerId(o.id)}
            className={
              serverId === o.id
                ? "rounded-full border border-[var(--av-accent)] bg-[var(--av-accent-muted)] px-3 py-1 text-xs font-medium text-[var(--av-text)]"
                : "rounded-full border border-[var(--av-border)] bg-[var(--av-bg)] px-3 py-1 text-xs font-medium text-[var(--av-muted)] hover:border-[var(--av-accent-dim)]"
            }
          >
            {o.name}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg)]/40 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--av-muted)]">
          {t("communityHub.newThread")}
        </p>
        <Input
          className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
          placeholder={t("communityHub.newThreadTitlePh")}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <textarea
          className="min-h-[88px] w-full resize-y rounded-xl border border-[var(--av-border)] bg-[var(--av-bg)] px-3 py-2 text-sm text-[var(--av-text)] placeholder:text-[var(--av-muted)]"
          placeholder={t("communityHub.newThreadBodyPh")}
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          className="rounded-xl"
          disabled={!newTitle.trim() || !newBody.trim()}
          onClick={onPostThread}
        >
          {t("communityHub.postThread")}
        </Button>
      </div>

      <ul className="mt-6 space-y-3">
        {threads.length === 0 ? (
          <li className="text-sm text-[var(--av-muted)]">{t("communityHub.noThreads")}</li>
        ) : (
          threads.map((th) => {
            const expanded = openId === th.id;
            return (
              <li
                key={th.id}
                className="rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg-elevated)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setOpenId(expanded ? null : th.id)}
                  >
                    <p className="font-semibold text-[var(--av-text)]">{th.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--av-muted)]">{th.body}</p>
                    <p className="mt-2 text-[10px] text-[var(--av-muted-foreground)]">
                      {new Date(th.createdAt).toLocaleString()} · {th.replies.length}{" "}
                      {t("communityHub.replies")}
                    </p>
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-[var(--av-muted)] hover:text-red-400"
                    title={t("communityHub.deleteThread")}
                    onClick={() => onDelete(th.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {expanded ? (
                  <div className="mt-4 border-t border-[var(--av-border)] pt-4">
                    <p className="text-sm leading-relaxed text-[var(--av-text)]">{th.body}</p>
                    {th.replies.length > 0 ? (
                      <ul className="mt-3 space-y-2 border-l-2 border-[var(--av-border)] pl-3">
                        {th.replies.map((r) => (
                          <li key={r.id} className="text-sm text-[var(--av-muted)]">
                            {r.body}
                            <span className="ml-2 text-[10px] text-[var(--av-muted-foreground)]">
                              {new Date(r.createdAt).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Input
                        className="flex-1 rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
                        placeholder={t("communityHub.replyPh")}
                        value={replyByThread[th.id] ?? ""}
                        onChange={(e) =>
                          setReplyByThread((prev) => ({ ...prev, [th.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onPostReply(th.id);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl"
                        disabled={!(replyByThread[th.id] ?? "").trim()}
                        onClick={() => onPostReply(th.id)}
                      >
                        {t("communityHub.postReply")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
