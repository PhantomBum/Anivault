/** Strip AniList/legacy HTML and normalize whitespace for plain-text UI. */
export function formatAnimeDescription(raw: string | null | undefined): string {
  if (raw == null) return "";
  let t = String(raw);
  t = t
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/(div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (full, n: string) => {
      const code = Number.parseInt(n, 10);
      return Number.isFinite(code) ? String.fromCharCode(code) : full;
    })
    .replace(/&#x([\da-fA-F]+);/gi, (full, h: string) => {
      const code = Number.parseInt(h, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : full;
    });
  t = t.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n");
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.replace(/[ \t]{2,}/g, " ");
  return t.trim();
}

/** Prefer AniList copy when substantial; otherwise ani-cli / shorter AniList blurbs. */
export function pickSynopsis(
  aniCliDescription: string | null | undefined,
  aniListDescription: string | null | undefined
): string | null {
  const a = formatAnimeDescription(aniListDescription);
  const b = formatAnimeDescription(aniCliDescription);
  if (a.length >= 40) return a;
  if (b.length > 0) return b;
  if (a.length > 0) return a;
  return null;
}
