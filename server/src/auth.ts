import type { FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

import { db } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "anivault-dev-secret-change-me";

/** Default token lifetime. Refresh tokens will use a longer window. */
export const TOKEN_EXPIRY = "30d" as const;
export const REFRESH_TOKEN_EXPIRY = "90d" as const;

export interface JwtPayload {
  sub: string;
  email: string;
  kind?: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export function signAccessToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email, kind: "access" }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

export function signRefreshToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email, kind: "refresh" }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function authHeader(req: FastifyRequest): JwtPayload | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  const token = h.slice(7);
  return verifyToken(token);
}

export function isModerator(userId: string): boolean {
  const row = db
    .prepare(
      "SELECT COUNT(*) AS c FROM memberships WHERE user_id = ? AND role IN ('admin','mod')"
    )
    .get(userId);
  return Boolean(row && Number(row.c) > 0);
}

export function isServerAdmin(userId: string): boolean {
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM memberships WHERE user_id = ? AND role = 'admin'")
    .get(userId);
  return Boolean(row && Number(row.c) > 0);
}
