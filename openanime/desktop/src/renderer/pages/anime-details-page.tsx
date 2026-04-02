import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Heart,
  ListVideo,
  Loader2,
  MessageCircle,
  Star,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/renderer/components/ui/tabs";
import { type AnimeSearchResult, type ShowDetails, getAniCli } from "@/renderer/lib/ani-cli-bridge";
import {
  getShowComments,
  getShowEngagement,
  postShowComment,
  postShowLike,
  postShowRating,
  type ShowCommentRow,
  type ShowEngagementResponse,
} from "@/renderer/lib/anivault-api";
import {
  type AniListMediaExtra,
  type AniListSearchTile,
  fetchAniListBundleByTitle,
} from "@/renderer/lib/anilist";
import { sortEpisodeLabels } from "@/renderer/lib/episode-sort";
import { showToast } from "@/renderer/lib/av-toast";
import { pickSynopsis } from "@/renderer/lib/synopsis";

type EpisodesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; episodes: string[] }
  | { status: "error"; message: string };

interface LocationState {
  anime?: AnimeSearchResult;
}

type AnimeMode = "sub" | "dub";

const MODES: AnimeMode[] = ["sub", "dub"];

export function AnimeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [details, setDetails] = useState<ShowDetails | null>(null);
  const [episodesByMode, setEpisodesByMode] = useState<Record<AnimeMode, EpisodesState>>({
    sub: { status: "idle" },
    dub: { status: "idle" },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingEpisode, setPlayingEpisode] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<AnimeMode>(state?.anime?.mode ?? "sub");
  const [aniList, setAniList] = useState<AniListMediaExtra | null>(null);
  const [aniListLoading, setAniListLoading] = useState(false);
  const [episodeFilter, setEpisodeFilter] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);
  const [tile, setTile] = useState<AniListSearchTile | null>(null);
  const [engagement, setEngagement] = useState<ShowEngagementResponse | null>(null);
  const [comments, setComments] = useState<ShowCommentRow[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [engageMsg, setEngageMsg] = useState<string | null>(null);

  const anime =
    state?.anime ?? (id ? { id, name: "", episodeCount: 0, mode: "sub" as const } : null);

  useEffect(() => {
    setActiveMode(anime?.mode ?? "sub");
  }, [anime?.id, anime?.mode]);

  useEffect(() => {
    const title = details?.name ?? anime?.name;
    if (!title || title === "Unknown") return;
    let cancelled = false;
    setAniListLoading(true);
    setAniList(null);
    setTile(null);
    void fetchAniListBundleByTitle(title)
      .then(({ extra, tile }) => {
        if (cancelled) return;
        setAniList(extra);
        setTile(tile);
      })
      .finally(() => {
        if (!cancelled) setAniListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [details?.name, anime?.name]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setEngageMsg(null);
    void Promise.all([
      getShowEngagement(id).then((r) => {
        if (!cancelled && r.ok && r.data) setEngagement(r.data);
      }),
      getShowComments(id, 30, 0).then((r) => {
        if (!cancelled && r.ok && r.data) setComments(r.data.comments);
      }),
    ]);
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    setEpisodeFilter("");
    setDescExpanded(false);
  }, [id]);

  useEffect(() => {
    if (!id || !anime) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const aniCli = getAniCli();
    setEpisodesByMode({ sub: { status: "loading" }, dub: { status: "loading" } });

    void Promise.allSettled([
      aniCli.getShowDetails(id),
      aniCli.getEpisodes(id, "sub"),
      aniCli.getEpisodes(id, "dub"),
    ])
      .then(([detailsResult, subResult, dubResult]) => {
        if (cancelled) return;

        if (detailsResult.status === "fulfilled") {
          setDetails(detailsResult.value);
        } else {
          setError(
            detailsResult.reason instanceof Error
              ? detailsResult.reason.message
              : "Failed to load details"
          );
        }

        const nextSubState: EpisodesState =
          subResult.status === "fulfilled"
            ? { status: "loaded", episodes: subResult.value }
            : {
                status: "error",
                message:
                  subResult.reason instanceof Error
                    ? subResult.reason.message
                    : "Failed to load sub episodes",
              };

        const nextDubState: EpisodesState =
          dubResult.status === "fulfilled"
            ? { status: "loaded", episodes: dubResult.value }
            : {
                status: "error",
                message:
                  dubResult.reason instanceof Error
                    ? dubResult.reason.message
                    : "Failed to load dub episodes",
              };

        setEpisodesByMode({ sub: nextSubState, dub: nextDubState });

        const preferredMode = anime.mode;
        const preferredEpisodes =
          preferredMode === "sub"
            ? nextSubState.status === "loaded"
              ? nextSubState.episodes
              : []
            : nextDubState.status === "loaded"
              ? nextDubState.episodes
              : [];
        const fallbackEpisodes =
          preferredMode === "sub"
            ? nextDubState.status === "loaded"
              ? nextDubState.episodes
              : []
            : nextSubState.status === "loaded"
              ? nextSubState.episodes
              : [];

        if (preferredEpisodes.length === 0 && fallbackEpisodes.length > 0) {
          setActiveMode(preferredMode === "sub" ? "dub" : "sub");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load details");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, anime]);

  const playEpisode = useCallback(
    (episode: string, episodes: string[], mode: AnimeMode) => {
      if (!anime?.id) return;
      setPlayingEpisode(episode);
      navigate("/watch", {
        state: {
          anime: { id: anime.id, name: details?.name ?? anime.name, mode },
          episodes,
          currentEpisode: episode,
        },
      });
      setPlayingEpisode(null);
    },
    [navigate, anime, details?.name]
  );

  const refreshEngagement = useCallback(async () => {
    if (!id) return;
    const r = await getShowEngagement(id);
    if (r.ok && r.data) setEngagement(r.data);
  }, [id]);

  const refreshComments = useCallback(async () => {
    if (!id) return;
    const r = await getShowComments(id, 30, 0);
    if (r.ok && r.data) setComments(r.data.comments);
  }, [id]);

  const onRate = useCallback(
    async (n: number) => {
      if (!id) return;
      setEngageMsg(null);
      const r = await postShowRating(id, n);
      if (!r.ok) {
        setEngageMsg(r.error ?? "Sign in to rate");
        return;
      }
      void refreshEngagement();
    },
    [id, refreshEngagement]
  );

  const onToggleLike = useCallback(async () => {
    if (!id) return;
    setEngageMsg(null);
    const next = !(engagement?.userLiked ?? false);
    const r = await postShowLike(id, next);
    if (!r.ok) {
      setEngageMsg(r.error ?? "Sign in to like");
      return;
    }
    void refreshEngagement();
  }, [id, engagement?.userLiked, refreshEngagement]);

  const onPostComment = useCallback(async () => {
    if (!id || !commentBody.trim()) return;
    setEngageMsg(null);
    const r = await postShowComment(id, commentBody.trim());
    if (!r.ok) {
      setEngageMsg(r.error ?? "Sign in to comment");
      return;
    }
    setCommentBody("");
    void refreshComments();
    void refreshEngagement();
  }, [id, commentBody, refreshComments, refreshEngagement]);

  const subEpisodes = useMemo(() => {
    if (episodesByMode.sub.status !== "loaded") return [];
    return sortEpisodeLabels(episodesByMode.sub.episodes);
  }, [episodesByMode.sub]);

  const dubEpisodes = useMemo(() => {
    if (episodesByMode.dub.status !== "loaded") return [];
    return sortEpisodeLabels(episodesByMode.dub.episodes);
  }, [episodesByMode.dub]);

  const episodesForFilter = activeMode === "sub" ? subEpisodes : dubEpisodes;

  const filteredEpisodes = useMemo(() => {
    const q = episodeFilter.trim().toLowerCase();
    if (!q) return episodesForFilter;
    return episodesForFilter.filter((ep) => ep.toLowerCase().includes(q));
  }, [episodesForFilter, episodeFilter]);

  if (!id) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-[var(--av-bg)] p-8 text-[var(--av-text)]">
        <p className="text-[var(--av-muted)]">No anime selected.</p>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  if (loading && !details) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-[var(--av-bg)] p-8 text-[var(--av-text)]">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--av-accent)]" />
        <p className="text-sm text-[var(--av-muted)]">Loading…</p>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  if (error && !details) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-[var(--av-bg)] p-8 text-[var(--av-text)]">
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  const displayName = details?.name ?? anime?.name ?? "Unknown";
  const hasSub = subEpisodes.length > 0;
  const hasDub = dubEpisodes.length > 0;
  const tabs = MODES.filter((mode) => (mode === "sub" ? hasSub : hasDub));
  const episodes = episodesForFilter;
  const epCountDisplay =
    tile?.episodes ??
    anime?.episodeCount ??
    Math.max(subEpisodes.length, dubEpisodes.length, 0);
  const synopsis = pickSynopsis(details?.description, aniList?.description);
  const activeState = episodesByMode[activeMode];
  const isAnyEpisodesLoading =
    episodesByMode.sub.status === "loading" || episodesByMode.dub.status === "loading";
  const allModesFailed =
    episodesByMode.sub.status === "error" && episodesByMode.dub.status === "error";

  const openedWithoutSearchState = Boolean(id && !state?.anime);

  return (
    <>
      <div className="flex w-full min-h-[50vh] flex-col bg-[var(--av-bg)] text-[var(--av-text)]">
        <div className="sticky top-12 z-10 flex shrink-0 items-center gap-2 border-b border-[var(--av-border)] bg-[var(--av-bg)]/95 px-3 py-2 backdrop-blur-sm sm:gap-3 sm:px-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <span
            className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--av-text)]"
            title={displayName}
          >
            {displayName}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden shrink-0 gap-1 text-xs text-[var(--av-muted)] hover:text-[var(--av-text)] sm:inline-flex"
            title="Scroll to episodes"
            onClick={() =>
              document.getElementById("series-episodes")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <ListVideo className="h-4 w-4" />
            Episodes
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-[var(--av-muted)] hover:text-[var(--av-text)]"
            title="Copy link to this series"
            aria-label="Copy link to clipboard"
            onClick={() => {
              void navigator.clipboard.writeText(window.location.href).then(
                () => showToast("Link copied"),
                () => showToast("Could not copy", 3200)
              );
            }}
          >
            <Copy className="h-5 w-5" />
          </Button>
        </div>

        <div className="container mx-auto flex max-w-5xl flex-col gap-8 p-4 pb-10 md:p-8">
          {openedWithoutSearchState && details ? (
            <p
              className="rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] px-3 py-2 text-xs text-[var(--av-muted)]"
              role="status"
            >
              Opened by URL — titles load from ani-cli. For quicker picks, open from{" "}
              <Link className="text-[var(--av-text)] underline" to="/anime">
                Search
              </Link>
              .
            </p>
          ) : null}

          <section className="relative overflow-hidden rounded-3xl border border-[var(--av-border)] bg-[var(--av-surface)]/40">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25 blur-sm"
              style={{
                backgroundImage: tile?.coverUrl
                  ? `url(${tile.coverUrl})`
                  : details?.thumbnail
                    ? `url(${details.thumbnail})`
                    : undefined,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--av-bg)] via-[var(--av-bg)]/85 to-[var(--av-bg)]/40" />
            <div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:items-end sm:gap-10 sm:p-8">
              {tile?.coverUrl || details?.thumbnail ? (
                <img
                  src={tile?.coverUrl ?? details?.thumbnail ?? undefined}
                  draggable={false}
                  alt=""
                  referrerPolicy="no-referrer"
                  decoding="async"
                  className="mx-auto aspect-[2/3] w-40 shrink-0 rounded-2xl border-2 border-[var(--av-border)] object-cover shadow-lg sm:mx-0 sm:w-48"
                />
              ) : (
                <div className="mx-auto flex aspect-[2/3] w-40 shrink-0 items-center justify-center rounded-2xl border-2 border-[var(--av-border)] bg-[var(--av-surface)] text-xs text-[var(--av-muted)] sm:mx-0 sm:w-48">
                  No image
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-3">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--av-text)] sm:text-3xl">
                  {displayName}
                </h1>
                <p className="text-sm text-[var(--av-muted)]">
                  {tile?.format ?? details?.type ?? "TV"} · {epCountDisplay || "—"} episodes
                  {tile?.seasonYear ? ` · ${tile.seasonYear}` : ""}
                </p>
                {aniListLoading ? (
                  <p className="text-xs text-[var(--av-muted-foreground)]">Loading AniList metadata…</p>
                ) : null}
                {aniList ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--av-text)]">
                    {aniList.averageScore != null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--av-accent-muted)]/50 px-2 py-1 tabular-nums font-semibold">
                        <Star className="h-3.5 w-3.5" />
                        AniList {aniList.averageScore}/100
                      </span>
                    ) : null}
                    {aniList.genres.length > 0 ? (
                      <span className="text-[var(--av-muted)]">{aniList.genres.join(" · ")}</span>
                    ) : null}
                    {aniList.siteUrl ? (
                      <a
                        href={aniList.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 underline"
                      >
                        AniList <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section
            id="series-episodes"
            className="scroll-mt-28 flex flex-col gap-3 rounded-2xl border border-[var(--av-accent-dim)]/35 bg-[var(--av-surface)]/60 p-5 shadow-sm"
            aria-label="Episodes"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="shrink-0 text-lg font-semibold tracking-tight">Episodes</h2>
              {episodes.length > 4 ? (
                <Input
                  placeholder="Filter episodes…"
                  className="w-full min-w-0 max-w-xs rounded-xl border-[var(--av-border)] bg-[var(--av-bg-elevated)] text-xs text-[var(--av-text)] sm:w-auto"
                  value={episodeFilter}
                  onChange={(e) => setEpisodeFilter(e.target.value)}
                />
              ) : null}
            </div>
            {tabs.length > 0 && (
              <Tabs
                value={activeMode}
                onValueChange={(value) => {
                  if (value === "sub" || value === "dub") setActiveMode(value);
                }}
              >
                <TabsList>
                  {tabs.map((mode) => (
                    <TabsTrigger key={mode} value={mode} className="capitalize">
                      {mode}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            {isAnyEpisodesLoading && (
              <p className="text-sm text-[var(--av-muted)]">Loading episodes…</p>
            )}
            {!isAnyEpisodesLoading && activeState.status === "error" && (
              <p className="text-sm text-red-400">{activeState.message}</p>
            )}
            {!isAnyEpisodesLoading && tabs.length === 0 && !allModesFailed && (
              <p className="text-sm text-[var(--av-muted)]">No episodes available.</p>
            )}
            {!isAnyEpisodesLoading && allModesFailed && (
              <p className="text-sm text-red-400">Failed to load episodes for both sub and dub.</p>
            )}
            {episodes.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {filteredEpisodes.length === 0 ? (
                  <li className="text-sm text-[var(--av-muted)]">No episodes match filter.</li>
                ) : (
                  filteredEpisodes.map((ep) => {
                    const isPlaying = playingEpisode === ep;
                    return (
                      <li key={ep}>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl border-[var(--av-border)] bg-[var(--av-surface)] text-[var(--av-text)] hover:border-[var(--av-accent-dim)] hover:bg-[var(--av-surface-hover)]"
                          onClick={() => playEpisode(ep, episodes, activeMode)}
                          disabled={isPlaying}
                        >
                          {ep}
                        </Button>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </section>

          {synopsis ? (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Synopsis</h2>
              <div className="w-full min-w-0 max-w-full text-sm leading-relaxed text-[var(--av-text)]/95">
                <div
                  className={
                    descExpanded
                      ? "max-h-none"
                      : "max-h-[9.5rem] overflow-hidden sm:max-h-[10.5rem]"
                  }
                >
                  <p className="whitespace-pre-wrap break-words">{synopsis}</p>
                </div>
                {synopsis.length > 320 ? (
                  <button
                    type="button"
                    className="mt-2 text-left text-xs font-medium text-[var(--av-muted)] underline"
                    onClick={() => setDescExpanded((v) => !v)}
                  >
                    {descExpanded ? "Show less" : "Show more"}
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="space-y-4 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)]/50 p-5">
            <h2 className="text-lg font-semibold">Community</h2>
            {engageMsg ? (
              <p className="text-xs text-amber-400" role="status">
                {engageMsg}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--av-muted)]">Avg rating</p>
                <p className="tabular-nums font-semibold">
                  {engagement?.avgRating != null ? engagement.avgRating.toFixed(1) : "—"}
                  <span className="text-xs font-normal text-[var(--av-muted)]"> /10</span>
                </p>
                <p className="text-[10px] text-[var(--av-muted)]">
                  {engagement?.ratingCount ?? 0} votes · AniVault
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--av-muted)]">Likes</p>
                <p className="tabular-nums font-semibold">{engagement?.likesCount ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--av-muted)]">Comments</p>
                <p className="tabular-nums font-semibold">{engagement?.commentsCount ?? 0}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[var(--av-muted)]">Your rating (1–10)</span>
              <select
                className="h-9 rounded-xl border border-[var(--av-border)] bg-[var(--av-bg)] px-2 text-xs text-[var(--av-text)]"
                value={engagement?.userRating ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  void onRate(Number(v));
                }}
              >
                <option value="">Choose…</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant={engagement?.userLiked ? "secondary" : "outline"}
                size="sm"
                className="rounded-xl"
                onClick={() => void onToggleLike()}
              >
                <Heart
                  className={`mr-1.5 h-4 w-4 ${engagement?.userLiked ? "fill-current text-red-400" : ""}`}
                />
                {engagement?.userLiked ? "Liked" : "Like"}
              </Button>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-1 text-xs font-medium text-[var(--av-muted)]">
                <MessageCircle className="h-3.5 w-3.5" />
                Comments
              </p>
              {comments.length === 0 ? (
                <p className="text-xs text-[var(--av-muted)]">No comments yet.</p>
              ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
                  {comments.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-xl border border-[var(--av-border)]/80 bg-[var(--av-bg-elevated)]/50 px-3 py-2"
                    >
                      <p className="text-[10px] text-[var(--av-muted)]">
                        {c.user_email ?? "Guest"} · {new Date(c.created_at).toLocaleString()}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[var(--av-text)]">{c.body}</p>
                    </li>
                  ))}
                </ul>
              )}
              <textarea
                className="min-h-[72px] w-full rounded-xl border border-[var(--av-border)] bg-[var(--av-bg)] px-3 py-2 text-xs text-[var(--av-text)] placeholder:text-[var(--av-muted-foreground)]"
                placeholder="Write a comment (requires sign-in)…"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
              />
              <Button type="button" size="sm" className="rounded-xl" onClick={() => void onPostComment()}>
                Post comment
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
