# Offline downloads (spike / phase 18)

This document scopes a future **download manager** — not shipped as a full feature in this build.

**In-app today:** Settings → Data → Offline downloads enables a **persisted queue** and a **folder path**. The watch page can **Save for offline**, which resolves the same stream URL as playback and, when the URL is a **single progressive file** (not HLS), streams it to disk in the chosen folder. **HLS (.m3u8)** sources are marked failed until a playlist/transmux pipeline exists. One download runs at a time; see the queue list under Settings → Data.

## Goals (future)

- Queue episodes with explicit user action (no silent mass downloading).
- Disk quota and folder picker (Electron `dialog`, writable path).
- Progress, pause/resume, and failure retry.
- Clear separation from streaming (HLS/DASH or progressive) depending on what ani-cli exposes.

## Legal / product

- Users must comply with source site terms and local law; the app should surface a short disclaimer before first use.
- Default: feature **off** until enabled in settings.

## Technical notes

- Likely involves a main-process worker + stream-to-file or invoking external tooling; memory impact must stay bounded (one active transmux at a time or similar).
