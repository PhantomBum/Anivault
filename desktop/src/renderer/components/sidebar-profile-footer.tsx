import { Moon, Settings, Sun } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/renderer/lib/utils";
import { anivaultFetch, type MeResponse } from "@/renderer/lib/anivault-api";
import { toggleTheme } from "@/renderer/helpers/theme/theme-helper";

type SidebarProfileFooterProps = {
  collapsed?: boolean;
};

export function SidebarProfileFooter({ collapsed }: SidebarProfileFooterProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  const syncDark = useCallback(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await anivaultFetch<MeResponse>("/api/me");
      if (cancelled) return;
      if (res.ok && res.data?.user?.email) setEmail(res.data.user.email);
      else setEmail(null);
    })();
    syncDark();
    return () => {
      cancelled = true;
    };
  }, [syncDark]);

  const onToggleTheme = () => {
    void (async () => {
      await toggleTheme();
      syncDark();
    })();
  };

  if (collapsed) {
    return (
      <div className="mt-auto flex flex-col items-center gap-2 border-t border-white/[0.06] pt-3">
        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] text-[var(--av-muted)] shadow-av-xs transition-all duration-200 hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)] hover:shadow-av-sm"
          aria-label="Toggle theme"
          onClick={onToggleTheme}
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
        <Link
          to="/settings"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] text-[var(--av-muted)] shadow-av-xs transition-all duration-200 hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)] hover:shadow-av-sm"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const display = email ?? "Guest";
  const sub = email ? email.split("@")[0] ?? "N/A" : "N/A";

  return (
    <div className="mt-auto w-full border-t border-white/[0.06] pt-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)]/90 px-2.5 py-2 shadow-av-sm",
            "text-left"
          )}
        >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-600/90 text-sm font-bold text-white shadow-inner"
          aria-hidden
        >
          {email ? email[0]?.toUpperCase() ?? "?" : "G"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[var(--av-text)]">{display}</p>
          <p className="truncate text-[10px] text-[var(--av-muted-foreground)]">{sub}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className="min-h-10 min-w-10 rounded-xl p-2 text-[var(--av-muted)] transition-colors duration-200 hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)]"
            aria-label="Toggle theme"
            onClick={onToggleTheme}
          >
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <Link
            to="/settings"
            className="min-h-10 min-w-10 rounded-xl p-2 text-[var(--av-muted)] transition-colors duration-200 hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)]"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
