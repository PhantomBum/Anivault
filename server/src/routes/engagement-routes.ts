import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";

import { db } from "../db.js";
import { authHeader } from "../auth.js";

function normalizeAnimeId(raw: unknown): string {
  const s = decodeURIComponent(String(raw || ""));
  if (s.length > 512) return "";
  return s;
}

export async function engagementRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/anime/:animeId/engagement", async (req: FastifyRequest, reply: FastifyReply) => {
    const animeId = normalizeAnimeId((req.params as Record<string, string>).animeId);
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
    let userRating: number | null = null;
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

  app.post("/v1/anime/:animeId/rating", async (req: FastifyRequest, reply: FastifyReply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    const animeId = normalizeAnimeId((req.params as Record<string, string>).animeId);
    if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
    const { rating } = (req.body as Record<string, unknown>) || {};
    const n = Number(rating);
    if (!Number.isFinite(n) || n < 1 || n > 10) {
      return reply.code(400).send({ error: "rating must be 1-10" });
    }
    const r = Math.round(n);
    db.prepare(
      "INSERT INTO show_ratings (user_id, anime_id, rating, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, anime_id) DO UPDATE SET rating = excluded.rating"
    ).run(payload.sub, animeId, r, new Date().toISOString());
    return { ok: true, rating: r };
  });

  app.post("/v1/anime/:animeId/like", async (req: FastifyRequest, reply: FastifyReply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    const animeId = normalizeAnimeId((req.params as Record<string, string>).animeId);
    if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
    const { liked } = (req.body as Record<string, unknown>) || {};
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

  app.get("/v1/anime/:animeId/comments", async (req: FastifyRequest, reply: FastifyReply) => {
    const animeId = normalizeAnimeId((req.params as Record<string, string>).animeId);
    if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
    const query = req.query as Record<string, string | undefined>;
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = Math.max(0, Number(query.offset) || 0);
    const rows = db
      .prepare(
        "SELECT c.id, c.anime_id, c.user_id, c.body, c.created_at, u.email AS user_email FROM show_comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.anime_id = ? ORDER BY c.created_at DESC LIMIT ? OFFSET ?"
      )
      .all(animeId, limit, offset);
    return { comments: rows };
  });

  app.post("/v1/anime/:animeId/comments", async (req: FastifyRequest, reply: FastifyReply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    const animeId = normalizeAnimeId((req.params as Record<string, string>).animeId);
    if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
    const { body } = (req.body as Record<string, unknown>) || {};
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

  // Legacy unversioned aliases
  app.get("/api/anime/:animeId/engagement", async (req, reply) => {
    const animeId = normalizeAnimeId((req.params as Record<string, string>).animeId);
    if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
    const agg = db
      .prepare(
        "SELECT AVG(rating) AS avg_rating, COUNT(*) AS rating_count FROM show_ratings WHERE anime_id = ?"
      )
      .get(animeId);
    const likesRow = db.prepare("SELECT COUNT(*) AS c FROM show_likes WHERE anime_id = ?").get(animeId);
    const commentsRow = db.prepare("SELECT COUNT(*) AS c FROM show_comments WHERE anime_id = ?").get(animeId);
    const payload = authHeader(req);
    let userRating: number | null = null;
    let userLiked = false;
    if (payload?.sub) {
      const ur = db.prepare("SELECT rating FROM show_ratings WHERE anime_id = ? AND user_id = ?").get(animeId, payload.sub);
      userRating = ur ? Number(ur.rating) : null;
      const ul = db.prepare("SELECT 1 FROM show_likes WHERE anime_id = ? AND user_id = ?").get(animeId, payload.sub);
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
    const animeId = normalizeAnimeId((req.params as Record<string, string>).animeId);
    if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
    const { rating } = (req.body as Record<string, unknown>) || {};
    const n = Number(rating);
    if (!Number.isFinite(n) || n < 1 || n > 10) return reply.code(400).send({ error: "rating must be 1-10" });
    const r = Math.round(n);
    db.prepare(
      "INSERT INTO show_ratings (user_id, anime_id, rating, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, anime_id) DO UPDATE SET rating = excluded.rating"
    ).run(payload.sub, animeId, r, new Date().toISOString());
    return { ok: true, rating: r };
  });

  app.post("/api/anime/:animeId/like", async (req, reply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    const animeId = normalizeAnimeId((req.params as Record<string, string>).animeId);
    if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
    const { liked } = (req.body as Record<string, unknown>) || {};
    if (liked !== true && liked !== false) return reply.code(400).send({ error: "liked must be true or false" });
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
    const animeId = normalizeAnimeId((req.params as Record<string, string>).animeId);
    if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
    const query = req.query as Record<string, string | undefined>;
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = Math.max(0, Number(query.offset) || 0);
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
    const animeId = normalizeAnimeId((req.params as Record<string, string>).animeId);
    if (!animeId) return reply.code(400).send({ error: "invalid anime id" });
    const { body } = (req.body as Record<string, unknown>) || {};
    const text = body != null ? String(body).trim() : "";
    if (!text || text.length > 4000) return reply.code(400).send({ error: "body required (max 4000 chars)" });
    const id = randomUUID();
    db.prepare(
      "INSERT INTO show_comments (id, anime_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(id, animeId, payload.sub, text, new Date().toISOString());
    return { ok: true, id };
  });
}
