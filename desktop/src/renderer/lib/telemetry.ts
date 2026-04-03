/**
 * Opt-in anonymous performance telemetry (phase 23). No video URLs or credentials in payloads.
 * Optional HTTPS (or localhost HTTP) endpoint receives JSON when configured.
 */

type TelemetryFlags = { optIn: boolean; endpoint: string };

let flagsCache: TelemetryFlags | null = null;
let cacheAt = 0;
const TTL_MS = 30_000;

function isAllowedTelemetryUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol === "https:") return true;
    if (
      u.protocol === "http:" &&
      (u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "[::1]")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function getTelemetryFlags(): Promise<TelemetryFlags> {
  const now = Date.now();
  if (flagsCache !== null && now - cacheAt < TTL_MS) {
    return flagsCache;
  }
  if (!window.anivault) {
    flagsCache = { optIn: false, endpoint: "" };
    cacheAt = now;
    return flagsCache;
  }
  const c = await window.anivault.getAllConfig();
  flagsCache = {
    optIn: Boolean(c.telemetryOptIn),
    endpoint: (c.telemetryEndpoint ?? "").trim(),
  };
  cacheAt = now;
  return flagsCache;
}

/** Call after settings change or full config refresh so the next event re-reads config. */
export function invalidateTelemetryCache(): void {
  flagsCache = null;
  cacheAt = 0;
}

export function recordPerfEvent(
  name: string,
  props?: Record<string, string | number | boolean>
): void {
  void getTelemetryFlags().then(({ optIn, endpoint }) => {
    if (!optIn) return;
    const payload = { name, ts: new Date().toISOString(), ...props };
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[anivault:telemetry]", payload);
    }
    if (endpoint && isAllowedTelemetryUrl(endpoint)) {
      void fetch(endpoint, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {
        /* ignore network errors */
      });
    }
  });
}
