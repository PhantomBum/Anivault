# AniVault (desktop)

Electron app + **ani-cli** for streaming.

## Install (most people)

You do **not** need Node or this folder on disk.

1. Go to **[github.com/PhantomBum/Anivault/releases](https://github.com/PhantomBum/Anivault/releases)**.
2. Download **`AniVaultSetup.exe`** from the latest release (**Assets**).
3. Run it and launch **AniVault**.

**Updates:** *Settings → Check for updates*, or grab a newer `AniVaultSetup.exe` from Releases.

---

## Build from source (developers)

**Needs:** Node.js 20+, npm, Windows (for the Squirrel installer).

```bash
cd desktop
npm install
npm start          # development
npm run make       # installer → desktop/out/make/squirrel.windows/x64/AniVaultSetup.exe
```

If `make` fails with **EPERM** on `anivault.exe`, quit AniVault (and close Explorer on `out\`), then:

```bash
npm run make:clean
```

---

## Publish a new release (maintainers)

1. Bump **`version`** in `package.json` (must match the tag, e.g. `1.0.0-alpha.2`).
2. Commit and push to `main`.
3. Tag and push (CI builds Windows artifacts and uploads to Releases):

```bash
git tag v1.0.0-alpha.2
git push origin v1.0.0-alpha.2
```

Tag = `v` + the same version string as in `package.json`. Workflow: [`.github/workflows/release-desktop.yml`](../.github/workflows/release-desktop.yml).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev |
| `npm run make` | Build installer |
| `npm run clean` | Delete `out/` |
| `npm run make:clean` | `clean` then `make` |
| `npm run publish` | Build + upload to GitHub (needs `GITHUB_TOKEN` locally; CI uses the repo token) |
