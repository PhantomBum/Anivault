# Post–vertical-slice backlog (phases 15–30)

Follow-on epics after Release 1 (shell, mature gating, resume row, prefetch, settings tabs, account/ToS touch-ups). Order by dependency.

**Status (Unvaulted / `main`):** Phases **15–30** are **implemented to the intended shippable scope** for this product line. A few rows below note **stretch** items that depend on upstream metadata or heavy infra (not blocking “phase complete” for the desktop app).

| Phase | Focus | Notes |
| ----- | ----- | ----- |
| 15 | Deep settings IA — **Find in settings** + anchor IDs + **Data** tab | Done |
| 16 | Calendar rework — grouped by day, local times, loading | Done |
| 17 | Lists — **Export / Import JSON**, **Copy TSV** | Done |
| 18 | Offline downloads — queue, folder, progressive file save | **Stretch:** HLS playlist/transmux, pause/resume, disk quota (see `downloads-spike.md`) |
| 19 | Server ping — **`testAnivaultServerConnection()`** + **Test connection** | Done |
| 20 | Virtualization + merged thumbnails on long lists | Done |
| 21 | i18n sweep | Done (en-US, pt-BR for key surfaces) |
| 22 | Accessibility — focus, contrast, `prefers-reduced-motion` | Done |
| 23 | Opt-in telemetry + optional HTTPS POST | Done |
| 24 | Skip intro + episode “chapters” | **Stretch:** provider-native HLS chapter markers when ani-cli exposes them; app uses user-tuned skip + episode list |
| 25 | Context menus — lists, copy URL where safe | Done |
| 26 | Micro-animations (motion-safe) | Done |
| 27 | Bug bash checklist doc | Done |
| 28 | Electron upgrade cadence doc | Done |
| 29 | Stream resolver / provider contract tests (Vitest) | Done |
| 30 | Marketing / release checklist doc | Done |
