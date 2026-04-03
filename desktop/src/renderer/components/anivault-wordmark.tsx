import { cn } from "@/renderer/lib/utils";
import React from "react";

const SIZE_CLASS = {
  xs: "text-[0.7rem] leading-none",
  sm: "text-sm leading-tight",
  md: "text-base leading-tight",
  lg: "text-lg leading-tight",
  titlebar: "text-[0.8rem] leading-none",
  hero: "text-[1.85rem] leading-none md:text-[2.15rem]",
  gate: "text-[2.35rem] leading-none tracking-[-0.03em] md:text-[2.75rem]",
} as const;

/**
 * Text logotype: **AniVault** (not the diamond icon). Use everywhere the app should read as “AniVault”.
 */
export function AniVaultWordmark({
  className,
  size = "md",
  compact = false,
  inverted = false,
}: {
  className?: string;
  size?: keyof typeof SIZE_CLASS;
  /** Narrow rail: stacked **Ani** / **Vault** */
  compact?: boolean;
  /** Light-on-dark (e.g. access gate splash) */
  inverted?: boolean;
}) {
  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex select-none flex-col items-center leading-[1.05] text-[0.62rem] font-bold tracking-tight",
          className
        )}
        aria-hidden
      >
        <span className={inverted ? "text-zinc-400" : "text-[var(--av-muted)]"}>Ani</span>
        <span className={inverted ? "text-white" : "text-[var(--av-text)]"}>Vault</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex select-none items-baseline font-bold tracking-[-0.04em]",
        !inverted && "text-[var(--av-text)]",
        SIZE_CLASS[size],
        className
      )}
      aria-label="AniVault"
    >
      <span
        className={cn("font-semibold", inverted ? "text-zinc-400" : "text-[var(--av-muted)]")}
      >
        Ani
      </span>
      <span
        className={cn("font-extrabold", inverted ? "text-white" : "text-[var(--av-text)]")}
      >
        Vault
      </span>
    </span>
  );
}
