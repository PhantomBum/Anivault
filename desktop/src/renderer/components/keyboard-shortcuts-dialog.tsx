import { Button } from "@/renderer/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/renderer/components/ui/dialog";
import { KEYBOARD_SHORTCUT_ROWS } from "@/renderer/lib/keyboard-shortcuts-data";
import React from "react";

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-[var(--av-border)]/90 bg-[linear-gradient(165deg,rgba(22,22,28,0.98)_0%,rgba(10,10,12,0.99)_100%)] text-[var(--av-text)] shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription className="text-[var(--av-muted)]">
            Works when focus is not inside a text field (except Ctrl+/).
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {KEYBOARD_SHORTCUT_ROWS.map((row) => (
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
