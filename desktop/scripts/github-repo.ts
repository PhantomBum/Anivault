/**
 * Single source for GitHub owner/name used by Forge publisher, Vite defines, and docs.
 * Reads `package.json` → `repository.url` (or string `repository`).
 */
import pkg from "../package.json";

export type GithubRepo = { owner: string; name: string };

function repositoryUrl(): string {
  const r = pkg.repository as { url?: string } | string | undefined;
  if (typeof r === "string") return r;
  return r?.url ?? "";
}

/** Parse owner/repo from https://github.com/OWNER/NAME.git */
export function getGithubRepoFromPackageJson(): GithubRepo {
  const url = repositoryUrl();
  const m = String(url).match(/github\.com[/:]([\w-]+)\/([\w.-]+?)(?:\.git)?/i);
  if (m) return { owner: m[1], name: m[2] };
  return { owner: "anivault", name: "anivault" };
}

/**
 * In GitHub Actions, `GITHUB_REPOSITORY` is `owner/repo` — use that when publishing
 * so the token uploads to the same repo the workflow runs in.
 */
export function resolveGithubRepoForPublish(): GithubRepo {
  const fromEnv = process.env.GITHUB_REPOSITORY;
  if (fromEnv && fromEnv.includes("/")) {
    const [owner, name] = fromEnv.split("/", 2);
    if (owner && name) return { owner, name };
  }
  const fromEnvOwner = process.env.GITHUB_REPOSITORY_OWNER;
  const fromEnvName = process.env.GITHUB_REPOSITORY_NAME;
  if (fromEnvOwner && fromEnvName) {
    return { owner: fromEnvOwner.trim(), name: fromEnvName.trim() };
  }
  return getGithubRepoFromPackageJson();
}
