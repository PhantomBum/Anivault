# AniVault Unvaulted — release 2.x checklist

This file separates **what shipped in code** from **what is still roadmap**, so “2.0” is honest and testable.

## 2.0.1 — Community hub & browse (shipped)

| # | Item | Status |
|---|------|--------|
| 1 | Route **`#/community`** → `CommunityPage` (servers list, report flow via companion API) | Done |
| 2 | Route **`#/gallery`** → `GalleryPage` (art, clips tab, upload, mod queue) | Done |
| 3 | Route **`#/clips`** → `ClipsPage` → gallery with Clips tab selected | Done |
| 4 | Route **`#/browse`** → `BrowsePage` (dense catalog grid; no longer redirect-only) | Done |
| 5 | Sidebar section **Community hub** (replaces “Coming soon” label) | Done |
| 6 | **`en_US` / `pt_BR`** route subtitles for community / gallery / clips / browse | Done |
| 7 | Command palette: **Community**, **Gallery**, **Clips**, **Browse catalog** | Done |
| 8 | Remove palette “placeholder” disabled row for community | Done |

## 2.0.0 — Platform & changelog (shipped earlier)

| # | Item | Status |
|---|------|--------|
| 1 | Packaged startup: **no CSP meta** blocking `anivault://` scripts | Done |
| 2 | **`anivault://`** protocol + privileged scheme for renderer assets | Done |
| 3 | Windows **Squirrel** installer + updater artifacts on releases | Done |
| 4 | Bundled **update log** (Settings → Updates) with milestone narrative | Done |

## 2.0.2 — Local threads + watch capture (shipped)

| # | Item | Status |
|---|------|--------|
| 1 | **Local threads** on Community — per-space (General + each API server), replies, delete; `localStorage` only | Done |
| 2 | Watch: **Save frame** (PNG download) + **Record 10s clip** (WebM download, experimental) | Done |

## Still roadmap (not promised as “done” in 2.0.x)

| # | Item | Notes |
|---|------|--------|
| R1 | **Server-synced** threads (moderation, accounts) | Local threads ship in 2.0.2; API-backed sync is follow-up |
| R2 | **Trim / export** clip editor, upload to Gallery from Watch | Raw WebM + PNG only; gallery upload remains separate flow |
| R3 | Full **Crunchyroll-style** social graph | Out of scope; companion API is optional |
| R4 | **Offline downloads** beyond experimental queue (e.g. HLS transmux) | Documented limits in Settings → Data; queue + retry already in app |

## Verify before tagging

- [ ] **`#/community`** renders (or shows API error with setup hint, not blank).
- [ ] **`#/gallery`** tabs: Art / Clips / Upload (when signed in) / Queue (moderator).
- [ ] **`#/clips`** lands on Clips tab.
- [ ] **`#/browse`** shows grid (may take a moment while probes run).
- [ ] Sidebar **Community hub** three links match those routes.
- [ ] **Ctrl+Shift+P** lists Community, Gallery, Clips, Browse catalog and navigates.
