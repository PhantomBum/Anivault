import { cn } from "@/renderer/lib/utils";
import React from "react";

/** Vault mark — uses `public/icon.png` (monochrome source asset). */
export function BrandMark({
  className,
  size = "sidebar",
}: {
  className?: string;
  /** `sidebar` 36px · `hero` welcome home · `gate` splash */
  size?: "sidebar" | "hero" | "gate";
}) {
  const dim =
    size === "gate"
      ? "h-20 w-20 min-h-20 min-w-20 rounded-3xl"
      : size === "hero"
        ? "h-[5.25rem] w-[5.25rem] min-h-[5.25rem] min-w-[5.25rem] rounded-2xl"
        : "h-9 w-9 min-h-9 min-w-9 rounded-[10px]";

  /** Must be relative to `index.html` — matches rounded taskbar/window icon. */
  const iconSrc = `${import.meta.env.BASE_URL}icon-rounded.png`;

  return (
    <img
      src={iconSrc}
      alt=""
      role="presentation"
      draggable={false}
      className={cn(
        "shrink-0 select-none border border-white/10 bg-black object-cover shadow-inner",
        dim,
        className
      )}
    />
  );
}
