# AniVault (desktop)

Electron + React desktop app for streaming via **ani-cli**. This package is the shipped **AniVault** UI.

## Download (Windows)

Built binaries (`AniVaultSetup.exe`, `latest.yml`, nupkg, etc.) are **not** stored in GitHub’s source tree; they are attached to **[Releases](https://github.com/PhantomBum/Anivault/releases)** after each tagged build. CI publishes them when you push a version tag (see below).

Pick the latest release and download **`AniVaultSetup.exe`** (Squirrel installer under *Assets*).

## Requirements

- **Node.js** 20+
- **npm**
- **Windows** (for Squirrel installers / this workflow)

## Development

```bash
cd desktop
npm install
npm start
```

## Build locally

```bash
npm run make
```

### `EPERM` / `unlink anivault.exe` during `make`

Windows locks the exe if **AniVault is still running**, Explorer is focused on `out\`, or antivirus is scanning it.

1. Quit the app (Task Manager → end **anivault.exe** if needed).
2. Run `npm run clean` (deletes `out/`), then `npm run make` again — or one step: `npm run make:clean`.

Artifacts (Windows Squirrel):

- `out/make/squirrel.windows/x64/AniVaultSetup.exe`
- `out/make/squirrel.windows/x64/*.nupkg`, `RELEASES`
- After `make`, a **`latest.yml`** is generated next to `*-full.nupkg` (for **electron-updater**)

`npm run package` only bundles the app; `npm run make` produces installers and update payloads.

---

## One-time: GitHub repository

1. On [github.com/new](https://github.com/new), create a repository (empty, no README required), e.g. `yourname/anivault`.
2. In **`package.json`**, set **`repository.url`** to that repo:

   `"url": "https://github.com/YOUR_USER/YOUR_REPO.git"`

3. From your machine (monorepo root), connect and push:

   ```bash
   cd /path/to/anivault
   git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

4. **Releases from your PC:** install deps in `desktop/`, bump `version` in `package.json`, set `GITHUB_TOKEN` (classic PAT with **repo** scope), then `npm run publish` — uploads installers to a GitHub Release.

5. **Releases from GitHub Actions (no token on your PC):** bump `version`, commit, then tag and push the tag. Workflow [`.github/workflows/release-desktop.yml`](../../.github/workflows/release-desktop.yml) runs `npm run publish` on Windows using the built-in `GITHUB_TOKEN`.

   ```bash
   git tag v1.0.0-alpha.2
   git push origin v1.0.0-alpha.2
   ```

   The tag **must** match the app version pattern you use (e.g. `v` + SemVer from `package.json`).

The app reads owner/repo from `repository.url` (and Actions uses `GITHUB_REPOSITORY` automatically).

---

## Auto-updates (electron-updater + GitHub Releases)

The packaged app uses **electron-updater** with the **GitHub** provider. It downloads update metadata from:

`https://github.com/<owner>/<repo>/releases/download/<tag>/latest.yml`

So each **release** must include:

- Squirrel artifacts from `npm run make` / CI (including **`latest.yml`**, generated automatically by the Forge `postMake` hook in this repo)
- Tag name should match **`package.json` `version`** (e.g. tag `v1.0.1` for version `1.0.1`)

### Optional environment variables (installed app)

| Variable | Purpose |
|----------|---------|
| `ANIVAULT_GITHUB_OWNER` | Override GitHub owner (rare) |
| `ANIVAULT_GITHUB_REPO` | Override repo name (rare) |
| `ANIVAULT_AUTO_UPDATE` | Set to `1` to enable **background** check/download on a timer |

If `ANIVAULT_AUTO_UPDATE` is unset, the app still supports **Settings → Check for updates** (manual).

### Publish from your machine

Needs a GitHub token with **`contents: write`** (and release upload). Do **not** commit the token.

```powershell
cd desktop
# bump version in package.json first
$env:GITHUB_TOKEN = "ghp_xxxxxxxx"
npm run publish
```

`publish` runs `make` and uploads to a **GitHub Release** using `@electron-forge/publisher-github`.

### Publish with GitHub Actions (recommended)

This repo includes [`.github/workflows/release-desktop.yml`](../../.github/workflows/release-desktop.yml).

1. Bump **`package.json` `version`** (must match the tag you will push).
2. Commit and push to `main` (or your default branch).
3. Create and push a tag:

   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

4. The workflow runs on **Windows**, executes `npm ci` and `npm run publish`, and uses the built-in **`GITHUB_TOKEN`** to attach assets to a release.

**Monorepo layout:** the workflow uses `working-directory: desktop`. If your repository is **only** the desktop app at the repo root, edit the workflow and set `working-directory` to **`.`** in both the `defaults.run` block and `cache-dependency-path`.

### If you see `latest.yml` / 404

- **No release yet:** first publish must complete so the release contains `latest.yml` and nupkg files.
- **Wrong owner/repo:** fix `package.json` → `repository.url` and rebuild.
- **Tag vs version:** keep SemVer in `package.json` aligned with Git tags (e.g. `v1.0.0-alpha`).

References: [Electron Forge — GitHub publisher](https://www.electronforge.io/config/publishers/github), [electron-updater](https://www.electron.build/auto-update).

---

## “Refresh” vs updates

- Reloading the window does **not** install a new binary.
- After an update downloads, use **Restart and update** to apply it.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev: Vite + Electron |
| `npm run package` | Package without full installers |
| `npm run make` | Platform installers + `latest.yml` hook |
| `npm run clean` | Delete `out/` (fixes locked-exe errors before rebuild) |
| `npm run make:clean` | `clean` then `make` |
| `npm run publish` | Make + upload to GitHub Releases (`GITHUB_TOKEN`) |
| `npm run lint` | ESLint |

## License

See repository root `LICENSE` if present.
