import type { TFunction } from "i18next";

import { APP_DISPLAY_NAME } from "@/shared/app-brand";

/**
 * Single source of truth for shell header title/subtitle (aligned with sidebar nav + i18n).
 */
export function getRouteHeading(t: TFunction, pathname: string): { title: string; sub: string } {
  if (pathname === "/") {
    return { title: t("routes.homeTitle"), sub: t("routes.homeSub") };
  }
  if (pathname === "/discover") {
    return { title: t("routes.discoverTitle"), sub: t("routes.discoverSub") };
  }
  if (pathname === "/browse") {
    return { title: t("routes.browseTitle"), sub: t("routes.browseSub") };
  }
  if (pathname === "/explore") {
    return { title: t("routes.exploreTitle"), sub: t("routes.exploreSub") };
  }
  if (pathname === "/clips") {
    return { title: t("routes.clipsTitle"), sub: t("routes.clipsSub") };
  }
  if (pathname === "/lists") {
    return { title: t("routes.listsTitle"), sub: t("routes.listsSub") };
  }
  if (pathname.startsWith("/anime/")) {
    return { title: t("routes.animeDetailTitle"), sub: t("routes.animeDetailSub") };
  }
  if (pathname === "/anime") {
    return { title: t("routes.animeSearchTitle"), sub: t("routes.animeSearchSub") };
  }
  if (pathname === "/watch") {
    return { title: t("routes.watchTitle"), sub: t("routes.watchSub") };
  }
  if (pathname === "/player") {
    return { title: t("routes.playerTitle"), sub: t("routes.playerSub") };
  }
  if (pathname === "/settings") {
    return { title: t("routes.settingsTitle"), sub: t("routes.settingsSub") };
  }
  if (pathname === "/community") {
    return { title: t("routes.communityTitle"), sub: t("routes.communitySub") };
  }
  if (pathname === "/gallery") {
    return { title: t("routes.galleryTitle"), sub: t("routes.gallerySub") };
  }
  if (pathname === "/schedule") {
    return { title: t("routes.scheduleTitle"), sub: t("routes.scheduleSub") };
  }
  if (pathname === "/request-series") {
    return { title: t("routes.requestTitle"), sub: t("routes.requestSub") };
  }
  if (pathname === "/terms") {
    return { title: t("routes.termsTitle"), sub: t("routes.termsSub") };
  }
  if (pathname === "/account" || pathname === "/login") {
    return { title: t("routes.accountTitle"), sub: t("routes.accountSub") };
  }
  return { title: APP_DISPLAY_NAME, sub: "" };
}
