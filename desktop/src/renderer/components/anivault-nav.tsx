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

const HUB_ITEMS: NavItem[] = [
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
        "group relative flex w-full items-center gap-3 rounded-xl py-2.5 text-[0.8125rem] font-medium transition-all duration-200 ease-out",
        collapsed ? "justify-center px-2" : "px-3 text-left",
        !active &&
          "text-[var(--av-muted)] hover:bg-white/[0.045] hover:text-[var(--av-text)] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]",
        active &&
          "bg-gradient-to-r from-white/[0.07] to-[var(--av-nav-active-bg)] text-[var(--av-text)] shadow-[inset_3px_0_0_0_var(--av-nav-active-edge)]",
        active && collapsed && "ring-1 ring-white/15"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
          active
            ? "bg-white/[0.08] text-[var(--av-accent)] shadow-inner"
            : "bg-transparent text-[var(--av-muted)] group-hover:bg-white/[0.05] group-hover:text-[var(--av-text)]"
        )}
      >
        <item.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      {collapsed ? null : <span className="truncate">{title}</span>}
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
        <p className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--av-muted-foreground)]">
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
  const hubTitles = HUB_ITEMS.map((i) => t(i.titleKey));

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
        label={t("nav.sectionHub")}
        items={HUB_ITEMS}
        itemTitles={hubTitles}
        onNavigate={onNavigate}
        collapsed={collapsed}
        sectionDivider
      />
    </nav>
  );
}
