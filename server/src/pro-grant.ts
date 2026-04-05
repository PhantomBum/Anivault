import { db } from "./db.js";

/**
 * Ensure the user has full catalog access (`plan` = `pro`).
 * All authenticated accounts are treated as entitled.
 */
export function ensureProGrantForUserId(userId: string): "pro" | "free" {
  const row = db.prepare("SELECT plan FROM users WHERE id = ?").get(userId);
  if (!row) return "free";
  if (row.plan !== "pro") {
    db.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").run(userId);
  }
  return "pro";
}
