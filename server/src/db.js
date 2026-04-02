import initSqlJs from "sql.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });
const dbPath = join(dataDir, "anivault.sqlite");

let sqlDb;

function persist() {
  if (!sqlDb) return;
  const data = sqlDb.export();
  writeFileSync(dbPath, Buffer.from(data));
}

function wrapPrepare(sql) {
  return {
    get(...params) {
      const stmt = sqlDb.prepare(sql);
      try {
        if (params.length) stmt.bind(params);
        if (!stmt.step()) return undefined;
        return stmt.getAsObject();
      } finally {
        stmt.free();
      }
    },
    all(...params) {
      const stmt = sqlDb.prepare(sql);
      try {
        if (params.length) stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        return rows;
      } finally {
        stmt.free();
      }
    },
    run(...params) {
      if (params.length) sqlDb.run(sql, params);
      else sqlDb.run(sql);
      persist();
    },
  };
}

/** @type {{ prepare: (sql: string) => ReturnType<typeof wrapPrepare> }} */
export let db;

export async function initDb() {
  const SQL = await initSqlJs({
    locateFile: (file) => join(__dirname, "..", "node_modules", "sql.js", "dist", file),
  });
  if (existsSync(dbPath)) {
    const buf = readFileSync(dbPath);
    sqlDb = new SQL.Database(buf);
  } else {
    sqlDb = new SQL.Database();
  }

  sqlDb.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memberships (
  user_id TEXT NOT NULL,
  server_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (user_id, server_id)
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  image_path TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS moderation_reports (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule_entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  note TEXT,
  source_url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS series_requests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  note TEXT,
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS show_ratings (
  user_id TEXT NOT NULL,
  anime_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, anime_id)
);

CREATE TABLE IF NOT EXISTS show_likes (
  user_id TEXT NOT NULL,
  anime_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, anime_id)
);

CREATE TABLE IF NOT EXISTS show_comments (
  id TEXT PRIMARY KEY,
  anime_id TEXT NOT NULL,
  user_id TEXT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`);
  try {
    sqlDb.exec(`ALTER TABLE gallery_items ADD COLUMN kind TEXT NOT NULL DEFAULT 'image';`);
  } catch {
    /* column exists */
  }
  try {
    sqlDb.exec(`ALTER TABLE gallery_items ADD COLUMN clip_meta TEXT;`);
  } catch {
    /* column exists */
  }
  try {
    sqlDb.exec(`UPDATE users SET plan = 'pro' WHERE plan IS NOT NULL;`);
  } catch {
    /* ignore */
  }
  persist();

  db = {
    prepare(sql) {
      return wrapPrepare(sql);
    },
  };
}
