import { SmoothCursor } from "@/renderer/components/smooth-cursor";
import { useAnivaultConfig } from "@/renderer/context/anivault-config-context";
import React from "react";

/** Renders custom cursor only when enabled in Settings (off by default). */
export function SmoothCursorHost() {
  const { config } = useAnivaultConfig();
  if (!config?.smoothCursor) return null;
  return <SmoothCursor />;
}
