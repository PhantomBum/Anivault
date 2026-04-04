import { AniVaultWordmark } from "@/renderer/components/anivault-wordmark";
import { Input } from "@/renderer/components/ui/input";
import { AniVaultNav } from "@/renderer/components/anivault-nav";
import { MiniPlayerBar } from "@/renderer/components/mini-player-bar";
import { useNowPlaying } from "@/renderer/context/now-playing-context";
import { AppCommandPalette } from "@/renderer/components/app-command-palette";
import { KeyboardShortcutsDialog } from "@/renderer/components/keyboard-shortcuts-dialog";
import { SidebarProfileFooter } from "@/renderer/components/sidebar-profile-footer";
import { useAnivaultConfig } from "@/renderer/context/anivault-config-context";
import { RouteErrorBoundary } from "@/renderer/components/route-error-boundary";
import { Titlebar } from "@/renderer/components/titlebar";
import { toggleNowPlayingPlayback } from "@/renderer/lib/now-playing-playback";
import { getRouteHeading } from "@/renderer/lib/route-headings";
import { cn } from "@/renderer/lib/utils";
import { APP_DISPLAY_NAME } from "@/shared/app-brand";
import { ChevronLeft, ChevronRight, ChevronUp, Keyboard, Menu, Search, Settings } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

const SIDEBAR_COLLAPSED_LS = "anivault-sidebar-collapsed";

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_LS) === "1";
  } catch {
    return false;
  }
}

/**
 * Layout aligned with `anivault/index.html`: fixed-width sidebar, main column + topbar, mobile drawer.
 * Collapsible sidebar shell (shadcn-style pattern).
 */
