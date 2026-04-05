/**
 * Shared API contract types for the AniVault companion server (v1).
 * Desktop renderer imports equivalent shapes via anivault-api.ts;
 * keeping canonical definitions here ensures the server is the source of truth.
 */

export const API_VERSION = "v1" as const;

export type ApiVersion = typeof API_VERSION;

export type Plan = "free" | "pro";

export type MemberRole = "admin" | "mod" | "member";

export interface UserRow {
  id: string;
  email: string;
  plan: Plan;
}

export interface MeResponse {
  user: UserRow & {
    moderator: boolean;
    admin: boolean;
  };
}

export interface AuthResponse {
  token: string;
  plan: Plan;
}

export interface ServerRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface GalleryItem {
  id: string;
  title: string;
  status: string;
  kind: "image" | "clip";
  imageUrl: string | null;
  clipMeta: ClipMeta | null;
}

export interface ClipMeta {
  animeId: string | null;
  animeName: string | null;
  startSec: number;
  endSec: number;
}

export interface ShowEngagement {
  animeId: string;
  avgRating: number | null;
  ratingCount: number;
  likesCount: number;
  commentsCount: number;
  userRating: number | null;
  userLiked: boolean;
}

export interface ShowComment {
  id: string;
  anime_id: string;
  user_id: string | null;
  body: string;
  created_at: string;
  user_email: string | null;
}

export interface ScheduleEntry {
  id: string;
  title: string;
  air_date: string;
  note: string | null;
  source_url: string | null;
}

export interface ModerationReport {
  id: string;
  target_type: string;
  target_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface SeriesRequest {
  id: string;
  title: string;
  note: string | null;
  user_id: string | null;
  status: string;
  created_at: string;
}

export interface ApiError {
  error: string;
}

export interface HealthResponse {
  ok: boolean;
  version: ApiVersion;
}
