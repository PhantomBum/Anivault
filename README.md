# AniVault

Watch anime anytime, anywhere — straight from your desktop.
Open sourced from open anime.

Monorepo layout:

| Path | Description |
|------|-------------|
| [`desktop/`](desktop/) | **Electron desktop app** (AniVault). See its [README](desktop/README.md) for dev, build, and **GitHub auto-update** setup. |
| [`landing/`](landing/) | Optional Next.js marketing site (points at this repo’s releases). |
| [`server/`](server/) | Optional Fastify API (auth, gallery, billing). See [server/README.md](server/README.md). |

## Desktop: releases and auto-update

GitHub Actions workflow: [`.github/workflows/release-desktop.yml`](.github/workflows/release-desktop.yml)  
Full instructions: [desktop/README.md](desktop/README.md).
