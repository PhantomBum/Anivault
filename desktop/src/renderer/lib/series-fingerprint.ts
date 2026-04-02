/**
 * Normalize catalog titles so multiple seasons / parts can be grouped for display.
 * Best-effort only — AniList id matching is stronger when enrichment is available.
 */
export function seriesFingerprint(name: string): string {
  return name
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(part|season| cours|cour)\s*\d+\b/gi, " ")
    .replace(/\b(s|g)\s*\d+\b/gi, " ")
    .replace(/\b\d+(st|nd|rd|th)\s+season\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
