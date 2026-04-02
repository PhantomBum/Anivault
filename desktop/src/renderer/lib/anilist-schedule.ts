/**
 * Weekly airing grid from AniList (public GraphQL). Labeled as AniList in the UI.
 */

import { fetchWithRetry } from "@/renderer/lib/fetch-with-retry";

export type AniListScheduleEntry = {
  id: string;
  title: string;
  air_date: string;
  note: string | null;
  episode: number | null;
};

type GqlResponse = {
  data?: {
    Page?: {
      airingSchedules?: {
        airingAt: number;
        episode: number;
        media?: {
          id: number;
          format?: string | null;
          title?: { romaji?: string | null; english?: string | null; userPreferred?: string | null };
        };
      }[];
    };
  };
  errors?: { message?: string }[];
};

const QUERY = `
query {
  Page(page: 1, perPage: 80) {
    airingSchedules(notYetAired: true, sort: TIME) {
      airingAt
      episode
      media {
        id
        format
        title { romaji english userPreferred }
      }
    }
  }
}
`;

export async function fetchAniListAiringSchedule(): Promise<AniListScheduleEntry[] | null> {
  const now = Math.floor(Date.now() / 1000);
  const weekLater = now + 7 * 24 * 3600;
  try {
    const res = await fetchWithRetry(
      "https://graphql.anilist.co",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: QUERY }),
      },
      { timeoutMs: 22_000, maxRetries: 2, retryDelayBaseMs: 400 }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as GqlResponse;
    if (json.errors?.length) return null;
    const rows = json.data?.Page?.airingSchedules;
    if (!Array.isArray(rows)) return null;

    const seen = new Set<string>();
    const out: AniListScheduleEntry[] = [];

    for (const row of rows) {
      if (row.airingAt < now - 12 * 3600 || row.airingAt > weekLater + 24 * 3600) continue;
      const media = row.media;
      if (!media?.id) continue;
      const id = `al-${media.id}-${row.airingAt}`;
      if (seen.has(id)) continue;
      seen.add(id);

      const t = media.title;
      const title =
        (t?.english?.trim() || t?.romaji?.trim() || t?.userPreferred?.trim() || "Unknown").trim();
      const airDate = new Date(row.airingAt * 1000);
      const air_date = Number.isNaN(airDate.getTime())
        ? new Date().toISOString().slice(0, 10)
        : airDate.toISOString().slice(0, 10);

      const noteParts: string[] = ["AniList"];
      if (media.format) noteParts.push(media.format);
      if (row.episode) noteParts.push(`Ep ${row.episode}`);

      out.push({
        id,
        title,
        air_date,
        note: noteParts.join(" · "),
        episode: row.episode ?? null,
      });
    }

    out.sort((a, b) => a.air_date.localeCompare(b.air_date));
    return out;
  } catch {
    return null;
  }
}
