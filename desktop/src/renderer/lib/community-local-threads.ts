/**
 * Per-server discussion threads stored only on this device (localStorage).
 * Companion API may add server-backed threads later; this unblocks UX without a server.
 */

const LS_KEY = "anivault:community-local-threads:v1";
export const GENERAL_SERVER_ID = "__general__";

export type LocalReply = {
  id: string;
  body: string;
  createdAt: number;
};

export type LocalThread = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  replies: LocalReply[];
};

type StoreShape = {
  byServerId: Record<string, LocalThread[]>;
};

function readStore(): StoreShape {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { byServerId: {} };
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || typeof parsed !== "object" || !parsed.byServerId) return { byServerId: {} };
    return parsed;
  } catch {
    return { byServerId: {} };
  }
}

function writeStore(s: StoreShape) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* quota */
  }
}

export function listLocalThreads(serverId: string): LocalThread[] {
  const s = readStore();
  return [...(s.byServerId[serverId] ?? [])].sort((a, b) => b.createdAt - a.createdAt);
}

export function addLocalThread(serverId: string, title: string, body: string): LocalThread | null {
  const t = title.trim();
  const b = body.trim();
  if (!t || !b) return null;
  const thread: LocalThread = {
    id: crypto.randomUUID(),
    title: t.slice(0, 200),
    body: b.slice(0, 4000),
    createdAt: Date.now(),
    replies: [],
  };
  const s = readStore();
  const list = s.byServerId[serverId] ?? [];
  const next = [thread, ...list].slice(0, 200);
  s.byServerId[serverId] = next;
  writeStore(s);
  return thread;
}

export function addLocalReply(serverId: string, threadId: string, body: string): LocalReply | null {
  const b = body.trim();
  if (!b) return null;
  const reply: LocalReply = {
    id: crypto.randomUUID(),
    body: b.slice(0, 4000),
    createdAt: Date.now(),
  };
  const s = readStore();
  const list = s.byServerId[serverId] ?? [];
  const idx = list.findIndex((x) => x.id === threadId);
  if (idx < 0) return null;
  const th = list[idx];
  const replies = [...th.replies, reply].slice(-100);
  const updated = { ...th, replies };
  const copy = [...list];
  copy[idx] = updated;
  s.byServerId[serverId] = copy;
  writeStore(s);
  return reply;
}

export function deleteLocalThread(serverId: string, threadId: string): void {
  const s = readStore();
  const list = s.byServerId[serverId] ?? [];
  s.byServerId[serverId] = list.filter((x) => x.id !== threadId);
  writeStore(s);
}
