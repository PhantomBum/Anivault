import { cn } from "@/renderer/lib/utils";
import React, { useId } from "react";

/** Vector vault mark — crisp at any size (no bitmap scaling). */
export function BrandMark({
  className,
  size = "sidebar",
}: {
  className?: string;
  /** `sidebar` · `hero` welcome · `gate` splash */
  size?: "sidebar" | "hero" | "gate";
}) {
  const gid = useId().replace(/:/g, "");
  const dim =
    size === "gate"
      ? "h-20 w-20 min-h-20 min-w-20"
      : size === "hero"
        ? "h-[5.25rem] w-[5.25rem] min-h-[5.25rem] min-w-[5.25rem]"
        : "h-9 w-9 min-h-9 min-w-9";

  return (
    <div
      className={cn(
        "shrink-0 select-none rounded-[10px] border border-white/12 bg-zinc-950 shadow-inner ring-1 ring-white/[0.04]",
        size === "hero" && "rounded-2xl",
        size === "gate" && "rounded-3xl",
        dim,
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        className="h-full w-full rounded-[inherit] text-zinc-100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`avVaultGrad-${gid}`} x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fafafa" />
            <stop offset="1" stopColor="#a1a1aa" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" className="fill-zinc-950" />
        <path
          d="M8 9h7v14H8V9zm9 0h7v7h-7V9zm0 9h7v5h-7v-5z"
          fill={`url(#avVaultGrad-${gid})`}
          opacity="0.96"
        />
        <path d="M8 22h16v2H8v-2z" className="fill-zinc-500/60" />
      </svg>
    </div>
  );
}
