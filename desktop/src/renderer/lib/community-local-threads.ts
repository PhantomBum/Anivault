/**
 * Per-server discussion threads stored only on this device (localStorage).
 * Companion API may add server-backed threads later; this unblocks UX without a server.
 */

const LS_KEY = "anivault:community-local-threads:v1";
export const GENERAL_SERVER_ID = "__general__";

function newRandomId(): string {
  const w = globalThis as unknown as { crypto: { randomUUID(): string } };
  return w.crypto.randomUUID();
}

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

function isValidThread(t: unknown): t is LocalThread {
  if (!t || typeof t !== "object") return false;
  const o = t as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.title !== "string" ||
    typeof o.body !== "string" ||
    typeof o.createdAt !== "number" ||
    !Array.isArray(o.replies)
  ) {
    return false;
  }
  return o.replies.every(
    (r) =>
      r &&
      typeof r === "object" &&
      typeof (r as LocalReply).id === "string" &&
      typeof (r as LocalReply).body === "string" &&
      typeof (r as LocalReply).createdAt === "number"
  );
}

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
    id: newRandomId(),
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
    id: newRandomId(),
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

/** JSON backup for Settings → export or manual backup. */
export function exportLocalThreadsJson(): string {
  return JSON.stringify(readStore(), null, 2);
}

export function importLocalThreadsJson(
  raw: string,
  mode: "replace" | "merge"
): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || !("byServerId" in parsed)) {
      return { ok: false, error: "Invalid backup file." };
    }
    const incoming = parsed as StoreShape;
    if (typeof incoming.byServerId !== "object" || incoming.byServerId === null) {
      return { ok: false, error: "Invalid backup file." };
    }

    if (mode === "replace") {
      const clean: StoreShape = { byServerId: {} };
      for (const [sid, threads] of Object.entries(incoming.byServerId)) {
        if (!Array.isArray(threads)) continue;
        const ok = threads.filter(isValidThread);
        if (ok.length > 0) clean.byServerId[sid] = ok.slice(0, 200);
      }
      writeStore(clean);
      return { ok: true };
    }

    const cur = readStore();
    const merged: StoreShape = { byServerId: { ...cur.byServerId } };
    for (const [sid, threads] of Object.entries(incoming.byServerId)) {
      if (!Array.isArray(threads)) continue;
      const existing = merged.byServerId[sid] ?? [];
      const byId = new Map(existing.map((t) => [t.id, t]));
      for (const t of threads) {
        if (isValidThread(t)) {
          byId.set(t.id, t);
        }
      }
      merged.byServerId[sid] = [...byId.values()]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 200);
    }
    writeStore(merged);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON." };
  }
}
