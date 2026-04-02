import {
  Calendar,
  Compass,
  FileText,
  LayoutList,
  MessageSquarePlus,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "@/renderer/lib/utils";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  matchPrefix?: boolean;
};

const browseItems: NavItem[] = [
  { title: "Home", href: "/", icon: Compass },
  { title: "Discover", href: "/discover", icon: Sparkles },
  { title: "Find shows", href: "/anime", icon: Search, matchPrefix: true },
  { title: "My lists", href: "/lists", icon: LayoutList },
];

const moreItems: NavItem[] = [
  { title: "Calendar", href: "/schedule", icon: Calendar },
  { title: "Request a show", href: "/request-series", icon: MessageSquarePlus },
  { title: "Legal", href: "/terms", icon: FileText },
];

function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/") {
    return pathname === "/";
  }
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavButton({
  item,
  onNavigate,
  collapsed,
}: {
  item: NavItem;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const location = useLocation();
  const active = isNavActive(location.pathname, item);

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      title={collapsed ? item.title : undefined}
      aria-label={collapsed ? item.title : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl py-2 text-[0.8125rem] font-medium transition-all duration-200 ease-out",
        collapsed ? "justify-center px-2" : "border-l-2 border-transparent pl-[0.4rem] pr-2.5 text-left",
        !active && "text-[var(--av-muted)] hover:bg-[var(--av-surface-hover)] hover:text-[var(--av-text)]",
        active &&
          "bg-[var(--av-nav-active-bg)] text-[var(--av-text)] shadow-[inset_3px_0_0_0_var(--av-nav-active-edge),var(--av-shadow-xs)]",
        active && collapsed && "shadow-none ring-2 ring-white/25"
      )}
    >
      <item.icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-[var(--av-accent)]" : "text-[var(--av-muted)] opacity-90"
        )}
        strokeWidth={2}
        aria-hidden
      />
      {collapsed ? null : <span>{item.title}</span>}
    </Link>
  );
}

function NavSection({
  label,
  items,
  onNavigate,
  collapsed,
  sectionDivider,
}: {
  label: string;
  items: NavItem[];
  onNavigate?: () => void;
  collapsed?: boolean;
  sectionDivider?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {collapsed && sectionDivider ? (
        <div className="mx-auto my-1 h-px w-6 bg-[var(--av-border)]" aria-hidden />
      ) : null}
      {!collapsed ? (
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--av-muted-foreground)]">
          {label}
        </p>
      ) : null}
      {items.map((item) => (
        <NavButton key={item.href} item={item} onNavigate={onNavigate} collapsed={collapsed} />
      ))}
    </div>
  );
}

export function AniVaultNav({
  onNavigate,
  collapsed,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Main">
      <NavSection label="Library" items={browseItems} onNavigate={onNavigate} collapsed={collapsed} />
      <NavSection
        label="Tools"
        items={moreItems}
        onNavigate={onNavigate}
        collapsed={collapsed}
        sectionDivider
      />
    </nav>
  );
}
