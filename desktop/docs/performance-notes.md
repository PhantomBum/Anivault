# Performance notes (renderer & main)

Use this as a living checklist when profiling or before a milestone release.

## Renderer

- **Route code splitting**: pages are lazy-loaded in `app.tsx`; avoid importing heavy modules from the shell layout.
- **Long lists**: prefer `react-window` (`FixedSizeList` / `VariableSizeList`) for search and lists; keep row components stable (memoized where it helps) and keys stable.
- **Images**: use `loading="lazy"` and explicit dimensions where possible; thumbnail fetches use bounded concurrency (`fetch-show-thumbnails`, session cache).
- **React Query / cache**: `ani-session-cache` dedupes ani-cli calls; avoid duplicate fetches between Details and Watch when the same show/episodes are needed.
- **Scroll**: main column scroll positions are restored per route via `sessionStorage` in `sidebar-layout.tsx` (Discover / Search long lists benefit when navigating back).

## Main / IPC

- **Hot paths**: stream URL resolution, ani-cli subprocess calls, and offline download progress should stay bounded (timeouts, limited parallelism, throttled progress events).
- **Payload size**: keep IPC messages small; stream progress as deltas or throttled ticks, not full buffers.

## Build

- Run a production **bundle analysis** (e.g. Vite rollup visualizer) when adding large dependencies or new heavy pages.
- Track Electron/Chromium upgrades per `electron-upgrade-cadence.md` when present.
