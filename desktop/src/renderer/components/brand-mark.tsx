import { cn } from "@/renderer/lib/utils";
import React from "react";

import LogoRoundedSquareLight from "@/renderer/assets/logo-rounded-square-light.svg?url";
import LogoRoundedSquare from "@/renderer/assets/logo-rounded-square.svg?url";

/**
 * Official AniVault mark (rounded-square SVG assets).
 * Light theme → dark tile; dark theme → light tile — matches `titlebar-*.tsx`.
 */
export function BrandMark({
  className,
  size = "sidebar",
}: {
  className?: string;
  /** `sidebar` rail · `header` page title row · `hero` home · `gate` splash */
  size?: "sidebar" | "header" | "hero" | "gate";
}) {
  const dim =
    size === "gate"
      ? "h-24 w-24 min-h-24 min-w-24 md:h-28 md:w-28"
      : size === "hero"
        ? "h-[5.25rem] w-[5.25rem] min-h-[5.25rem] min-w-[5.25rem] md:h-[6rem] md:w-[6rem] md:min-h-[6rem] md:min-w-[6rem]"
        : size === "header"
          ? "h-9 w-9 min-h-9 min-w-9"
          : "h-9 w-9 min-h-9 min-w-9";

  const rounding =
    size === "gate"
      ? "rounded-[1.35rem] md:rounded-[1.5rem]"
      : size === "hero"
        ? "rounded-2xl"
        : "rounded-xl";

  return (
    <div
      className={cn(
        "shrink-0 select-none overflow-hidden bg-black/5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.08] dark:bg-white/[0.04]",
        rounding,
        dim,
        className
      )}
      aria-hidden
    >
      <img
        src={LogoRoundedSquare}
        alt=""
        draggable={false}
        className="h-full w-full object-cover dark:hidden"
      />
      <img
        src={LogoRoundedSquareLight}
        alt=""
        draggable={false}
        className="hidden h-full w-full object-cover dark:block"
      />
    </div>
  );
}
