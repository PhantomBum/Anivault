import type { AnivaultStoreSchema } from "@/shared/anivault-types";

async function getBaseUrl(): Promise<string> {
  if (typeof window !== "undefined" && window.anivault) {
    return window.anivault.getConfig("apiBaseUrl");
  }
  return "http://127.0.0.1:3847";
}

async function authHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined" && window.anivault) {
    const token = await window.anivault.getConfig("authToken");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function anivaultFetch<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const base = await getBaseUrl();
  const url = `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = { ...(await authHeaders()), ...init?.headers };

  const run = async (): Promise<{ ok: boolean; data?: T; error?: string }> => {
    const res = await fetch(url, {
      ...init,
      headers,
    });
    const json = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      return { ok: false, error: (json as { error?: string }).error ?? res.statusText };
    }
    return { ok: true, data: json as T };
  };

  try {
    return await run();
  } catch (first) {
    try {
      await new Promise((r) => setTimeout(r, 350));
      return await run();
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : first instanceof Error ? first.message : "Network error",
      };
    }
  }
}

export type MeResponse = {
  user: {
    id: string;
    email: string;
    plan: AnivaultStoreSchema["plan"];
    moderator?: boolean;
    admin?: boolean;
  };
};

export type ShowEngagementResponse = {
  animeId: string;
  avgRating: number | null;
  ratingCount: number;
  likesCount: number;
  commentsCount: number;
  userRating: number | null;
  userLiked: boolean;
};

export type ShowCommentRow = {
  id: string;
  anime_id: string;
  user_id: string | null;
  body: string;
  created_at: string;
  user_email: string | null;
};

export async function getShowEngagement(animeId: string) {
  const enc = encodeURIComponent(animeId);
  return anivaultFetch<ShowEngagementResponse>(`/v1/anime/${enc}/engagement`);
}

export async function postShowRating(animeId: string, rating: number) {
  const enc = encodeURIComponent(animeId);
  return anivaultFetch<{ ok: boolean; rating: number }>(`/v1/anime/${enc}/rating`, {
    method: "POST",
    body: JSON.stringify({ rating }),
  });
}

export async function postShowLike(animeId: string, liked: boolean) {
  const enc = encodeURIComponent(animeId);
  return anivaultFetch<{ ok: boolean; likesCount: number; liked: boolean }>(
    `/v1/anime/${enc}/like`,
    {
      method: "POST",
      body: JSON.stringify({ liked }),
    }
  );
}

export async function getShowComments(animeId: string, limit = 20, offset = 0) {
  const enc = encodeURIComponent(animeId);
  return anivaultFetch<{ comments: ShowCommentRow[] }>(
    `/v1/anime/${enc}/comments?limit=${limit}&offset=${offset}`
  );
}

export async function postShowComment(animeId: string, body: string) {
  const enc = encodeURIComponent(animeId);
  return anivaultFetch<{ ok: boolean; id: string }>(`/v1/anime/${enc}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

/** Gallery art upload (same contract as Gallery → Upload). */
export async function postGalleryUpload(title: string, imageBase64: string) {
  return anivaultFetch<{ ok?: boolean }>("/v1/gallery/upload", {
    method: "POST",
    body: JSON.stringify({ title: title.trim(), imageBase64 }),
  });
}

/** Gallery clip upload with anime metadata. */
export async function postGalleryClip(opts: {
  title: string;
  imageBase64: string;
  animeId?: string;
  animeName?: string;
  startSec?: number;
  endSec?: number;
}) {
  return anivaultFetch<{ id: string; status: string }>("/v1/gallery/clip", {
    method: "POST",
    body: JSON.stringify(opts),
  });
}

/** Report content for moderation review. */
export async function postReport(targetType: string, targetId: string, reason?: string) {
  return anivaultFetch<{ ok: boolean; id: string }>("/v1/reports", {
    method: "POST",
    body: JSON.stringify({ targetType, targetId, reason }),
  });
}

/** Refresh auth token using a refresh token. */
export async function refreshAuthToken(refreshToken: string) {
  return anivaultFetch<{ token: string; refreshToken: string }>("/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

/**
 * Quick reachability check for Settings / Data (phase 19). Does not validate full API surface.
 */
export async function testAnivaultServerConnection(): Promise<{ ok: boolean; message: string }> {
  const base = await getBaseUrl();
  const url = `${base.replace(/\/$/, "")}/v1/me`;
  try {
    const headers = await authHeaders();
    const res = await fetch(url, { method: "GET", headers });
    if (res.ok) {
      return { ok: true, message: "Connected — API responded successfully." };
    }
    if (res.status === 401 || res.status === 403) {
      return {
        ok: true,
        message: "Server reachable (sign in if your server requires authentication).",
      };
    }
    return { ok: false, message: `Server returned HTTP ${res.status}.` };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Network error — check URL and firewall.",
    };
  }
}
