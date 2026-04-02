# AniVault (desktop)

Electron app using **ani-cli** for playback.

## Install

**[GitHub Releases](https://github.com/PhantomBum/Anivault/releases)** → **AniVaultSetup.exe** → run. No clone or Node required for installs.

Changelog: [UPDATE-LOGS.txt](../UPDATE-LOGS.txt) (bundled copy in Settings → Updates).

---

## Development

Node.js 20+, npm, Windows (for NSIS `npm run make`).

```bash
cd desktop
npm install
npm start
npm run make   # → out/make/nsis/x64/AniVaultSetup.exe (+ latest.yml)
```

If `make` fails with **EPERM** on `anivault.exe`, quit the app, then `npm run make:clean`.

---

## Release (maintainers)

1. Bump **`version`** in `package.json` (must match the Git tag).
2. Commit and push `main`.
3. Tag and push:

```bash
git tag v1.0.0-alpha.1
git push origin v1.0.0-alpha.1
```

See [`.github/workflows/release-desktop.yml`](../.github/workflows/release-desktop.yml).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev |
| `npm run make` | Build installer |
| `npm run clean` | Remove `out/` |
| `npm run make:clean` | `clean` then `make` |
| `npm run publish` | Build + upload (local `GITHUB_TOKEN`; CI uses the repo token) |
