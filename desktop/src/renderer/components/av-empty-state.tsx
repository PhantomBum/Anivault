import { cn } from "@/renderer/lib/utils";
import type { LucideIcon } from "lucide-react";
import React from "react";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Consistent empty / zero-result surface across Discover, search, and lists.
 */
export function AvEmptyState({ icon: Icon, title, description, className, children }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--av-border)] bg-[var(--av-surface)]/30 px-6 py-14 text-center text-[var(--av-text)]",
        className
      )}
      role="status"
    >
      {Icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg-elevated)]">
          <Icon className="h-6 w-6 text-[var(--av-muted)]" aria-hidden />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-[var(--av-text)]">{title}</p>
      {description ? <p className="max-w-md text-xs leading-relaxed text-[var(--av-muted-foreground)]">{description}</p> : null}
      {children}
    </div>
  );
}
