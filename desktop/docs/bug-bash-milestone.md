# Bug bash milestone (phase 27)

Use this checklist before tagging a release candidate. Adjust depth to match risk (pre-release vs stable **AniVault Unvaulted** builds).

## Smoke (15–20 min)

- [ ] Cold start: app opens, no blank shell, sidebar navigates (Home, Discover, Search, Lists, Calendar, Settings, Coming soon routes).
- [ ] Watch: open a series from Discover → details → play → video starts, keyboard shortcuts (space, arrows) work; **breadcrumb** and **copy watch link**; paste/open link loads the episode.
- [ ] Mini-player: start playback, navigate away; mini bar appears, resume from mini works; **Ctrl+Shift+P** → Resume watch / Scroll to player when available.
- [ ] Settings: change volume, shell preset, density; “Saved” appears; Find in settings jumps to anchors; **Privacy** and **Shortcuts** tabs open; **Alt+,** cycles tabs.
- [ ] Command palette (**Ctrl+Shift+P**): navigate to a Settings sub-tab; **Copy diagnostics** succeeds.
- [ ] Account / sign-in (if API available): no uncaught errors in devtools console.

## Data & privacy

- [ ] Mature filter: with 18+ off, explicit grids hide; toggle on in Settings → Appearance shows content.
- [ ] Local watchlist: export JSON, import, duplicate IDs rejected; context “Add to My lists” matches `/lists`; **bulk select** + remove selected.

## Platform

- [ ] Windows: stream proxy playback, window drag, fullscreen.
- [ ] Optional: macOS/Linux parity if you ship those artifacts.

## Regression targets

- [ ] Recent: continue row, recently watched, schedule (AniList or fallback).
- [ ] Search: grid + virtual list when many results; filters do not crash.

## Exit criteria

- [ ] No P0/P1 crashes in the flows above.
- [ ] Known P2 issues logged with repro steps.

File issues with: OS build, app version (`Settings → Updates`), and short console excerpt if relevant.

## Stretch backlog (not blocking RC)

- Offline download manager / HLS: see `downloads-spike.md`.
- Provider skip markers: see `post-slice-backlog.md`.
