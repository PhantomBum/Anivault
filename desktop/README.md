# AniVault Unvaulted (desktop)

Electron app using **ani-cli** for playback — **stable (1.0.0+)** line, branded **AniVault Unvaulted** (formerly alpha “AniVault” builds).

**Positioning:** AniVault Unvaulted is a **desktop client** for titles resolved through ani-cli sources—local watchlists, optional companion AniVault server features (account, social), calendar, and a focused watch UI. It is **not** a licensed subscription service; availability depends on upstream providers.

## Install

**[GitHub Releases](https://github.com/PhantomBum/Anivault/releases)** → **AniVaultUnvaultedSetup.exe** → run. No clone or Node required for installs.

Changelog: [UPDATE-LOGS.txt](../UPDATE-LOGS.txt) (bundled copy in Settings → Updates).

---

## Development

Node.js 20+, npm, Windows (for Squirrel `npm run make`).

```bash
cd desktop
npm install
npm start
npm run make   # → out/make/squirrel.windows/x64/AniVaultUnvaultedSetup.exe (+ latest.yml)
```

If `make` fails with **EPERM** on `anivault-unvaulted.exe`, quit the app, then `npm run make:clean`.

---

## Release (maintainers)

1. Bump **`version`** in `package.json` (must match the Git tag).
2. Commit and push `main`.
3. Tag and push:

```bash
git tag v1.0.0
git push origin v1.0.0
```

See [`.github/workflows/release-desktop.yml`](../.github/workflows/release-desktop.yml).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev |
| `npm test` | Unit tests (Vitest) |
| `npm run make` | Build installer |
| `npm run clean` | Remove `out/` |
| `npm run make:clean` | `clean` then `make` |
| `npm run publish` | Build + upload (local `GITHUB_TOKEN`; CI uses the repo token) |
