# AniVault

Watch anime anytime, anywhere — straight from your desktop.

## Download the Windows app

Installers are **not** checked into this repo (build output is in `.gitignore`). Get the latest **AniVaultSetup.exe** and update files from **[GitHub Releases](https://github.com/PhantomBum/Anivault/releases)**.

Monorepo layout:

| Path | Description |
|------|-------------|
| [`desktop/`](desktop/) | **Electron desktop app** (AniVault). See its [README](desktop/README.md) for dev, build, and **GitHub auto-update** setup. |
| [`landing/`](landing/) | Optional Next.js marketing site (points at this repo’s releases). |
| [`server/`](server/) | Optional Fastify API (auth, gallery, billing). See [server/README.md](server/README.md). |

## Desktop: releases and auto-update

GitHub Actions workflow: [`.github/workflows/release-desktop.yml`](.github/workflows/release-desktop.yml)  
Full instructions: [desktop/README.md](desktop/README.md).

## Auto-push after each commit (optional)

This repo includes a **post-commit** hook that runs `git push origin <current-branch>` so changes reach GitHub immediately after you commit.

**One-time setup** (per clone):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-git-hooks.ps1
```

Or manually: `git config core.hooksPath .githooks`

To turn it off: `git config --unset core.hooksPath`

If a push fails (offline, auth), fix the issue and run `git push` yourself; your commit is already saved locally.
