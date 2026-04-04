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
        "relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border border-dashed border-[var(--av-border)]/90 bg-[linear-gradient(165deg,rgba(24,24,30,0.85)_0%,rgba(12,12,16,0.92)_100%)] px-8 py-16 text-center text-[var(--av-text)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-[2px]",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,140,200,0.08),transparent_55%)] before:content-['']",
        className
      )}
      role="status"
    >
      {Icon ? (
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--av-border)]/80 bg-[var(--av-bg-elevated)]/90 shadow-av-md ring-1 ring-white/[0.06]">
          <Icon className="h-7 w-7 text-[var(--av-accent-dim)]" aria-hidden />
        </div>
      ) : null}
      <p className="relative text-base font-semibold tracking-tight text-[var(--av-text)]">{title}</p>
      {description ? (
        <p className="relative max-w-md text-sm leading-relaxed text-[var(--av-muted-foreground)]">{description}</p>
      ) : null}
      {children ? <div className="relative z-[1] mt-1">{children}</div> : null}
    </div>
  );
}
