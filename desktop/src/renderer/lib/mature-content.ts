/** Heuristic mature rating from title and optional AniList-style genres. */
export type MatureRating = "none" | "ecchi" | "explicit";

const EXPLICIT_RE = /\b(hentai|ero-?ge|eroge|x-?rated|rx)\b|^(?:\s*)hentai(?:\s*)$/i;
const ECCHI_RE = /\b(ecchi|nsfw|mature|sexual|fanservice|smut)\b/i;

const EXPLICIT_GENRES = new Set(["hentai", "erotica"]);
const ECCHI_GENRES = new Set(["ecchi", "boys love", "girls love"]);

/** When mature content is disabled in settings, filter these from grids and lists. */
export function isMatureContentBlocked(allowMatureContent: boolean, rating: MatureRating): boolean {
  return !allowMatureContent && rating !== "none";
}

export function inferMatureRating(title: string, genres?: string[]): MatureRating {
  const t = title.toLowerCase();
  const g = (genres ?? []).map((x) => x.toLowerCase());
  for (const x of g) {
    if (EXPLICIT_GENRES.has(x)) return "explicit";
  }
  if (EXPLICIT_RE.test(t)) return "explicit";
  for (const x of g) {
    if (ECCHI_GENRES.has(x)) return "ecchi";
  }
  if (ECCHI_RE.test(t)) return "ecchi";
  return "none";
}
