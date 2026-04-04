# AniVault Unvaulted (desktop)

Electron + Vite. The interesting bit is the bridge to **ani-cli** for streams; the rest is layout, settings, watch UI, and the usual desktop glue.

## Install (you’re not cloning this)

[Releases](https://github.com/PhantomBum/Anivault/releases/latest) → download **`AniVaultUnvaultedSetup.exe`** → run it. Squirrel install; no Node on your machine required.

Changelog: repo root [`UPDATE-LOGS.txt`](../UPDATE-LOGS.txt) (also surfaced in the app).

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

1. Bump `version` in `package.json` (must match the tag you’re about to ship).
2. Commit and push `main`.
3. Tag and push, e.g. `git tag v1.2.4 && git push origin v1.2.4`

Or from repo root: `.\scripts\release-desktop.ps1 1.2.4` (PowerShell). CI workflow: [`.github/workflows/release-desktop.yml`](../.github/workflows/release-desktop.yml).

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
