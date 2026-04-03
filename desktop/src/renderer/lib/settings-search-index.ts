/** Searchable settings entries for “Find in settings” (phase 15). */

export const SETTINGS_TABS = [
  "playback",
  "appearance",
  "language",
  "translation",
  "updates",
  "data",
  /** Placeholder for upcoming tools (maintenance gate). */
  "labs",
] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

export type SettingsSearchHit = {
  id: string;
  tab: SettingsTab;
  label: string;
  /** Group label in results */
  category: string;
  anchorId: string;
  keywords: string;
};

export const SETTINGS_SEARCH_INDEX: SettingsSearchHit[] = [
  {
    id: "volume",
    tab: "playback",
    label: "Default volume",
    category: "Playback",
    anchorId: "settings-volume",
    keywords: "volume audio sound loudness default player",
  },
  {
    id: "prefetch",
    tab: "playback",
    label: "Prefetch next episode",
    category: "Playback",
    anchorId: "settings-prefetch",
    keywords: "prefetch next episode metadata idle",
  },
  {
    id: "autoplay",
    tab: "playback",
    label: "Auto-play next episode",
    category: "Playback",
    anchorId: "settings-autoplay",
    keywords: "autoplay auto next episode countdown",
  },
  {
    id: "native-controls",
    tab: "playback",
    label: "Native video controls",
    category: "Player",
    anchorId: "settings-native-controls",
    keywords: "native controls browser video custom bar",
  },
  {
    id: "seek-step",
    tab: "playback",
    label: "Seek step (keyboard)",
    category: "Player",
    anchorId: "settings-seek",
    keywords: "seek arrow keyboard skip seconds",
  },
  {
    id: "speed",
    tab: "playback",
    label: "Default playback speed",
    category: "Player",
    anchorId: "settings-speed",
    keywords: "speed rate playback 1x",
  },
  {
    id: "skip-intro",
    tab: "playback",
    label: "Skip intro jump",
    category: "Player",
    anchorId: "settings-skip-intro",
    keywords: "skip intro opening seconds op ed",
  },
  {
    id: "server",
    tab: "playback",
    label: "API server URL",
    category: "Server",
    anchorId: "settings-server",
    keywords: "api base url server cloud localhost connection",
  },
  {
    id: "chroma",
    tab: "appearance",
    label: "Color emphasis",
    category: "Appearance",
    anchorId: "settings-chroma",
    keywords: "color chromatic mono grayscale poster",
  },
  {
    id: "shell",
    tab: "appearance",
    label: "Shell theme",
    category: "Appearance",
    anchorId: "settings-shell",
    keywords: "theme shell midnight charcoal slate ember ocean paper",
  },
  {
    id: "mature",
    tab: "appearance",
    label: "Mature (18+) content",
    category: "Appearance",
    anchorId: "settings-mature",
    keywords: "mature adult ecchi nsfw 18",
  },
  {
    id: "density",
    tab: "appearance",
    label: "UI density",
    category: "Appearance",
    anchorId: "settings-density",
    keywords: "density compact comfortable spacing padding",
  },
  {
    id: "language",
    tab: "language",
    label: "App language",
    category: "Language",
    anchorId: "settings-language",
    keywords: "language locale i18n english portuguese",
  },
  {
    id: "translation-provider",
    tab: "translation",
    label: "Translation provider",
    category: "Translation",
    anchorId: "settings-translation-provider",
    keywords: "translation deepl google api key",
  },
  {
    id: "translation-key",
    tab: "translation",
    label: "Translation API key",
    category: "Translation",
    anchorId: "settings-translation-key",
    keywords: "translation key api secret",
  },
  {
    id: "updates",
    tab: "updates",
    label: "Check for updates",
    category: "Updates",
    anchorId: "settings-updates",
    keywords: "update upgrade version github electron",
  },
  {
    id: "data-backup",
    tab: "data",
    label: "Backups & exports",
    category: "Data",
    anchorId: "settings-data-backup",
    keywords: "export import backup watchlist json csv",
  },
  {
    id: "data-downloads",
    tab: "data",
    label: "Offline downloads",
    category: "Data",
    anchorId: "settings-data-downloads",
    keywords: "download offline disk queue",
  },
  {
    id: "data-api",
    tab: "data",
    label: "Server connection test",
    category: "Data",
    anchorId: "settings-data-api",
    keywords: "connection test api ping health server",
  },
  {
    id: "telemetry",
    tab: "data",
    label: "Performance telemetry",
    category: "Data",
    anchorId: "settings-telemetry",
    keywords: "telemetry analytics performance opt in anonymous usage endpoint url post",
  },
  {
    id: "labs",
    tab: "labs",
    label: "Studio (coming soon)",
    category: "Studio",
    anchorId: "settings-labs",
    keywords: "studio labs experimental maintenance unvaulted roadmap automation sync plugins themes",
  },
];

export function filterSettingsSearch(query: string): SettingsSearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return SETTINGS_SEARCH_INDEX.filter(
    (h) =>
      h.label.toLowerCase().includes(q) ||
      h.keywords.includes(q) ||
      h.category.toLowerCase().includes(q)
  ).slice(0, 12);
}
