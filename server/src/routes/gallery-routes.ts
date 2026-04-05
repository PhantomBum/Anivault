import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { db } from "../db.js";
import { authHeader, isModerator } from "../auth.js";
import type { ClipMeta } from "../api-types.js";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export async function galleryRoutes(
  app: FastifyInstance,
  opts: { uploadsDir: string; publicBase: string }
): Promise<void> {
  const { uploadsDir, publicBase } = opts;

  function parseGalleryRow(r: Record<string, unknown>): Record<string, unknown> {
    let clipMeta: ClipMeta | null = null;
    if (r.clip_meta) {
      try {
        clipMeta = JSON.parse(String(r.clip_meta)) as ClipMeta;
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
  }

  // v1 gallery routes
  app.get("/v1/gallery", async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string | undefined>;
    const status = query.status || "approved";
    const kindFilter = query.kind ? String(query.kind) : null;
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
    return { items: rows.map(parseGalleryRow) };
  });

  app.post("/v1/gallery/upload", async (req: FastifyRequest, reply: FastifyReply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    const body = (req.body as Record<string, unknown>) || {};
    const { title, imageBase64 } = body;
    if (!title || !imageBase64) return reply.code(400).send({ error: "title and imageBase64 required" });
    const raw = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(raw, "base64");
    if (buf.length > MAX_UPLOAD_SIZE_BYTES) {
      return reply.code(413).send({ error: "Image exceeds 10 MB limit" });
    }
    const id = randomUUID();
    const fname = `${id}.png`;
    writeFileSync(join(uploadsDir, fname), buf);
    db.prepare(
      "INSERT INTO gallery_items (id, user_id, title, status, image_path, created_at, kind, clip_meta) VALUES (?, ?, ?, ?, ?, ?, 'image', NULL)"
    ).run(id, payload.sub, String(title), "pending", fname, new Date().toISOString());
    return { id, status: "pending" };
  });

  app.post("/v1/gallery/clip", async (req: FastifyRequest, reply: FastifyReply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    const body = (req.body as Record<string, unknown>) || {};
    const { title, animeId, animeName, startSec, endSec, imageBase64 } = body;
    if (!title || !imageBase64) return reply.code(400).send({ error: "title and imageBase64 required" });
    const raw = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(raw, "base64");
    if (buf.length > MAX_UPLOAD_SIZE_BYTES) {
      return reply.code(413).send({ error: "Image exceeds 10 MB limit" });
    }
    const id = randomUUID();
    const fname = `${id}.png`;
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

  app.get("/uploads/:name", async (req: FastifyRequest, reply: FastifyReply) => {
    const safe = String((req.params as Record<string, string>).name).replace(/[^a-zA-Z0-9._-]/g, "");
    const p = join(uploadsDir, safe);
    if (!existsSync(p)) return reply.code(404).send({ error: "not found" });
    const buf = readFileSync(p);
    return reply.type("image/png").send(buf);
  });

  // Legacy unversioned aliases
  app.get("/api/gallery", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;
    const status = query.status || "approved";
    const kindFilter = query.kind ? String(query.kind) : null;
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
    return { items: rows.map(parseGalleryRow) };
  });

  app.post("/api/gallery/upload", async (req, reply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    const body = (req.body as Record<string, unknown>) || {};
    if (!body.title || !body.imageBase64) return reply.code(400).send({ error: "title and imageBase64 required" });
    const id = randomUUID();
    const fname = `${id}.png`;
    const buf = Buffer.from(String(body.imageBase64).replace(/^data:image\/\w+;base64,/, ""), "base64");
    writeFileSync(join(uploadsDir, fname), buf);
    db.prepare(
      "INSERT INTO gallery_items (id, user_id, title, status, image_path, created_at, kind, clip_meta) VALUES (?, ?, ?, ?, ?, ?, 'image', NULL)"
    ).run(id, payload.sub, String(body.title), "pending", fname, new Date().toISOString());
    return { id, status: "pending" };
  });

  app.post("/api/gallery/clip", async (req, reply) => {
    const payload = authHeader(req);
    if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
    const body = (req.body as Record<string, unknown>) || {};
    if (!body.title || !body.imageBase64) return reply.code(400).send({ error: "title and imageBase64 required" });
    const id = randomUUID();
    const fname = `${id}.png`;
    const buf = Buffer.from(String(body.imageBase64).replace(/^data:image\/\w+;base64,/, ""), "base64");
    writeFileSync(join(uploadsDir, fname), buf);
    const meta = JSON.stringify({
      animeId: body.animeId != null ? String(body.animeId) : null,
      animeName: body.animeName != null ? String(body.animeName) : null,
      startSec: typeof body.startSec === "number" ? body.startSec : Number(body.startSec) || 0,
      endSec: typeof body.endSec === "number" ? body.endSec : Number(body.endSec) || 0,
    });
    db.prepare(
      "INSERT INTO gallery_items (id, user_id, title, status, image_path, created_at, kind, clip_meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, payload.sub, String(body.title), "pending", fname, new Date().toISOString(), "clip", meta);
    return { id, status: "pending" };
  });
}
