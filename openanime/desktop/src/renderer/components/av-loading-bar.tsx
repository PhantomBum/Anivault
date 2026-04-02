import { cn } from "@/renderer/lib/utils";
import React from "react";

type AvLoadingBarProps = {
  className?: string;
  /** Show the small "Loading" caption (gate style). */
  showLabel?: boolean;
};

/** Grey / white progress strip — matches startup gate. */
export function AvLoadingBar({ className, showLabel = false }: AvLoadingBarProps) {
  return (
    <div className={cn("w-full max-w-xs space-y-3", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-900">
        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-neutral-600 via-white to-neutral-600 animate-gate-progress" />
      </div>
      {showLabel ? (
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">
          Loading
        </p>
      ) : null}
    </div>
  );
}
