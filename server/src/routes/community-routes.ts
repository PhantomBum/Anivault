import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";

import { db } from "../db.js";
import { authHeader, isModerator, isServerAdmin } from "../auth.js";
import { ensureProGrantForUserId } from "../pro-grant.js";

function normalizeAnimeId(raw: unknown): string {
  const s = decodeURIComponent(String(raw || ""));
  if (s.length > 512) return "";
  return s;
}

function clientIp(req: FastifyRequest): string {
  const x = req.headers["x-forwarded-for"];
  if (typeof x === "string" && x.trim()) return x.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

const seriesRequestLastByIp = new Map<string, number>();
const SERIES_REQ_COOLDOWN_MS = 60_000;

export async function communityRoutes(app: FastifyInstance): Promise<void> {
  // Servers
  app.get("/v1/community/servers", async () => {
    const servers = db
      .prepare("SELECT id, name, slug, description FROM servers ORDER BY created_at")
      .all();
    return { servers };
  });

  // Moderation
  app.post("/v1/moderation/approve", async (req: FastifyRequest, reply: FastifyReply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    if (!isModerator(payload.sub)) return reply.code(403).send({ error: "forbidden" });
    const { itemId } = (req.body as Record<string, unknown>) || {};
    if (!itemId) return reply.code(400).send({ error: "itemId required" });
    db.prepare("UPDATE gallery_items SET status = 'approved' WHERE id = ?").run(itemId);
    db.prepare(
      "INSERT INTO audit_log (id, actor_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(randomUUID(), payload.sub, "gallery.approve", String(itemId), new Date().toISOString());
    return { ok: true };
  });

  app.post("/v1/moderation/reject", async (req: FastifyRequest, reply: FastifyReply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    if (!isModerator(payload.sub)) return reply.code(403).send({ error: "forbidden" });
    const { itemId, reason } = (req.body as Record<string, unknown>) || {};
    if (!itemId) return reply.code(400).send({ error: "itemId required" });
    db.prepare("UPDATE gallery_items SET status = 'rejected' WHERE id = ?").run(itemId);
    db.prepare(
      "INSERT INTO audit_log (id, actor_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(
      randomUUID(),
      payload.sub,
      "gallery.reject",
      JSON.stringify({ itemId: String(itemId), reason: reason ? String(reason) : "" }),
      new Date().toISOString()
    );
    return { ok: true };
  });

  // Reports
  app.post("/v1/reports", async (req: FastifyRequest, reply: FastifyReply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    const { targetType, targetId, reason } = (req.body as Record<string, unknown>) || {};
    if (!targetType || !targetId) {
      return reply.code(400).send({ error: "targetType and targetId required" });
    }
    const id = randomUUID();
    db.prepare(
      "INSERT INTO moderation_reports (id, target_type, target_id, reporter_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, String(targetType), String(targetId), payload.sub, reason ? String(reason) : "", new Date().toISOString());
    db.prepare(
      "INSERT INTO audit_log (id, actor_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(randomUUID(), payload.sub, "report.create", id, new Date().toISOString());
    return { ok: true, id };
  });

  app.get("/v1/reports", async (req: FastifyRequest, reply: FastifyReply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    if (!isModerator(payload.sub)) return reply.code(403).send({ error: "forbidden" });
    const rows = db
      .prepare(
        "SELECT id, target_type, target_id, reporter_id, reason, created_at FROM moderation_reports ORDER BY created_at DESC LIMIT 200"
      )
      .all();
    return { reports: rows };
  });

  // Admin audit log
  app.get("/v1/admin/audit", async (req: FastifyRequest, reply: FastifyReply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    if (!isServerAdmin(payload.sub)) return reply.code(403).send({ error: "forbidden" });
    const rows = db
      .prepare(
        "SELECT id, actor_id, action, detail, created_at FROM audit_log ORDER BY created_at DESC LIMIT 200"
      )
      .all();
    return { entries: rows };
  });

  // Schedule
  app.get("/v1/schedule", async () => {
    const rows = db
      .prepare(
        "SELECT id, title, entry_date AS air_date, note, source_url FROM schedule_entries ORDER BY entry_date ASC"
      )
      .all();
    return { entries: rows };
  });

  // Series requests
  app.post("/v1/series-request", async (req: FastifyRequest, reply: FastifyReply) => {
    const ip = clientIp(req);
    const last = seriesRequestLastByIp.get(ip) || 0;
    const now = Date.now();
    if (now - last < SERIES_REQ_COOLDOWN_MS) {
      return reply.code(429).send({ error: "Too many requests; try again in a minute." });
    }
    const { title, note } = (req.body as Record<string, unknown>) || {};
    if (!title || !String(title).trim()) {
      return reply.code(400).send({ error: "title required" });
    }
    const payload = authHeader(req);
    const userId = payload?.sub ? String(payload.sub) : null;
    const id = randomUUID();
    db.prepare(
      "INSERT INTO series_requests (id, title, note, user_id, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)"
    ).run(id, String(title).trim().slice(0, 500), note != null ? String(note).slice(0, 2000) : "", userId, new Date().toISOString());
    seriesRequestLastByIp.set(ip, now);
    return { ok: true, id };
  });

  // Legacy unversioned aliases
  app.get("/api/community/servers", async () => {
    const servers = db
      .prepare("SELECT id, name, slug, description FROM servers ORDER BY created_at")
      .all();
    return { servers };
  });

  app.post("/api/moderation/approve", async (req, reply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    if (!isModerator(payload.sub)) return reply.code(403).send({ error: "forbidden" });
    const { itemId } = (req.body as Record<string, unknown>) || {};
    if (!itemId) return reply.code(400).send({ error: "itemId required" });
    db.prepare("UPDATE gallery_items SET status = 'approved' WHERE id = ?").run(itemId);
    db.prepare(
      "INSERT INTO audit_log (id, actor_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(randomUUID(), payload.sub, "gallery.approve", String(itemId), new Date().toISOString());
    return { ok: true };
  });

  app.post("/api/reports", async (req, reply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    const { targetType, targetId, reason } = (req.body as Record<string, unknown>) || {};
    if (!targetType || !targetId) {
      return reply.code(400).send({ error: "targetType and targetId required" });
    }
    const id = randomUUID();
    db.prepare(
      "INSERT INTO moderation_reports (id, target_type, target_id, reporter_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, String(targetType), String(targetId), payload.sub, reason ? String(reason) : "", new Date().toISOString());
    db.prepare(
      "INSERT INTO audit_log (id, actor_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(randomUUID(), payload.sub, "report.create", id, new Date().toISOString());
    return { ok: true, id };
  });

  app.get("/api/admin/audit", async (req, reply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    if (!isServerAdmin(payload.sub)) return reply.code(403).send({ error: "forbidden" });
    const rows = db
      .prepare(
        "SELECT id, actor_id, action, detail, created_at FROM audit_log ORDER BY created_at DESC LIMIT 200"
      )
      .all();
    return { entries: rows };
  });

  app.get("/api/schedule", async () => {
    const rows = db
      .prepare(
        "SELECT id, title, entry_date AS air_date, note, source_url FROM schedule_entries ORDER BY entry_date ASC"
      )
      .all();
    return { entries: rows };
  });

  app.post("/api/series-request", async (req, reply) => {
    const ip = clientIp(req);
    const last = seriesRequestLastByIp.get(ip) || 0;
    const now = Date.now();
    if (now - last < SERIES_REQ_COOLDOWN_MS) {
      return reply.code(429).send({ error: "Too many requests; try again in a minute." });
    }
    const { title, note } = (req.body as Record<string, unknown>) || {};
    if (!title || !String(title).trim()) {
      return reply.code(400).send({ error: "title required" });
    }
    const payload = authHeader(req);
    const userId = payload?.sub ? String(payload.sub) : null;
    const id = randomUUID();
    db.prepare(
      "INSERT INTO series_requests (id, title, note, user_id, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)"
    ).run(id, String(title).trim().slice(0, 500), note != null ? String(note).slice(0, 2000) : "", userId, new Date().toISOString());
    seriesRequestLastByIp.set(ip, now);
    return { ok: true, id };
  });
}
