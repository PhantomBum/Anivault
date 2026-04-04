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

## 2.0.3 — Remaining roadmap items (shipped)

| # | Item | Status |
|---|------|--------|
| 1 | **R1 (partial):** Thread **export / import (merge | replace)** JSON — backup & migration without a server | Done |
| 2 | **R2 (partial):** **Submit frame to gallery** from Watch; **clip duration** 5 / 10 / 30s; Gallery **`?tab=`** deep link | Done |
| 3 | **R4 (partial):** **Unencrypted HLS** → concat **`.ts`** for offline queue (AES / DRM still fail) | Done |
| 4 | **R3** Full social graph | Still out of scope |

## 2.0.4 — 62-item catalog + palette parity (shipped)

| # | Item | Status |
|---|------|--------|
| 1 | Bundled **`update-logs.txt`** includes **numbered 01–62** verified capability list (single audit view for 2.0.x) | Done |
| 2 | **Command palette** group **Tools & account:** Request a show, Legal / terms, Account (`en_US` / `pt_BR`) | Done |

## Still roadmap (future)

| # | Item | Notes |
|---|------|--------|
| R1 | **Server-synced** threads (API persistence + moderation) | Needs companion server implementation |
| R2 | **In-browser trim** of recorded WebM, or **upload WebM** to gallery | Frame + API image upload only today |
| R3 | Full **Crunchyroll-style** social graph | Out of scope unless product scope changes |
| R4 | **HLS AES** decryption / **transmux** to MP4 | Would require ffmpeg or keys; not in app |

## Verify before tagging

- [ ] **`#/community`** renders (or shows API error with setup hint, not blank).
- [ ] **`#/gallery`** tabs: Art / Clips / Upload (when signed in) / Queue (moderator).
- [ ] **`#/clips`** lands on Clips tab.
- [ ] **`#/browse`** shows grid (may take a moment while probes run).
- [ ] Sidebar **Community hub** three links match those routes.
- [ ] **Ctrl+Shift+P** lists Community, Gallery, Clips, Browse catalog and navigates.
