import React from "react";

import { GalleryPage } from "@/renderer/pages/gallery-page";

/**
 * Dedicated route for the clips tab of the shared gallery (moderated clip thumbnails + upload when signed in).
 */
export function ClipsPage() {
  return <GalleryPage defaultTab="clips" />;
}
