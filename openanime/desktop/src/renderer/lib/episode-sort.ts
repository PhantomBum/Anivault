/** Natural order for episode labels like "1", "12", "OVA 3". */
export function sortEpisodeLabels(episodes: string[]): string[] {
  return [...episodes].sort((a, b) => {
    const na = extractLeadingNumber(a);
    const nb = extractLeadingNumber(b);
    if (na !== nb) return na - nb;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });
}

function extractLeadingNumber(s: string): number {
  const m = s.match(/(\d+(?:\.\d+)?)/);
  if (m) return Number.parseFloat(m[1]);
  return Number.POSITIVE_INFINITY;
}
