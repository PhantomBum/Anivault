# AniVault Unvaulted (desktop)

Electron + Vite. The interesting bit is the bridge to **ani-cli** for streams; the rest is layout, settings, watch UI, and the usual desktop glue.

## Install (end users)

1. [Releases → Latest](https://github.com/PhantomBum/Anivault/releases/latest)  
2. **`AniVaultUnvaultedSetup.exe`** → run → follow the prompt (one installer; Squirrel adds Start menu / uninstall entry).  
3. Optional: if SmartScreen appears → **More info** → **Run anyway**.

Changelog: [`UPDATE-LOGS.txt`](../UPDATE-LOGS.txt) and **Settings → Updates** in the app.

---

## Dev setup

- Node 20+, npm
- Windows if you want to build the real installer (`npm run make` uses Squirrel)

```bash
cd desktop
npm install
npm start
```

Production-ish build:

```bash
npm run make
```

Output lands under `out/make/squirrel.windows/x64/` — `AniVaultUnvaultedSetup.exe`, `*-full.nupkg`, `RELEASES`, `latest.yml`, etc.

If `make` complains about **EPERM** on `anivault-unvaulted.exe`, close the running app and try again; `npm run make:clean` clears `out/` first if you want a cold build.

---

## Cutting a release (maintainers)

From repo root (PowerShell), with a **new** semver:

`.\scripts\release-desktop.ps1 3.3.2`

That sets `desktop/package.json`, commits, pushes `main`, creates **`v3.3.2`**, and pushes the tag. GitHub Actions (**Windows installer release**) builds and uploads **`AniVaultUnvaultedSetup.exe`** plus updater files to the release.

Or manually: bump `desktop/package.json` → commit → push → `git tag vX.Y.Z && git push origin vX.Y.Z`.

**Re-run without a new tag:** Actions → **Windows installer release** → **Run workflow** on `main` — uploads assets for whatever version is already in `desktop/package.json`.

---

Repo-wide notes for contributors: [`CONTRIBUTING.md`](../CONTRIBUTING.md).

---

## Scripts (the ones people actually use)

| Command | What it does |
|--------|----------------|
| `npm start` | Dev with hot reload |
| `npm test` | Vitest |
| `npm run make` | Installer assets + Squirrel build |
| `npm run clean` | Delete `out/` |
| `npm run make:clean` | `clean` then `make` |
| `npm run publish` | Forge publish (needs `GITHUB_TOKEN` locally; CI uses the repo token) |
