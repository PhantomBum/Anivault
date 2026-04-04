import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/renderer/components/ui/command";
import { useNowPlaying } from "@/renderer/context/now-playing-context";
import { showToast } from "@/renderer/lib/av-toast";
import { SETTINGS_TABS, type SettingsTab } from "@/renderer/lib/settings-search-index";
import {
  Calendar,
  Clapperboard,
  FileText,
  Grid3x3,
  Home,
  ImageIcon,
  Keyboard,
  List,
  MessageSquarePlus,
  PictureInPicture2,
  Search,
  Settings,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const SETTINGS_TAB_LABELS: Record<SettingsTab, string> = {
  playback: "Playback",
  appearance: "Appearance",
  language: "Language",
  translation: "Translation",
  shortcuts: "Shortcuts & input",
  updates: "Updates",
  data: "Data",
  privacy: "Privacy & diagnostics",
  labs: "Studio",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenShortcuts: () => void;
};

/**
 * Quick navigation and actions (Ctrl+Shift+P). Does not replace Ctrl+K → Find shows.
 */
export function AppCommandPalette({ open, onOpenChange, onOpenShortcuts }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useNowPlaying();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const copyDiagnostics = () => {
    onOpenChange(false);
    void (async () => {
      try {
        const v = await window.app.version();
        const os = await window.app.os();
        const line = `AniVault ${v} · ${os} · ${window.location.hash || "#/"}`;
        await navigator.clipboard.writeText(line);
        showToast(t("commandPalette.toastDiagnosticsCopied"));
      } catch {
        showToast(t("commandPalette.toastDiagnosticsFailed"), 3200);
      }
    })();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("commandPalette.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("commandPalette.empty")}</CommandEmpty>
        <CommandGroup heading={t("commandPalette.groupGoTo")}>
          <CommandItem onSelect={() => go("/")}>
            <Home className="mr-2 h-4 w-4" />
            {t("commandPalette.home")}
          </CommandItem>
          <CommandItem onSelect={() => go("/discover")}>
            <Sparkles className="mr-2 h-4 w-4" />
            {t("commandPalette.discover")}
          </CommandItem>
          <CommandItem onSelect={() => go("/browse")}>
            <Grid3x3 className="mr-2 h-4 w-4" />
            {t("commandPalette.browse")}
          </CommandItem>
          <CommandItem onSelect={() => go("/anime")}>
            <Search className="mr-2 h-4 w-4" />
            {t("commandPalette.findShows")}
          </CommandItem>
          <CommandItem onSelect={() => go("/lists")}>
            <List className="mr-2 h-4 w-4" />
            {t("commandPalette.myLists")}
          </CommandItem>
          <CommandItem onSelect={() => go("/schedule")}>
            <Calendar className="mr-2 h-4 w-4" />
            {t("commandPalette.calendar")}
          </CommandItem>
          <CommandItem onSelect={() => go("/watch")}>
            <PictureInPicture2 className="mr-2 h-4 w-4" />
            {t("commandPalette.watchPage")}
          </CommandItem>
          <CommandItem onSelect={() => go("/community")}>
            <Users className="mr-2 h-4 w-4" />
            {t("commandPalette.community")}
          </CommandItem>
          <CommandItem onSelect={() => go("/gallery")}>
            <ImageIcon className="mr-2 h-4 w-4" />
            {t("commandPalette.gallery")}
          </CommandItem>
          <CommandItem onSelect={() => go("/clips")}>
            <Clapperboard className="mr-2 h-4 w-4" />
            {t("commandPalette.clips")}
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("commandPalette.groupTools")}>
          <CommandItem onSelect={() => go("/request-series")}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            {t("commandPalette.requestSeries")}
          </CommandItem>
          <CommandItem onSelect={() => go("/terms")}>
            <FileText className="mr-2 h-4 w-4" />
            {t("commandPalette.terms")}
          </CommandItem>
          <CommandItem onSelect={() => go("/account")}>
            <User className="mr-2 h-4 w-4" />
            {t("commandPalette.account")}
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("commandPalette.groupSettings")}>
          {SETTINGS_TABS.map((tab) => (
            <CommandItem
              key={tab}
              onSelect={() => {
                onOpenChange(false);
                navigate(`/settings?tab=${tab}`);
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              {SETTINGS_TAB_LABELS[tab]}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("commandPalette.groupPlayback")}>
          <CommandItem
            disabled={!session?.resumeWatch}
            onSelect={() => {
              session?.resumeWatch?.();
              onOpenChange(false);
            }}
          >
            <PictureInPicture2 className="mr-2 h-4 w-4" />
            {t("commandPalette.resumeWatch")}
          </CommandItem>
          <CommandItem
            disabled={!session?.scrollToPlayer}
            onSelect={() => {
              session?.scrollToPlayer?.();
              onOpenChange(false);
            }}
          >
            <PictureInPicture2 className="mr-2 h-4 w-4" />
            {t("commandPalette.scrollToPlayer")}
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("commandPalette.groupHelp")}>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              onOpenShortcuts();
            }}
          >
            <Keyboard className="mr-2 h-4 w-4" />
            {t("commandPalette.keyboardShortcuts")}
          </CommandItem>
          <CommandItem onSelect={copyDiagnostics}>
            <Keyboard className="mr-2 h-4 w-4" />
            {t("commandPalette.copyDiagnostics")}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
