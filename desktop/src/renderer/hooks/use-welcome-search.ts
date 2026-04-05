import { useEffect, useRef, useState } from "react";

import {
  type AnimeSearchResult,
  getAniCli,
} from "@/renderer/lib/ani-cli-bridge";
import { cachedAniSearch } from "@/renderer/lib/ani-session-cache";
import { formatCatalogApiError } from "@/renderer/lib/catalog-api-errors";
import {
  SHOW_DETAILS_FETCH_CONCURRENCY,
  mergeShowThumbnailsFromShowDetails,
} from "@/renderer/lib/fetch-show-thumbnails";

export function useWelcomeSearch(debouncedQuery: string, refreshNonce = 0) {
  const [results, setResults] = useState<AnimeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchThumbnails, setSearchThumbnails] = useState<Record<string, string | null>>({});

  const searchGen = useRef(0);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    const gen = ++searchGen.current;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSearchThumbnails({});
    const aniCli = getAniCli();
    void cachedAniSearch(q, () => aniCli.search(q))
      .then((list) => {
        if (cancelled || gen !== searchGen.current) return;
        setResults(list);
      })
      .catch((err: unknown) => {
        if (cancelled || gen !== searchGen.current) return;
        setError(
          formatCatalogApiError(err instanceof Error ? err.message : "Search failed")
        );
      })
      .finally(() => {
        if (cancelled || gen !== searchGen.current) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, refreshNonce]);

  useEffect(() => {
    let cancelled = false;
    if (results.length === 0) return;
    void mergeShowThumbnailsFromShowDetails(
      results,
      SHOW_DETAILS_FETCH_CONCURRENCY,
      setSearchThumbnails,
      () => cancelled
    );
    return () => {
      cancelled = true;
    };
  }, [results]);

  return { results, loading, error, searchThumbnails };
}
