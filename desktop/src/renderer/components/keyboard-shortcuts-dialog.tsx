import { Button } from "@/renderer/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/renderer/components/ui/dialog";
import React from "react";

type Row = { keys: string; action: string };

const SHORTCUTS: Row[] = [
  { keys: "Ctrl K", action: "Open Find shows and focus search" },
  { keys: "Ctrl /", action: "Show this shortcuts list" },
  { keys: "N · B", action: "Next / previous episode (watch page)" },
  { keys: "Alt 1 · Alt 0", action: "Home" },
  { keys: "Alt 2", action: "Find shows" },
  { keys: "Alt 3", action: "Settings" },
  { keys: "/", action: "Focus Find in settings (when Settings is open)" },
  { keys: "Alt 4", action: "Calendar" },
  { keys: "Alt 5", action: "Discover" },
  { keys: "Alt 6", action: "My lists" },
  { keys: "Escape", action: "Close mobile sidebar (when open)" },
];

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-[var(--av-border)] bg-[var(--av-bg)] text-[var(--av-text)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription className="text-[var(--av-muted)]">
            Works when focus is not inside a text field (except Ctrl+/).
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map((row) => (
            <li
              key={row.keys + row.action}
              className="flex items-center justify-between gap-4 border-b border-[var(--av-border)]/60 py-2 last:border-0"
            >
              <span className="text-[var(--av-muted)]">{row.action}</span>
              <kbd className="shrink-0 rounded-md border border-[var(--av-border)] bg-[var(--av-surface)] px-2 py-1 font-mono text-[11px] text-[var(--av-text)]">
                {row.keys}
              </kbd>
            </li>
          ))}
        </ul>
        <Button type="button" variant="secondary" className="w-full rounded-xl" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
