import { cn } from "@/renderer/lib/utils";
import React from "react";

/**
 * Shared gradient surfaces: soft diagonal backgrounds + blurred orbs (indigo / rose / cyan by variant).
 * Used for Settings → Studio, Community / Gallery / Clips pages, and roadmap-style cards.
 */
const VARIANT_STYLES = {
  studio: {
    shell:
      "border-[var(--av-accent)]/25 bg-[linear-gradient(135deg,rgba(99,102,241,0.12)_0%,rgba(24,24,27,0.92)_45%,rgba(9,9,11,0.98)_100%)]",
    orbT: "bg-[var(--av-accent)]/15",
    orbB: "bg-fuchsia-500/10",
  },
  community: {
    shell:
      "border-indigo-400/30 bg-[linear-gradient(135deg,rgba(129,140,248,0.14)_0%,rgba(24,24,27,0.92)_42%,rgba(9,9,11,0.98)_100%)]",
    orbT: "bg-indigo-400/18",
    orbB: "bg-violet-500/12",
  },
  gallery: {
    shell:
      "border-rose-400/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.1)_0%,rgba(24,24,27,0.92)_42%,rgba(9,9,11,0.98)_100%)]",
    orbT: "bg-rose-400/14",
    orbB: "bg-fuchsia-500/11",
  },
  clips: {
    shell:
      "border-cyan-400/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.11)_0%,rgba(24,24,27,0.92)_42%,rgba(9,9,11,0.98)_100%)]",
    orbT: "bg-cyan-400/14",
    orbB: "bg-blue-500/10",
  },
} as const;

export type AvFutureVariant = keyof typeof VARIANT_STYLES;

type Props = {
  variant?: AvFutureVariant;
  id?: string;
  className?: string;
  children: React.ReactNode;
};

export function AvFutureSurface({ variant = "studio", id, className, children }: Props) {
  const v = VARIANT_STYLES[variant];
  return (
    <div id={id} className={cn("relative overflow-hidden rounded-2xl border", v.shell, className)}>
      <div
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl",
          v.orbT
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full blur-3xl",
          v.orbB
        )}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
