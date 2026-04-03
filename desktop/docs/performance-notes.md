# Performance notes (renderer & main)

Use this as a living checklist when profiling or before a milestone release.

## Renderer

- **Route code splitting**: pages are lazy-loaded in `app.tsx`; avoid importing heavy modules from the shell layout.
- **Long lists**: prefer `react-window` (`FixedSizeList` / `VariableSizeList`) for search and lists; keep row components stable (memoized where it helps) and keys stable.
- **Images**: use `loading="lazy"` and explicit dimensions where possible; thumbnail fetches use bounded concurrency (`fetch-show-thumbnails`, session cache).
- **React Query / cache**: `ani-session-cache` dedupes ani-cli calls and **coalesces in-flight** `getShowDetails` / episode-list requests so Details + Watch opening the same show share one IPC round-trip.
- **Scroll**: main column scroll positions are restored per route via `sessionStorage` in `sidebar-layout.tsx` (Discover / Search long lists benefit when navigating back).
- **Dialogs**: Radix `Dialog` modal focus trap; `DialogContent` supports `showCloseButton={false}` for update/command surfaces so the hidden corner close control does not steal focus from footer buttons.

## Main / IPC

- **Hot paths**: stream URL resolution, ani-cli subprocess calls, and offline download progress should stay bounded (timeouts, limited parallelism, throttled progress events).
- **Payload size**: keep IPC messages small; stream progress as deltas or throttled ticks, not full buffers.

## Build

- **Vendor chunks**: renderer build uses Rollup `manualChunks` for `vendor-react`, `vendor-router`, and `vendor-i18n` to improve caching across app updates (`vite.renderer.config.ts`).
- Run a production **bundle analysis** (e.g. Vite rollup visualizer) when adding large dependencies or new heavy pages.
- Track Electron/Chromium upgrades per `electron-upgrade-cadence.md` when present.
