import { BrandMark } from "@/renderer/components/brand-mark";
import { AniVaultNav } from "@/renderer/components/anivault-nav";
import { MiniPlayerBar } from "@/renderer/components/mini-player-bar";
import { useNowPlaying } from "@/renderer/context/now-playing-context";
import { KeyboardShortcutsDialog } from "@/renderer/components/keyboard-shortcuts-dialog";
import { SidebarProfileFooter } from "@/renderer/components/sidebar-profile-footer";
import { RouteErrorBoundary } from "@/renderer/components/route-error-boundary";
import { Titlebar } from "@/renderer/components/titlebar";
import { cn } from "@/renderer/lib/utils";
import { ChevronLeft, ChevronRight, ChevronUp, Keyboard, Menu, Settings } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

function useRouteHeading(pathname: string): { title: string; sub: string } {
  if (pathname === "/") {
    return { title: "Home", sub: "Continue watching · spotlight" };
  }
  if (pathname === "/discover") {
    return { title: "Discover", sub: "Popular · trending · seasonal picks" };
  }
  if (pathname === "/browse") {
    return { title: "Discover", sub: "Redirected from Series" };
  }
  if (pathname === "/explore") {
    return { title: "Explore", sub: "Redirecting to Discover…" };
  }
  if (pathname === "/clips") {
    return { title: "Clips", sub: "Community moments" };
  }
  if (pathname === "/lists") {
    return { title: "My lists", sub: "Local watchlist" };
  }
  if (pathname.startsWith("/anime/")) {
    return { title: "Series", sub: "Details & episodes" };
  }
  if (pathname === "/anime") {
    return { title: "Find shows", sub: "Search & filters" };
  }
  if (pathname === "/watch") {
    return { title: "Watch", sub: "Now playing" };
  }
  if (pathname === "/player") {
    return { title: "Player", sub: "Legacy" };
  }
  if (pathname === "/settings") {
    return { title: "Settings", sub: "Playback · security · i18n" };
  }
  if (pathname === "/community") {
    return { title: "Community", sub: "Servers · threads" };
  }
  if (pathname === "/gallery") {
    return { title: "Gallery", sub: "Art" };
  }
  if (pathname === "/schedule") {
    return { title: "Calendar", sub: "Coming to AniVault" };
  }
  if (pathname === "/request-series") {
    return { title: "Request a show", sub: "Suggest a title" };
  }
  if (pathname === "/terms") {
    return { title: "Legal", sub: "Terms of service" };
  }
  if (pathname === "/account" || pathname === "/login") {
    return { title: "Account", sub: "Sign in" };
  }
  return { title: "AniVault", sub: "" };
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
  const location = useLocation();
  const navigate = useNavigate();
  const { title, sub } = useRouteHeading(location.pathname);
  const isHome = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [isMdUp, setIsMdUp] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const { session: nowPlayingSession } = useNowPlaying();

  const railCollapsed = sidebarCollapsed && isMdUp;
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    document.title = `${title} · AniVault`;
  }, [title]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
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
  }, [navigate, mobileOpen, closeMobile]);

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
    >
      <Titlebar className="border-0 bg-transparent">
        <div className="flex min-w-0 flex-1 items-center gap-2" />
      </Titlebar>

      {/* Mobile menu (below window titlebar) */}
      <button
        type="button"
        className="fixed left-3 top-14 z-[60] flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] text-[var(--av-text)] shadow-av-md transition-all duration-200 hover:bg-[var(--av-surface-hover)] hover:shadow-av-lg active:scale-95 md:hidden"
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
            "fixed bottom-0 left-0 top-12 z-[58] flex min-h-0 w-[var(--av-sidebar-w)] flex-col border-r border-[var(--av-border)] bg-[var(--av-bg-elevated)] pb-3 pt-4 shadow-[4px_0_24px_rgba(0,0,0,0.28)] transition-[width,transform] duration-300 ease-out md:translate-x-0",
            railCollapsed ? "px-2" : "px-4",
            mobileOpen ? "translate-x-0 shadow-av-lg" : "-translate-x-full md:translate-x-0"
          )}
          aria-label="Sidebar"
        >
          {railCollapsed ? (
            <div className="mb-3 flex flex-col items-center gap-2 border-b border-[var(--av-border)] px-1 pb-4 pt-0.5">
              <BrandMark size="sidebar" />
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] text-[var(--av-muted)] shadow-av-xs transition-all duration-200 hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)] hover:shadow-av-sm"
                aria-label="Expand sidebar"
                title="Expand sidebar"
                onClick={() => setSidebarCollapsed(false)}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="mb-3 flex items-center gap-2 border-b border-[var(--av-border)] px-2 pb-5 pt-0.5">
              <BrandMark size="sidebar" />
              <div className="min-w-0 flex-1">
                <h1 className="m-0 text-[1.05rem] font-bold leading-tight tracking-tight">
                  AniVault
                </h1>
                <span className="mt-0.5 block text-[0.72rem] leading-snug text-[var(--av-muted-foreground)]">
                  Desktop · ani-cli
                </span>
              </div>
              <button
                type="button"
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] text-[var(--av-muted)] shadow-av-xs transition-all duration-200 hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)] hover:shadow-av-sm md:flex"
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
              "border-t border-[var(--av-border)] pt-2 text-[0.65rem] leading-snug text-[var(--av-muted-foreground)]",
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
              "av-shell-header flex flex-wrap items-center gap-2 border-b border-[var(--av-border)] py-2.5 pl-14 pr-[var(--av-page-pad-x)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] md:pl-6",
              "bg-[var(--av-bg)]"
            )}
          >
            <div className="min-w-0 flex-1">
              <h1
                className="m-0 font-bold leading-tight tracking-tight text-[var(--av-text)]"
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
            <div className="flex h-9 shrink-0 items-center gap-1">
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
              "flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto py-[var(--av-page-pad-y)] pl-[var(--av-page-pad-x)] pr-[var(--av-page-pad-x)] md:px-6",
              nowPlayingSession ? "pb-20" : "pb-6",
              isHome && "px-0 py-0"
            )}
          >
            <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
              <RouteErrorBoundary key={location.pathname}>
                <Outlet />
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
    </div>
  );
}
