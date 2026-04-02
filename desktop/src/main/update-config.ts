/**
 * GitHub org/repo used for:
 * - `electron-updater` (needs `latest.yml` + nupkg in GitHub Releases when you ship)
 * - `checkGitHubReleaseVsCurrent` (API compare for “new version” banner)
 *
 * Defaults come from `package.json` → `repository.url` at build time (`__ANIVAULT_GH_*__`).
 * Override at runtime: `ANIVAULT_GITHUB_OWNER` / `ANIVAULT_GITHUB_REPO`.
 */

export const GITHUB_UPDATE_OWNER = (
  process.env.ANIVAULT_GITHUB_OWNER?.trim() ||
  (typeof __ANIVAULT_GH_OWNER__ !== "undefined" ? __ANIVAULT_GH_OWNER__ : "anivault")
).trim();

export const GITHUB_UPDATE_REPO = (
  process.env.ANIVAULT_GITHUB_REPO?.trim() ||
  (typeof __ANIVAULT_GH_REPO__ !== "undefined" ? __ANIVAULT_GH_REPO__ : "anivault")
).trim();

export const GITHUB_REPO_SLUG = `${GITHUB_UPDATE_OWNER}/${GITHUB_UPDATE_REPO}` as const;

/**
 * Background `checkForUpdates` + periodic polling. Off by default so missing `latest.yml`
 * does not spam the console until your release pipeline publishes updater metadata.
 *
 * Enable when ready: `ANIVAULT_AUTO_UPDATE=1` (e.g. in packaged app env or launcher).
 */
export function isBackgroundAutoUpdateEnabled(): boolean {
  return process.env.ANIVAULT_AUTO_UPDATE === "1";
}
