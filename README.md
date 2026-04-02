# AniVault

Desktop anime streaming (Windows).

## Install (Windows)

1. Open **[Releases](https://github.com/PhantomBum/Anivault/releases)**.
2. Under **Assets**, download **`AniVaultSetup.exe`** (latest release).
3. Run the installer and start **AniVault** from the Start menu or desktop shortcut.

Updates: use **Settings → Check for updates** in the app, or install a newer release from the same Releases page.

---

## Repository layout

| Folder | What it is |
|--------|------------|
| [`desktop/`](desktop/) | Windows app (Electron). Build from source: [desktop/README.md](desktop/README.md) |
| [`landing/`](landing/) | Optional marketing site |
| [`server/`](server/) | Optional API |

Maintainers: releases are built by [GitHub Actions](.github/workflows/release-desktop.yml) when a version tag is pushed. Details live in [desktop/README.md](desktop/README.md).
