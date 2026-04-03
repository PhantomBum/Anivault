/** Shared local watchlist (same storage as My lists page). */

export const LOCAL_WATCHLIST_STORAGE_KEY = "anivault-local-watchlist-v1";

export type LocalWatchlistEntry = { id: string; name: string; mode: "sub" | "dub" };

export function loadLocalWatchlist(): LocalWatchlistEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is LocalWatchlistEntry =>
        x != null &&
        typeof x === "object" &&
        "id" in x &&
        typeof (x as LocalWatchlistEntry).id === "string" &&
        typeof (x as LocalWatchlistEntry).name === "string" &&
        ((x as LocalWatchlistEntry).mode === "sub" || (x as LocalWatchlistEntry).mode === "dub")
    );
  } catch {
    return [];
  }
}

/** Prepends entry when not already present. */
export function addLocalWatchlistEntry(entry: LocalWatchlistEntry): { added: boolean } {
  const current = loadLocalWatchlist();
  if (current.some((e) => e.id === entry.id)) {
    return { added: false };
  }
  const next: LocalWatchlistEntry[] = [entry, ...current];
  localStorage.setItem(LOCAL_WATCHLIST_STORAGE_KEY, JSON.stringify(next));
  return { added: true };
}
