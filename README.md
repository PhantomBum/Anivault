# AniVault

Desktop anime streaming (Windows).

## Install (Windows)

1. Open **[Releases](https://github.com/PhantomBum/Anivault/releases)**.
2. Under **Assets**, download **`AniVaultSetup.exe`** (latest release).
3. Run the installer and start **AniVault** from the Start menu or desktop shortcut.

Updates: use **Settings → Check for updates** in the app, or install a newer release from the same Releases page.

**About file size:** The installer is usually **~120–150 MB**. That’s normal for Electron (it ships a full Chromium browser). [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) allows large assets (up to **2 GB** per file), so you can attach `AniVaultSetup.exe` without a problem.

---

## Repository layout

| Folder | What it is |
|--------|------------|
| [`desktop/`](desktop/) | Windows app (Electron). Build from source: [desktop/README.md](desktop/README.md) |
| [`landing/`](landing/) | Optional marketing site |
| [`server/`](server/) | Optional API |

Maintainers: releases are built by [GitHub Actions](.github/workflows/release-desktop.yml) when a version tag is pushed. Details live in [desktop/README.md](desktop/README.md).
