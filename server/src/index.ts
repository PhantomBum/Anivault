import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import bcrypt from "bcryptjs";

import { db, initDb } from "./db.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth-routes.js";
import { galleryRoutes } from "./routes/gallery-routes.js";
import { communityRoutes } from "./routes/community-routes.js";
import { engagementRoutes } from "./routes/engagement-routes.js";
import { billingRoutes } from "./routes/billing-routes.js";
import { translateRoutes } from "./routes/translate-routes.js";
import { webhookRoutes } from "./routes/webhook-routes.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const uploadsDir = join(__dirname, "..", "data", "uploads");
mkdirSync(uploadsDir, { recursive: true });

const PORT = Number(process.env.PORT || 3847);
const publicBase = process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${PORT}`;

await initDb();

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

async function ensureSeed(): Promise<void> {
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
  ).run(sid, "General", "general", "Default community server", new Date().toISOString());
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

function seedScheduleIfEmpty(): void {
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

await ensureSeed();
seedScheduleIfEmpty();

// Register route modules
await app.register(healthRoutes);
await app.register(authRoutes);
await app.register(galleryRoutes, { uploadsDir, publicBase });
await app.register(communityRoutes);
await app.register(engagementRoutes);
await app.register(billingRoutes, { publicBase });
await app.register(translateRoutes);
await app.register(webhookRoutes);

await app.listen({ port: PORT, host: "0.0.0.0" });
