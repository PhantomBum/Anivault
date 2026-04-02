/**
 * Auto-translation helpers (Phase 3). User API keys live in electron-store via Settings.
 * Server-side quota can extend this later.
 */

export async function translateText(
  text: string,
  targetLang: string,
  provider: "deepl" | "google" | "none",
  apiKey: string
): Promise<string> {
  if (provider === "none" || !apiKey.trim()) return text;
  if (provider === "deepl") {
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: [text], target_lang: targetLang.toUpperCase().slice(0, 2) }),
    });
    if (!res.ok) throw new Error(`DeepL ${res.status}`);
    const data = (await res.json()) as { translations?: { text: string }[] };
    return data.translations?.[0]?.text ?? text;
  }
  if (provider === "google") {
    const u = new URL("https://translation.googleapis.com/language/translate/v2");
    u.searchParams.set("key", apiKey);
    u.searchParams.set("q", text);
    u.searchParams.set("target", targetLang.split("-")[0] ?? "en");
    const res = await fetch(u.toString());
    if (!res.ok) throw new Error(`Google ${res.status}`);
    const data = (await res.json()) as {
      data?: { translations?: { translatedText: string }[] };
    };
    return data.data?.translations?.[0]?.translatedText ?? text;
  }
  return text;
}

/** Cloud path when the server exposes `POST /api/translate` with DeepL (requires sign-in). */
export async function translateViaAnivaultCloud(
  text: string,
  targetLang: string,
  baseUrl: string,
  token: string
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/translate`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text, targetLang }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Cloud translate ${res.status}`);
  }
  const data = (await res.json()) as { text?: string };
  return data.text ?? text;
}
