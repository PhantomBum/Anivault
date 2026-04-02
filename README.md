# AniVault

Watch anime anytime, anywhere — straight from your desktop.

Monorepo layout:

| Path | Description |
|------|-------------|
| [`desktop/`](desktop/) | **Electron desktop app** (AniVault). See its [README](desktop/README.md) for dev, build, and **GitHub auto-update** setup. |
| [`server/`](server/) | Optional Fastify API (auth, gallery, billing). See [server/README.md](server/README.md). |

## Desktop: releases and auto-update

GitHub Actions workflow: [`.github/workflows/release-desktop.yml`](.github/workflows/release-desktop.yml)  
Full instructions: [desktop/README.md](desktop/README.md).
