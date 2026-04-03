import {
  Calendar,
  Clapperboard,
  Compass,
  FileText,
  ImageIcon,
  LayoutList,
  MessageSquarePlus,
  Search,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { cn } from "@/renderer/lib/utils";

type NavItem = {
  titleKey: string;
  href: string;
  icon: LucideIcon;
  matchPrefix?: boolean;
};

const LIBRARY_ITEMS: NavItem[] = [
  { titleKey: "nav.home", href: "/", icon: Compass },
  { titleKey: "nav.discover", href: "/discover", icon: Sparkles },
  { titleKey: "nav.findShows", href: "/anime", icon: Search, matchPrefix: true },
  { titleKey: "nav.myLists", href: "/lists", icon: LayoutList },
];

const TOOLS_ITEMS: NavItem[] = [
  { titleKey: "nav.calendar", href: "/schedule", icon: Calendar },
  { titleKey: "nav.requestShow", href: "/request-series", icon: MessageSquarePlus },
  { titleKey: "nav.legal", href: "/terms", icon: FileText },
];

const COMING_SOON_ITEMS: NavItem[] = [
  { titleKey: "nav.community", href: "/community", icon: Users },
  { titleKey: "nav.gallery", href: "/gallery", icon: ImageIcon },
  { titleKey: "nav.clips", href: "/clips", icon: Clapperboard },
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
  title,
  onNavigate,
  collapsed,
}: {
  item: NavItem;
  title: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const location = useLocation();
  const active = isNavActive(location.pathname, item);

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      title={collapsed ? title : undefined}
      aria-label={collapsed ? title : undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg py-2 text-[0.8125rem] font-medium transition-colors duration-150 ease-out",
        collapsed ? "justify-center px-2" : "px-2.5 text-left",
        !active && "text-[var(--av-muted)] hover:bg-[var(--av-accent-muted)] hover:text-[var(--av-text)]",
        active && "bg-[var(--av-nav-active-bg)] text-[var(--av-text)] ring-1 ring-white/[0.07]",
        active && collapsed && "ring-2 ring-white/20"
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
      {collapsed ? null : <span>{title}</span>}
    </Link>
  );
}

function NavSection({
  label,
  items,
  itemTitles,
  onNavigate,
  collapsed,
  sectionDivider,
}: {
  label: string;
  items: NavItem[];
  itemTitles: string[];
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
        <p className="px-2.5 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--av-muted-foreground)]/90">
          {label}
        </p>
      ) : null}
      {items.map((item, i) => (
        <NavButton
          key={item.href}
          item={item}
          title={itemTitles[i] ?? item.titleKey}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
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
  const { t } = useTranslation();

  const libraryTitles = LIBRARY_ITEMS.map((i) => t(i.titleKey));
  const toolsTitles = TOOLS_ITEMS.map((i) => t(i.titleKey));
  const comingSoonTitles = COMING_SOON_ITEMS.map((i) => t(i.titleKey));

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Main">
      <NavSection
        label={t("nav.sectionLibrary")}
        items={LIBRARY_ITEMS}
        itemTitles={libraryTitles}
        onNavigate={onNavigate}
        collapsed={collapsed}
      />
      <NavSection
        label={t("nav.sectionTools")}
        items={TOOLS_ITEMS}
        itemTitles={toolsTitles}
        onNavigate={onNavigate}
        collapsed={collapsed}
        sectionDivider
      />
      <NavSection
        label={t("nav.sectionComingSoon")}
        items={COMING_SOON_ITEMS}
        itemTitles={comingSoonTitles}
        onNavigate={onNavigate}
        collapsed={collapsed}
        sectionDivider
      />
    </nav>
  );
}
