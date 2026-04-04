# AniVault Unvaulted

Windows desktop app for watching anime in one place. Playback goes through **ani-cli** under the hood—think “a proper UI on top of the same sources people already use in a terminal,” not a new streaming service with a license to every show.

**[Download the latest installer](https://github.com/PhantomBum/Anivault/releases/latest)** — grab `AniVaultUnvaultedSetup.exe` from the release assets (not the “Source code” zips). If there’s no `.exe` yet, that release didn’t finish building; try the previous tag or check [Actions](https://github.com/PhantomBum/Anivault/actions) for a failed run.

What actually ships is built when someone pushes a version tag; see `scripts/release-desktop.ps1` and `.github/workflows/release-desktop.yml`. Forks don’t get installers until their own CI runs.

---

**What’s in this repo**

- **`desktop/`** — the Electron app. That’s the thing you install.
- **`server/`** — optional Fastify API + SQLite if you want account/social-style features behind the client. You can ignore it if you only care about local use.
- **`landing/`** — small static site; optional.

Changelog (high level): [`UPDATE-LOGS.txt`](UPDATE-LOGS.txt). The app also bundles a copy under Settings → Updates.

---

**From source**

You need Node (20+ is fine), npm, and a Windows machine if you want to run `npm run make` and get a Squirrel installer. Everything worth knowing for day-to-day dev lives in [`desktop/README.md`](desktop/README.md).

---

**Heads-up**

Availability of titles depends on ani-cli and what it can resolve; this project doesn’t host video. If something breaks after an upstream change, that’s usually where to look first.
