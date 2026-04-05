/**
 * Anime search using the same allanime GraphQL API as pystardust/ani-cli.
 * See https://github.com/pystardust/ani-cli (search_anime function).
 */

import { fetchAllanimeGraphql } from "./allanime-http";

const SEARCH_GQL = `query( $search: SearchInput $limit: Int $page: Int $translationType: VaildTranslationTypeEnumType $countryOrigin: VaildCountryOriginEnumType ) { shows( search: $search limit: $limit page: $page translationType: $translationType countryOrigin: $countryOrigin ) { edges { _id name availableEpisodes __typename } } }`;

export interface AnimeSearchResult {
  id: string;
  name: string;
  episodeCount: number;
  /** "sub" | "dub" - which mode was used for episode count */
  mode: "sub" | "dub";
  hasSub?: boolean;
  hasDub?: boolean;
}

interface GqlShowEdge {
  _id: string;
  name: string;
  availableEpisodes?: {
    sub?: string[] | number;
    dub?: string[] | number;
  };
}

interface GqlShowsResponse {
  data?: {
    shows?: {
      edges?: GqlShowEdge[];
    };
  };
}

function getEpisodeCount(edge: GqlShowEdge, mode: "sub" | "dub"): number {
  const ep = edge.availableEpisodes?.[mode];
  if (ep == null) return 0;
  if (Array.isArray(ep)) return ep.length;
  if (typeof ep === "number") return ep;
  return 0;
}

function hasEpisodes(edge: GqlShowEdge, mode: "sub" | "dub"): boolean {
  return getEpisodeCount(edge, mode) > 0;
}

export async function searchAnime(
  query: string,
  options: { mode?: "sub" | "dub"; limit?: number } = {}
): Promise<AnimeSearchResult[]> {
  const mode = options.mode ?? "sub";
  let rows = await searchAnimeInner(query, { ...options, mode });
  if (rows.length === 0 && mode === "sub") {
    rows = await searchAnimeInner(query, { ...options, mode: "dub" });
  }
  return rows;
}

async function searchAnimeInner(
  query: string,
  options: { mode?: "sub" | "dub"; limit?: number } = {}
): Promise<AnimeSearchResult[]> {
  const mode = options.mode ?? "sub";
  const limit = options.limit ?? 40;
  const searchQuery = query.trim().replace(/\s+/g, "+");

  const variables = {
    search: {
      allowAdult: false,
      allowUnknown: false,
      query: searchQuery,
    },
    limit,
    page: 1,
    translationType: mode,
    countryOrigin: "ALL",
  };

  const json = await fetchAllanimeGraphql<GqlShowsResponse>(SEARCH_GQL, variables);
  const edges = json.data?.shows?.edges ?? [];

  const mapped = edges.map((edge) => ({
    id: edge._id,
    name: (edge.name ?? "").replace(/\\"/g, '"'),
    episodeCount: getEpisodeCount(edge, mode),
    mode,
    hasSub: hasEpisodes(edge, "sub"),
    hasDub: hasEpisodes(edge, "dub"),
  }));
  /** Prefer rows with episode metadata; fall back so Discover/Home never go empty when counts lag. */
  const playable = mapped.filter((r) => r.episodeCount > 0);
  return playable.length > 0 ? playable : mapped.filter((r) => r.id && r.name);
}

export interface RecentAnimeResult {
  items: AnimeSearchResult[];
  hasMore: boolean;
}

/**
 * Fetch a page of recently updated/available shows.
 * Uses empty search object so the API returns a browse/list result.
 * Payload shape: {"search":{},"limit":N,"page":P,"translationType":"sub","countryOrigin":"ALL"}
 */
export async function getRecentAnime(
  page: number,
  limit = 12,
  mode: "sub" | "dub" = "sub"
): Promise<RecentAnimeResult> {
  const variables = {
    search: {},
    limit,
    page: Math.max(1, page),
    translationType: mode,
    countryOrigin: "ALL",
  };

  const json = await fetchAllanimeGraphql<GqlShowsResponse>(SEARCH_GQL, variables);
  const edges = json.data?.shows?.edges ?? [];

  const mapped = edges.map((edge) => ({
    id: edge._id,
    name: (edge.name ?? "").replace(/\\"/g, '"'),
    episodeCount: getEpisodeCount(edge, mode),
    mode,
    hasSub: hasEpisodes(edge, "sub"),
    hasDub: hasEpisodes(edge, "dub"),
  }));
  const playable = mapped.filter((r) => r.episodeCount > 0);
  const items =
    playable.length > 0 ? playable : mapped.filter((r) => r.id && r.name);

  return { items, hasMore: items.length >= limit };
}

/**
 * Fetch episode list for a show (same API as ani-cli episodes_list()).
 */
const EPISODES_LIST_GQL = `query ($showId: String!) { show( _id: $showId ) { _id availableEpisodesDetail } }`;

interface GqlShowDetailResponse {
  data?: {
    show?: {
      _id: string;
      availableEpisodesDetail?: {
        sub?: string[];
        dub?: string[];
      };
    };
  };
}

export async function getEpisodesList(
  showId: string,
  mode: "sub" | "dub" = "sub"
): Promise<string[]> {
  const variables = { showId };
  const json = await fetchAllanimeGraphql<GqlShowDetailResponse>(EPISODES_LIST_GQL, variables);
  const detail = json.data?.show?.availableEpisodesDetail?.[mode];
  if (!Array.isArray(detail)) return [];
  return [...detail].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });
}

/**
 * Fetch show details (name, thumbnail, synopsis, etc.) for the details/watch page.
 */
const SHOW_DETAILS_GQL = `query ($showId: String!) { show( _id: $showId ) { _id name thumbnail type description } }`;

interface GqlShowDetailsPayload {
  data?: {
    show?: {
      _id: string;
      name?: string;
      thumbnail?: string;
      type?: string;
      description?: string | null;
    };
  };
}

export interface ShowDetails {
  id: string;
  name: string;
  thumbnail: string | null;
  type: string;
  description?: string | null;
}

export async function getShowDetails(showId: string): Promise<ShowDetails> {
  const variables = { showId };
  const json = await fetchAllanimeGraphql<GqlShowDetailsPayload>(SHOW_DETAILS_GQL, variables);
  const show = json.data?.show;
  if (!show) {
    throw new Error("Show not found");
  }
  return {
    id: show._id,
    name: (show.name ?? "").replace(/\\"/g, '"'),
    thumbnail: show.thumbnail ?? null,
    type: show.type ?? "TV",
    description: show.description ?? null,
  };
}
