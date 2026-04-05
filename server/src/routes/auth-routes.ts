import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

import { db } from "../db.js";
import {
  authHeader,
  isModerator,
  isServerAdmin,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "../auth.js";
import { ensureProGrantForUserId } from "../pro-grant.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/auth/register", async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = (req.body as Record<string, unknown>) || {};
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
    const token = signAccessToken(id, emailNorm);
    const refreshToken = signRefreshToken(id, emailNorm);
    return { token, refreshToken, plan };
  });

  app.post("/v1/auth/login", async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = (req.body as Record<string, unknown>) || {};
    const row = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(String(email || "").toLowerCase());
    if (!row || !(await bcrypt.compare(String(password || ""), String(row.password_hash)))) {
      return reply.code(401).send({ error: "invalid credentials" });
    }
    ensureProGrantForUserId(String(row.id));
    const updated = db.prepare("SELECT id, email, plan FROM users WHERE id = ?").get(row.id);
    const token = signAccessToken(String(updated!.id), String(updated!.email));
    const refreshToken = signRefreshToken(String(updated!.id), String(updated!.email));
    return { token, refreshToken, plan: updated!.plan };
  });

  app.post("/v1/auth/refresh", async (req: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = (req.body as Record<string, unknown>) || {};
    if (!refreshToken || typeof refreshToken !== "string") {
      return reply.code(400).send({ error: "refreshToken required" });
    }
    const payload = verifyToken(refreshToken);
    if (!payload?.sub) return reply.code(401).send({ error: "invalid or expired refresh token" });
    const user = db.prepare("SELECT id, email, plan FROM users WHERE id = ?").get(payload.sub);
    if (!user) return reply.code(404).send({ error: "user not found" });
    const newAccess = signAccessToken(String(user.id), String(user.email));
    const newRefresh = signRefreshToken(String(user.id), String(user.email));
    return { token: newAccess, refreshToken: newRefresh };
  });

  app.get("/v1/me", async (req: FastifyRequest, reply: FastifyReply) => {
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

  // Legacy unversioned aliases for backward compatibility
  app.post("/api/auth/register", async (req, reply) => {
    const { email, password } = (req.body as Record<string, unknown>) || {};
    if (!email || !password) return reply.code(400).send({ error: "email and password required" });
    const id = randomUUID();
    const hash = await bcrypt.hash(String(password), 10);
    const emailNorm = String(email).toLowerCase();
    try {
      db.prepare(
        "INSERT INTO users (id, email, password_hash, plan, created_at) VALUES (?, ?, ?, ?, ?)"
      ).run(id, emailNorm, hash, "pro", new Date().toISOString());
    } catch {
      return reply.code(409).send({ error: "email already registered" });
    }
    const token = signAccessToken(id, emailNorm);
    return { token, plan: "pro" };
  });

  app.post("/api/auth/login", async (req, reply) => {
    const { email, password } = (req.body as Record<string, unknown>) || {};
    const row = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(String(email || "").toLowerCase());
    if (!row || !(await bcrypt.compare(String(password || ""), String(row.password_hash)))) {
      return reply.code(401).send({ error: "invalid credentials" });
    }
    ensureProGrantForUserId(String(row.id));
    const updated = db.prepare("SELECT id, email, plan FROM users WHERE id = ?").get(row.id);
    const token = signAccessToken(String(updated!.id), String(updated!.email));
    return { token, plan: updated!.plan };
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
}
