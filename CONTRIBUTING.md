# Contributing

Thanks for bothering. This repo is a bit split—most people only touch **`desktop/`**.

## Before you spend a lot of time

- **Bugs:** check [Issues](https://github.com/PhantomBum/Anivault/issues) and [`UPDATE-LOGS.txt`](UPDATE-LOGS.txt) so we’re not duplicating something already fixed or known upstream (ani-cli changes break things sometimes).
- **Feature ideas:** open an issue first if it’s big; small fixes can go straight to a PR.

## Desktop app

- **Node 20+**, **npm**. On Windows you can build the real installer; on macOS/Linux you can still run the Electron app in dev, but Squirrel builds are Windows-only here.

```bash
cd desktop
npm install
npm start
```

Tests: `npm test`. Lint: `npm run lint` (it can be noisy—don’t feel obligated to fix unrelated files in a small PR).

## Optional server

See [`server/README.md`](server/README.md). SQLite file ends up under `data/` by default.

## Pull requests

- One topic per PR when possible.
- Say *what* you changed and *why* in the description—no need for an essay.
- If you’re touching user-visible copy, skim the tone in the existing UI so it doesn’t read like a press release.

## Conduct

Don’t be a jerk. That’s the whole policy.