export default function SidebarLayout() {
  const { t } = useTranslation();
  const { config: avConfig } = useAnivaultConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const { title, sub } = useMemo(
    () => getRouteHeading(t, location.pathname),
    [t, location.pathname]
  );
  const isHome = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [isMdUp, setIsMdUp] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const prevPathnameForScrollRef = useRef(location.pathname);
  const { session: nowPlayingSession } = useNowPlaying();

  const railCollapsed = sidebarCollapsed && isMdUp;
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    document.title = `${title} · ${APP_DISPLAY_NAME}`;
  }, [title]);

  /** Restore main column scroll per route (sessionStorage). */
  useEffect(() => {
    const el = mainScrollRef.current;
    const from = prevPathnameForScrollRef.current;
    const to = location.pathname;
    if (from !== to) {
      try {
        sessionStorage.setItem(`anivault-main-scroll:${from}`, String(el?.scrollTop ?? 0));
      } catch {
        /* ignore */
      }
      prevPathnameForScrollRef.current = to;
      let top = 0;
      try {
        const raw = sessionStorage.getItem(`anivault-main-scroll:${to}`);
        if (raw != null) top = Number.parseInt(raw, 10) || 0;
      } catch {
        /* ignore */
      }
      requestAnimationFrame(() => {
        el?.scrollTo({ top, behavior: "auto" });
      });
    }
  }, [location.pathname]);

  const onMainScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setShowBackTop(e.currentTarget.scrollTop > 420);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        e.preventDefault();
        closeMobile();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.code === "Slash" || e.key === "/")) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        navigate("/anime", { state: { focusSearch: true } });
        closeMobile();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
        if (isTypingTarget(e.target)) return;
        if (nowPlayingSession && location.pathname !== "/watch") {
          e.preventDefault();
          toggleNowPlayingPlayback(nowPlayingSession);
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "p" || e.key === "P")) {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if (e.altKey && e.key === "ArrowLeft") {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        navigate(-1);
        return;
      }

      if (!e.altKey || e.repeat) return;

      const go = (path: string) => {
        e.preventDefault();
        navigate(path);
        closeMobile();
      };

      if (e.code === "Digit1" || e.code === "Numpad1" || e.code === "Digit0" || e.code === "Numpad0") {
        go("/");
      } else if (e.code === "Digit2" || e.code === "Numpad2") {
        go("/anime");
      } else if (e.code === "Digit3" || e.code === "Numpad3") {
        go("/settings");
      } else if (e.code === "Digit4" || e.code === "Numpad4") {
        go("/schedule");
      } else if (e.code === "Digit5" || e.code === "Numpad5") {
        go("/discover");
      } else if (e.code === "Digit6" || e.code === "Numpad6") {
        go("/lists");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, mobileOpen, closeMobile, nowPlayingSession, location.pathname]);

  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsMdUp(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_LS, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  return (
    <div
      className="anivault-shell min-h-screen text-[var(--av-text)]"
      data-density="comfortable"
      data-sidebar={railCollapsed ? "collapsed" : "expanded"}
      data-shell-effects="standard"
      data-chroma={avConfig?.chromaticEmphasis ?? "full"}
      data-shell-preset={avConfig?.shellPreset ?? "midnight"}
    >
      <Titlebar className="border-0 bg-transparent">
        <div className="flex min-w-0 flex-1 items-center gap-2" />
      </Titlebar>

      {/* Mobile menu (below window titlebar) */}
      <button
        type="button"
        className="fixed left-3 top-14 z-[60] flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)]/90 text-[var(--av-text)] shadow-sm transition-all duration-200 hover:bg-[var(--av-surface-hover)] active:scale-[0.98] md:hidden"
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-black/55 md:hidden"
          aria-label="Close navigation"
          onClick={closeMobile}
        />
      ) : null}

      <div className="flex w-full pt-12">
        <aside
          className={cn(
            "fixed bottom-0 left-0 top-12 z-[58] flex min-h-0 w-[var(--av-sidebar-w)] flex-col border-r border-[var(--av-border)] pb-3 pt-3 shadow-[4px_0_32px_rgba(0,0,0,0.35)] transition-[width,transform] duration-300 ease-out md:translate-x-0",
            "bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,transparent_46%),var(--av-bg-elevated)]",
            railCollapsed ? "px-2" : "px-3",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
          aria-label="Sidebar"
        >
          {railCollapsed ? (
            <div className="mb-4 flex flex-col items-center gap-3 border-b border-[var(--av-border)] px-0.5 pb-4 pt-1">
              <AniVaultWordmark compact className="py-0.5" />
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--av-muted)] transition-colors hover:bg-[var(--av-nav-active-bg)] hover:text-[var(--av-text)]"
                aria-label="Expand sidebar"
                title="Expand sidebar"
                onClick={() => setSidebarCollapsed(false)}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="mb-4 flex items-start gap-3 border-b border-[var(--av-border)] pb-4 pt-0.5">
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <AniVaultWordmark size="md" />
                  <span className="text-[0.68rem] font-medium text-[var(--av-muted-foreground)]">Unvaulted</span>
                </div>
                <span className="mt-1 block text-[0.68rem] leading-snug text-[var(--av-muted-foreground)]">
                  Desktop · ani-cli
                </span>
              </div>
              <button
                type="button"
                className="mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--av-muted)] transition-colors hover:bg-[var(--av-nav-active-bg)] hover:text-[var(--av-text)] md:flex"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                onClick={() => setSidebarCollapsed(true)}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          )}

          <AniVaultNav onNavigate={closeMobile} collapsed={railCollapsed} />

          <SidebarProfileFooter collapsed={railCollapsed} />

          <div
            className={cn(
              "border-t border-[var(--av-border)] pt-3 text-[0.65rem] leading-snug text-[var(--av-muted-foreground)]",
              railCollapsed && "hidden"
            )}
          >
            <p>
              <Link
                to="/terms"
                className="underline-offset-2 hover:text-[var(--av-muted)] hover:underline"
              >
                Terms
              </Link>
              {" · "}
              <span>
                ani-cli sources — not affiliated with licensors.
              </span>
            </p>
          </div>
        </aside>

        <div className="av-shell-main flex min-h-[calc(100vh-3rem)] min-w-0 flex-1 flex-col md:ml-[var(--av-sidebar-w)]">
          <header
            className={cn(
              "av-shell-header flex flex-wrap items-center gap-3 border-b border-[var(--av-border)]/90 py-3.5 pl-14 pr-[var(--av-page-pad-x)] md:pl-6",
              "bg-[var(--av-shell-header-blur)] backdrop-blur-xl supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--av-bg)_72%,transparent)]"
            )}
          >
            <div className="min-w-0 flex-1">
              <h1
                className="m-0 font-semibold leading-tight tracking-tight text-[var(--av-text)]"
                style={{ fontSize: "var(--av-shell-header-title)" }}
              >
                {title}
              </h1>
              {sub ? (
                <p className="mt-0.5 leading-snug text-[var(--av-muted)] [font-size:var(--av-shell-header-sub)]">
                  {sub}
                </p>
              ) : null}
            </div>
            <form
              className="mr-1 hidden min-w-0 max-w-[min(100%,14rem)] flex-1 md:flex"
              onSubmit={(e) => {
                e.preventDefault();
                const q = quickSearch.trim();
                navigate(
                  { pathname: "/anime", search: q ? `?q=${encodeURIComponent(q)}` : "" },
                  { state: { focusSearch: true } }
                );
                closeMobile();
                setQuickSearch("");
              }}
            >
              <div className="relative flex w-full items-center">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--av-muted)]"
                  aria-hidden
                />
                <Input
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="Search…"
                  className="h-9 rounded-xl border-[var(--av-border)] bg-[var(--av-surface)] py-0 pl-8 pr-2 text-xs text-[var(--av-text)] placeholder:text-[var(--av-muted)]"
                  aria-label="Quick search"
                />
              </div>
            </form>
            <div className="flex h-9 shrink-0 items-center gap-1">
              <Link
                to="/anime"
                state={{ focusSearch: true }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-[var(--av-muted)] transition-all duration-200 hover:border-[var(--av-border)] hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)] hover:shadow-av-xs md:hidden"
                title="Search"
                aria-label="Open search"
                onClick={closeMobile}
              >
                <Search className="h-5 w-5" strokeWidth={2} />
              </Link>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-[var(--av-muted)] transition-all duration-200 hover:border-[var(--av-border)] hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)] hover:shadow-av-xs"
                title="Keyboard shortcuts (Ctrl+/)"
                aria-label="Keyboard shortcuts"
                onClick={() => setShortcutsOpen(true)}
              >
                <Keyboard className="h-5 w-5" strokeWidth={2} />
              </button>
              <Link
                to="/settings"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-[var(--av-muted)] transition-all duration-200 hover:border-[var(--av-border)] hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)] hover:shadow-av-xs"
                title="Settings (Alt+3)"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" strokeWidth={2} />
              </Link>
            </div>
          </header>

          <div
            ref={mainScrollRef}
            onScroll={onMainScroll}
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain py-[var(--av-page-pad-y)] pl-[var(--av-page-pad-x)] pr-[var(--av-page-pad-x)] md:px-6",
              nowPlayingSession ? "pb-20" : "pb-6",
              isHome && "px-0 py-0"
            )}
          >
            <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
              <RouteErrorBoundary key={location.pathname}>
                <div
                  key={location.pathname}
                  className="motion-safe:animate-av-route-in motion-reduce:animate-none flex min-h-0 w-full min-w-0 flex-1 flex-col"
                >
                  <Outlet />
                </div>
              </RouteErrorBoundary>
            </main>
          </div>
        </div>
      </div>

      <MiniPlayerBar />

      {showBackTop ? (
        <button
          type="button"
          className={cn(
            "fixed right-5 z-[70] flex h-12 w-12 items-center justify-center rounded-full border border-[var(--av-border)] bg-[var(--av-surface)] text-[var(--av-text)] shadow-av-lg transition-all duration-200 hover:bg-[var(--av-surface-hover)] hover:shadow-av-md active:scale-95 md:right-8",
            nowPlayingSession ? "bottom-20" : "bottom-6"
          )}
          aria-label="Back to top"
          title="Back to top"
          onClick={() =>
            mainScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
          }
        >
          <ChevronUp className="h-5 w-5" strokeWidth={2} />
        </button>
      ) : null}

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <AppCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
    </div>
  );
}
