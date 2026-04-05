import type { TFunction } from "i18next";

export type BreadcrumbItem = { label: string; to?: string };

/**
 * Trail for the shell header (Home is linked except on `/`).
 */
export function getRouteBreadcrumbs(t: TFunction, pathname: string): BreadcrumbItem[] {
  if (pathname === "/") {
    return [{ label: t("routes.homeTitle") }];
  }

  const home: BreadcrumbItem = { label: t("routes.homeTitle"), to: "/" };

  if (pathname === "/discover") return [home, { label: t("routes.discoverTitle") }];
  if (pathname === "/browse") return [home, { label: t("routes.browseTitle") }];
  if (pathname === "/explore") return [home, { label: t("routes.exploreTitle") }];
  if (pathname === "/clips") return [home, { label: t("routes.clipsTitle") }];
  if (pathname === "/lists") return [home, { label: t("routes.listsTitle") }];
  if (pathname === "/schedule") return [home, { label: t("routes.scheduleTitle") }];
  if (pathname === "/community") return [home, { label: t("routes.communityTitle") }];
  if (pathname === "/gallery") return [home, { label: t("routes.galleryTitle") }];
  if (pathname === "/request-series") return [home, { label: t("routes.requestTitle") }];
  if (pathname === "/terms") return [home, { label: t("routes.termsTitle") }];
  if (pathname === "/account" || pathname === "/login") return [home, { label: t("routes.accountTitle") }];
  if (pathname === "/settings") return [home, { label: t("routes.settingsTitle") }];
  if (pathname === "/watch") return [home, { label: t("routes.watchTitle") }];
  if (pathname === "/player") return [home, { label: t("routes.playerTitle") }];
  if (pathname === "/anime") return [home, { label: t("routes.animeSearchTitle") }];
  if (pathname.startsWith("/anime/")) {
    return [
      home,
      { label: t("routes.animeSearchTitle"), to: "/anime" },
      { label: t("routes.animeDetailTitle") },
    ];
  }
  return [home];
}
