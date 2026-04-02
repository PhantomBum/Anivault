import { SmoothCursor } from "@/renderer/components/smooth-cursor";
import React from "react";

/** Nexus-style smooth pointer — always on (hit-testing stays the real OS cursor). */
export function SmoothCursorHost() {
  return <SmoothCursor />;
}
