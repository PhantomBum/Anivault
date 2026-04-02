import { cn } from "@/renderer/lib/utils";
import React from "react";

type AvLoadingBarProps = {
  className?: string;
  /** Show the small caption under the bar (gate style). */
  showLabel?: boolean;
  /** Caption text; defaults to "Loading" when `showLabel` is true. */
  label?: string;
  /**
   * 0–100 determinate fill. When omitted, uses an indeterminate shimmer (legacy / short waits).
   */
  progress?: number;
};

/** Grey / white progress strip — matches startup gate. */
export function AvLoadingBar({ className, showLabel = false, label, progress }: AvLoadingBarProps) {
  const determinate = typeof progress === "number" && Number.isFinite(progress);
  const clamped = determinate ? Math.min(100, Math.max(0, progress)) : null;

  return (
    <div className={cn("w-full max-w-xs space-y-3", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-900">
        {determinate && clamped !== null ? (
          <div
            className="h-full rounded-full bg-gradient-to-r from-neutral-500 via-white to-neutral-400 transition-[width] duration-300 ease-out"
            style={{ width: `${clamped}%` }}
          />
        ) : (
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-neutral-600 via-white to-neutral-600 animate-gate-progress" />
        )}
      </div>
      {showLabel ? (
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">
          {label ?? "Loading"}
        </p>
      ) : null}
    </div>
  );
}
