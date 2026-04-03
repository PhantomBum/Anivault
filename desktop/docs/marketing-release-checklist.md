# Marketing / polish release (phase 30)

Lightweight checklist for a public or GitHub Release announcement—no substitute for QA.

## Copy & positioning

- [ ] One-line pitch: *AniVault Unvaulted — desktop anime streaming with ani-cli sources, local lists, and optional companion AniVault server.*
- [ ] “What it is / isn’t”: streams depend on third-party sources; not a licensor service.
- [ ] Requirements: Windows build; ani-cli / Git Bash expectations documented in README if applicable.

## Assets

- [ ] App icon and window title consistent (`ProductName` / `AniVault Unvaulted`).
- [ ] Screenshots: Home, Discover grid, Watch (optional), Settings (optional)—store under `docs/` or repo wiki if desired.

## Distribution

- [ ] Version in `package.json` matches tag (e.g. `1.0.0` for stable / Unvaulted line).
- [ ] GitHub Release: attach `latest.yml` + installers when using electron-updater.
- [ ] Changelog snippet: link to `src/renderer/data/update-logs.txt` or duplicate highlights.

## Post-release

- [ ] Monitor crash reports / feedback channel (Issues).
- [ ] Note known limitations (downloads spike, telemetry opt-in dev-only logging, etc.).
