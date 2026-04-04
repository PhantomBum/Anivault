/** Single source for keyboard shortcut rows (Settings tab + header dialog). */

export type KeyboardShortcutRow = { keys: string; action: string };

export const KEYBOARD_SHORTCUT_ROWS: KeyboardShortcutRow[] = [
  { keys: "Ctrl K", action: "Open Find shows and focus search" },
  { keys: "Ctrl Space", action: "Play / pause mini player (when not on Watch)" },
  { keys: "P", action: "Picture in picture (Watch page, video focused)" },
  { keys: "Ctrl Shift P", action: "Command palette (jump to pages, settings, actions)" },
  { keys: "Ctrl Shift R", action: "Refresh catalog (Home, Discover, Find shows) — bypass session cache" },
  { keys: "Ctrl /", action: "Show this shortcuts list" },
  { keys: "N · B", action: "Next / previous episode (watch page)" },
  { keys: "Alt 1 · Alt 0", action: "Home" },
  { keys: "Alt 2", action: "Find shows" },
  { keys: "Alt 3", action: "Settings" },
  { keys: "Alt 4", action: "Calendar" },
  { keys: "Alt 5", action: "Discover" },
  { keys: "Alt 6", action: "My lists" },
  { keys: "Alt ←", action: "Go back (browser history)" },
  { keys: "Alt ,", action: "Next Settings tab (when Settings is open)" },
  { keys: "/", action: "Focus Find in settings (when Settings is open)" },
  { keys: "Escape", action: "Close mobile sidebar (when open)" },
];
