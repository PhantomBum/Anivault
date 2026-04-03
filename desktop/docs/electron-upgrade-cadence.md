# Electron upgrade cadence (phase 28)

## Policy

- **Minor/patch** Electron releases (e.g. 41.x → 41.y): evaluate monthly or when security advisories apply to Chromium in your line.
- **Major** bumps (e.g. 40 → 41): plan a dedicated test pass (see `bug-bash-milestone.md`) plus native module rebuild (Forge handles most of this).

## Process

1. Check [Electron releases](https://github.com/electron/electron/releases) and [security advisories](https://github.com/electron/electron/security/advisories).
2. Update `devDependencies` in `package.json` (`electron`, `@electron-forge/*` aligned with Forge docs).
3. Run `npm install`, then `npm run build` on Windows (primary target).
4. Smoke: watch playback, IPC (ani-cli bridge), auto-updater dry run if you ship updates.
5. If you use `electron-store` or native deps, verify no ABI warnings in the build log.

## Pinning

- Keep `electron` on a **known-good** range; avoid floating to `latest` without QA.
- Document the chosen version in release notes when you cut a tag.

## Rollback

If a regression appears after upgrade, revert the `electron` + `package-lock.json` bump and re-open the issue with the failing Chromium/Electron version.
