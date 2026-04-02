# AniVault

**[Download AniVault for Windows](https://github.com/PhantomBum/Anivault/releases)** → get **`AniVaultSetup.exe`** under **Assets** → run it. Nothing else is required (no Node, no cloning this repo).

- **Quick steps:** [GET-ANIVAULT.txt](GET-ANIVAULT.txt)
- **Paths & build output:** [START-ANIVAULT.txt](START-ANIVAULT.txt)
- **What changed each version:** [UPDATE-LOGS.txt](UPDATE-LOGS.txt)

The rest of this repository is **source code** for developers. If you only want to use the app, use **Releases** only.

---

## Repository layout (for contributors)

| Folder | Purpose |
|--------|---------|
| [desktop/](desktop/) | Windows app source |
| [landing/](landing/) | Optional site |
| [server/](server/) | Optional API |

Releases are built in CI when a version tag is pushed ([workflow](.github/workflows/release-desktop.yml)).
