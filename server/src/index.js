import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";

import { db, initDb } from "./db.js";
import { ensureProGrantForUserId } from "./pro-grant.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const uploadsDir = join(__dirname, "..", "data", "uploads");
mkdirSync(uploadsDir, { recursive: true });

const JWT_SECRET = process.env.JWT_SECRET || "anivault-dev-secret-change-me";
const PORT = Number(process.env.PORT || 3847);
const publicBase = process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${PORT}`;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

function isModerator(userId) {
  const row = db
    .prepare(
      "SELECT COUNT(*) AS c FROM memberships WHERE user_id = ? AND role IN ('admin','mod')"
    )
    .get(userId);
  return Boolean(row && Number(row.c) > 0);
}

function isServerAdmin(userId) {
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM memberships WHERE user_id = ? AND role = 'admin'")
    .get(userId);
  return Boolean(row && Number(row.c) > 0);
}

await initDb();

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

function authHeader(req) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  const token = h.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

async function ensureSeed() {
  const row = db.prepare("SELECT COUNT(*) AS c FROM users").get();
  if (row && Number(row.c) > 0) return;
  const id = randomUUID();
  const hash = await bcrypt.hash("demo1234", 10);
  db.prepare(
    "INSERT INTO users (id, email, password_hash, plan, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, "demo@anivault.local", hash, "pro", new Date().toISOString());
  const sid = randomUUID();
  db.prepare(
    "INSERT INTO servers (id, name, slug, description, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(
    sid,
    "General",
    "general",
    "Default community server",
    new Date().toISOString()
  );
  db.prepare("INSERT INTO memberships (user_id, server_id, role) VALUES (?, ?, ?)").run(
    id,
    sid,
    "admin"
  );
  const gid = randomUUID();
  db.prepare(
    "INSERT INTO gallery_items (id, user_id, title, status, image_path, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(gid, id, "Welcome", "approved", null, new Date().toISOString());
}

await ensureSeed();

function seedScheduleIfEmpty() {
  const row = db.prepare("SELECT COUNT(*) AS c FROM schedule_entries").get();
  if (row && Number(row.c) > 0) return;
  const id = randomUUID();
  const d = new Date();
  db.prepare(
    "INSERT INTO schedule_entries (id, title, entry_date, note, source_url, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    id,
    "Editorial calendar",
    d.toISOString().slice(0, 10),
    "Add releases in the server database or replace this row.",
    null,
    new Date().toISOString()
  );
}

seedScheduleIfEmpty();

const seriesRequestLastByIp = new Map();
const SERIES_REQ_COOLDOWN_MS = 60_000;

function clientIp(req) {
  const x = req.headers["x-forwarded-for"];
  if (typeof x === "string" && x.trim()) return x.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function normalizeAnimeId(raw) {
  const s = decodeURIComponent(String(raw || ""));
  if (s.length > 512) return "";
  return s;
}

app.get("/health", async () => ({ ok: true }));

app.post("/api/auth/register", async (req, reply) => {
  const { email, password } = req.body || {};
  if (!email || !password) return reply.code(400).send({ error: "email and password required" });
  const id = randomUUID();
  const hash = await bcrypt.hash(String(password), 10);
  const emailNorm = String(email).toLowerCase();
  const plan = "pro";
  try {
    db.prepare(
      "INSERT INTO users (id, email, password_hash, plan, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(id, emailNorm, hash, plan, new Date().toISOString());
  } catch {
    return reply.code(409).send({ error: "email already registered" });
  }
  const token = jwt.sign({ sub: id, email: emailNorm }, JWT_SECRET, { expiresIn: "30d" });
  return { token, plan };
});

app.post("/api/auth/login", async (req, reply) => {
  const { email, password } = req.body || {};
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email || "").toLowerCase());
  if (!row || !(await bcrypt.compare(String(password || ""), row.password_hash))) {
    return reply.code(401).send({ error: "invalid credentials" });
  }
  ensureProGrantForUserId(row.id);
  const updated = db.prepare("SELECT id, email, plan FROM users WHERE id = ?").get(row.id);
  const token = jwt.sign({ sub: updated.id, email: updated.email }, JWT_SECRET, {
    expiresIn: "30d",
  });
  return { token, plan: updated.plan };
});

app.get("/api/me", async (req, reply) => {
  const payload = authHeader(req);
  if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
  ensureProGrantForUserId(payload.sub);
  const row = db.prepare("SELECT id, email, plan FROM users WHERE id = ?").get(payload.sub);
  if (!row) return reply.code(404).send({ error: "not found" });
  return {
    user: {
      ...row,
      moderator: isModerator(payload.sub),
      admin: isServerAdmin(payload.sub),
    },
  };
});

app.get("/api/community/servers", async () => {
  const servers = db.prepare("SELECT id, name, slug, description FROM servers ORDER BY created_at").all();
  return { servers };
});

app.get("/api/gallery", async (req, reply) => {
  const status = (req.query && req.query.status) || "approved";
  const kindFilter = req.query && req.query.kind ? String(req.query.kind) : null;
  if (status === "pending") {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    if (!isModerator(payload.sub)) return reply.code(403).send({ error: "forbidden" });
  }
  const rows = kindFilter
    ? db
        .prepare(
          "SELECT id, title, status, image_path, kind, clip_meta FROM gallery_items WHERE status = ? AND kind = ? ORDER BY created_at DESC"
        )
        .all(status, kindFilter)
    : db
        .prepare(
          "SELECT id, title, status, image_path, kind, clip_meta FROM gallery_items WHERE status = ? ORDER BY created_at DESC"
        )
        .all(status);
  const items = rows.map((r) => {
    let clipMeta = null;
    if (r.clip_meta) {
      try {
        clipMeta = JSON.parse(String(r.clip_meta));
      } catch {
        clipMeta = null;
      }
    }
    return {
      id: r.id,
      title: r.title,
      status: r.status,
      kind: r.kind || "image",
      imageUrl: r.image_path ? `${publicBase}/uploads/${r.image_path}` : null,
      clipMeta,
    };
  });
  return { items };
});

app.post("/api/gallery/upload", async (req, reply) => {
  const payload = authHeader(req);
  if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
  const { title, imageBase64 } = req.body || {};
  if (!title || !imageBase64) return reply.code(400).send({ error: "title and imageBase64 required" });
  const id = randomUUID();
  const fname = `${id}.png`;
  const buf = Buffer.from(String(imageBase64).replace(/^data:image\/\w+;base64,/, ""), "base64");
  writeFileSync(join(uploadsDir, fname), buf);
  db.prepare(
    "INSERT INTO gallery_items (id, user_id, title, status, image_path, created_at, kind, clip_meta) VALUES (?, ?, ?, ?, ?, ?, 'image', NULL)"
  ).run(id, payload.sub, String(title), "pending", fname, new Date().toISOString());
  return { id, status: "pending" };
});

app.post("/api/gallery/clip", async (req, reply) => {
  const payload = authHeader(req);
  if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
  const { title, animeId, animeName, startSec, endSec, imageBase64 } = req.body || {};
  if (!title || !imageBase64) return reply.code(400).send({ error: "title and imageBase64 required" });
  const id = randomUUID();
  const fname = `${id}.png`;
  const buf = Buffer.from(String(imageBase64).replace(/^data:image\/\w+;base64,/, ""), "base64");
  writeFileSync(join(uploadsDir, fname), buf);
  const meta = JSON.stringify({
    animeId: animeId != null ? String(animeId) : null,
    animeName: animeName != null ? String(animeName) : null,
    startSec: typeof startSec === "number" ? startSec : Number(startSec) || 0,
    endSec: typeof endSec === "number" ? endSec : Number(endSec) || 0,
  });
  db.prepare(
    "INSERT INTO gallery_items (id, user_id, title, status, image_path, created_at, kind, clip_meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, payload.sub, String(title), "pending", fname, new Date().toISOString(), "clip", meta);
  return { id, status: "pending" };
});

app.get("/uploads/:name", async (req, reply) => {
  const safe = String(req.params.name).replace(/[^a-zA-Z0-9._-]/g, "");
  const p = join(uploadsDir, safe);
  if (!existsSync(p)) return reply.code(404).send({ error: "not found" });
  const buf = readFileSync(p);
  return reply.type("image/png").send(buf);
});

app.post("/api/moderation/approve", async (req, reply) => {
  const payload = authHeader(req);
  if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
  if (!isModerator(payload.sub)) return reply.code(403).send({ error: "forbidden" });
  const { itemId } = req.body || {};
  if (!itemId) return reply.code(400).send({ error: "itemId required" });
  db.prepare("UPDATE gallery_items SET status = 'approved' WHERE id = ?").run(itemId);
  db.prepare("INSERT INTO audit_log (id, actor_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)").run(
    randomUUID(),
    payload.sub,
    "gallery.approve",
    itemId,
    new Date().toISOString()
  );
  return { ok: true };
});

app.post("/api/reports", async (req, reply) => {
  const payload = authHeader(req);
  if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
  const { targetType, targetId, reason } = req.body || {};
  if (!targetType || !targetId) {
    return reply.code(400).send({ error: "targetType and targetId required" });
  }
  const id = randomUUID();
  db.prepare(
    "INSERT INTO moderation_reports (id, target_type, target_id, reporter_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    id,
    String(targetType),
    String(targetId),
    payload.sub,
    reason ? String(reason) : "",
    new Date().toISOString()
  );
  db.prepare("INSERT INTO audit_log (id, actor_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)").run(
    randomUUID(),
    payload.sub,
    "report.create",
    id,
    new Date().toISOString()
  );
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
  const { title, note } = req.body || {};
  if (!title || !String(title).trim()) {
    return reply.code(400).send({ error: "title required" });
  }
  const payload = authHeader(req);
  const userId = payload?.sub ? String(payload.sub) : null;
  const id = randomUUID();
  db.prepare(
    "INSERT INTO series_requests (id, title, note, user_id, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)"
  ).run(
    id,
    String(title).trim().slice(0, 500),
    note != null ? String(note).slice(0, 2000) : "",
    userId,
    new Date().toISOString()
  );
  seriesRequestLastByIp.set(ip, now);
  return { ok: true, id };
});

app.get("/api/anime/:animeId/engagement", async (req, reply) => {
  const animeId = normalizeAnimeId(req.params.animeId);
  if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
  const agg = db
    .prepare(
      "SELECT AVG(rating) AS avg_rating, COUNT(*) AS rating_count FROM show_ratings WHERE anime_id = ?"
    )
    .get(animeId);
  const likesRow = db
    .prepare("SELECT COUNT(*) AS c FROM show_likes WHERE anime_id = ?")
    .get(animeId);
  const commentsRow = db
    .prepare("SELECT COUNT(*) AS c FROM show_comments WHERE anime_id = ?")
    .get(animeId);
  const payload = authHeader(req);
  let userRating = null;
  let userLiked = false;
  if (payload?.sub) {
    const ur = db
      .prepare("SELECT rating FROM show_ratings WHERE anime_id = ? AND user_id = ?")
      .get(animeId, payload.sub);
    userRating = ur ? Number(ur.rating) : null;
    const ul = db
      .prepare("SELECT 1 FROM show_likes WHERE anime_id = ? AND user_id = ?")
      .get(animeId, payload.sub);
    userLiked = Boolean(ul);
  }
  return {
    animeId,
    avgRating: agg?.avg_rating != null ? Number(agg.avg_rating) : null,
    ratingCount: agg?.rating_count != null ? Number(agg.rating_count) : 0,
    likesCount: likesRow ? Number(likesRow.c) : 0,
    commentsCount: commentsRow ? Number(commentsRow.c) : 0,
    userRating,
    userLiked,
  };
});

app.post("/api/anime/:animeId/rating", async (req, reply) => {
  const payload = authHeader(req);
  if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
  const animeId = normalizeAnimeId(req.params.animeId);
  if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
  const { rating } = req.body || {};
  const n = Number(rating);
  if (!Number.isFinite(n) || n < 1 || n > 10) {
    return reply.code(400).send({ error: "rating must be 1–10" });
  }
  const r = Math.round(n);
  db.prepare(
    "INSERT INTO show_ratings (user_id, anime_id, rating, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, anime_id) DO UPDATE SET rating = excluded.rating"
  ).run(payload.sub, animeId, r, new Date().toISOString());
  return { ok: true, rating: r };
});

app.post("/api/anime/:animeId/like", async (req, reply) => {
  const payload = authHeader(req);
  if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
  const animeId = normalizeAnimeId(req.params.animeId);
  if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
  const { liked } = req.body || {};
  if (liked !== true && liked !== false) {
    return reply.code(400).send({ error: "liked must be true or false" });
  }
  const ts = new Date().toISOString();
  if (liked === false) {
    db.prepare("DELETE FROM show_likes WHERE user_id = ? AND anime_id = ?").run(payload.sub, animeId);
  } else {
    db.prepare(
      "INSERT INTO show_likes (user_id, anime_id, created_at) VALUES (?, ?, ?) ON CONFLICT(user_id, anime_id) DO NOTHING"
    ).run(payload.sub, animeId, ts);
  }
  const row = db.prepare("SELECT COUNT(*) AS c FROM show_likes WHERE anime_id = ?").get(animeId);
  return { ok: true, likesCount: row ? Number(row.c) : 0, liked };
});

app.get("/api/anime/:animeId/comments", async (req, reply) => {
  const animeId = normalizeAnimeId(req.params.animeId);
  if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
  const limit = Math.min(100, Math.max(1, Number(req.query?.limit) || 20));
  const offset = Math.max(0, Number(req.query?.offset) || 0);
  const rows = db
    .prepare(
      "SELECT c.id, c.anime_id, c.user_id, c.body, c.created_at, u.email AS user_email FROM show_comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.anime_id = ? ORDER BY c.created_at DESC LIMIT ? OFFSET ?"
    )
    .all(animeId, limit, offset);
  return { comments: rows };
});

app.post("/api/anime/:animeId/comments", async (req, reply) => {
  const payload = authHeader(req);
  if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
  const animeId = normalizeAnimeId(req.params.animeId);
  if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
  const { body } = req.body || {};
  const text = body != null ? String(body).trim() : "";
  if (!text || text.length > 4000) {
    return reply.code(400).send({ error: "body required (max 4000 chars)" });
  }
  const id = randomUUID();
  db.prepare(
    "INSERT INTO show_comments (id, anime_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, animeId, payload.sub, text, new Date().toISOString());
  return { ok: true, id };
});

/** Server-side DeepL when `DEEPL_API_KEY` is set (optional). */
app.post("/api/translate", async (req, reply) => {
  const payload = authHeader(req);
  if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
  ensureProGrantForUserId(payload.sub);
  const key = process.env.DEEPL_API_KEY;
  if (!key) return reply.code(503).send({ error: "Server translation not configured" });
  const { text, targetLang } = req.body || {};
  if (!text || !targetLang) return reply.code(400).send({ error: "text and targetLang required" });
  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: [String(text)],
      target_lang: String(targetLang).toUpperCase().slice(0, 2),
    }),
  });
  if (!res.ok) return reply.code(502).send({ error: "translation provider error" });
  const data = await res.json();
  const out = data.translations?.[0]?.text ?? text;
  return { text: out };
});

app.post("/api/billing/checkout", async (req, reply) => {
  if (process.env.ENABLE_STRIPE_BILLING !== "true") {
    return reply.code(404).send({ error: "Billing is not enabled" });
  }
  if (!stripe || !process.env.STRIPE_PRICE_PRO) {
    return reply.code(503).send({ error: "Stripe not configured" });
  }
  const payload = authHeader(req);
  if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
  const base = publicBase.replace(/\/$/, "");
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_PRO, quantity: 1 }],
      success_url: `${base}/health?checkout=success`,
      cancel_url: `${base}/health?checkout=cancel`,
      client_reference_id: payload.sub,
    });
    if (!session.url) {
      return reply.code(502).send({ error: "Stripe did not return a checkout URL" });
    }
    return { url: session.url };
  } catch (err) {
    req.log.error(err);
    const msg = err && typeof err === "object" && "message" in err ? String(err.message) : "checkout failed";
    return reply.code(400).send({ error: msg });
  }
});

await app.listen({ port: PORT, host: "0.0.0.0" });
