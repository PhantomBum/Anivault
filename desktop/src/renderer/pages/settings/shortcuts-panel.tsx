import { Button } from "@/renderer/components/ui/button";
import { KEYBOARD_SHORTCUT_ROWS } from "@/renderer/lib/keyboard-shortcuts-data";
import React from "react";
import { Link } from "react-router-dom";

import type { SettingsTranslate } from "./settings-types";

type Props = {
  translate: SettingsTranslate;
};

export function ShortcutsSettingsPanel({ translate }: Props) {
  return (
    <div id="settings-shortcuts-list" className="space-y-6 scroll-mt-28">
      <p className="text-sm leading-relaxed text-[var(--av-muted-foreground)]">
        {translate("settings.shortcutsIntro")}
      </p>
      <Button type="button" variant="outline" className="h-10 rounded-xl border-[var(--av-border)]" asChild>
        <Link to="/settings?tab=playback">{translate("settings.shortcutsOpenPlayback")}</Link>
      </Button>
      <ul className="space-y-2 text-sm">
        {KEYBOARD_SHORTCUT_ROWS.map((row) => (
          <li
            key={row.keys + row.action}
            className="flex items-center justify-between gap-4 border-b border-[var(--av-border)]/60 py-2.5 last:border-0"
          >
            <span className="text-[var(--av-muted)]">{row.action}</span>
            <kbd className="shrink-0 rounded-md border border-[var(--av-border)] bg-[var(--av-surface)] px-2 py-1 font-mono text-[11px] text-[var(--av-text)]">
              {row.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </div>
  );
}
