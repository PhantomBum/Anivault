# AniVault Unvaulted

Windows desktop app for watching anime in one place. Playback goes through **ani-cli** under the hood—think “a proper UI on top of the same sources people already use in a terminal,” not a new streaming service with a license to every show.

**[Download the latest installer](https://github.com/PhantomBum/Anivault/releases/latest)** — grab `AniVaultUnvaultedSetup.exe` from the release assets (not the “Source code” zips). 

---

**What’s in this repo**

- **`desktop/`** — the Electron app. That’s the thing you install.
- **`server/`** — optional Fastify API + SQLite if you want account/social-style features behind the client. You can ignore it if you only care about local use.
- **`landing/`** — small static site; optional.

Changelog: [`UPDATE-LOGS.txt`](UPDATE-LOGS.txt). The app also bundles a copy under Settings → Updates.
