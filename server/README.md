# Server (`server/`)

Optional **Fastify** API with **SQLite** (`data/anivault.sqlite` by default). The Windows client can run fine without this; it’s for account/social-style features if you wire them up.

## Run locally

```bash
cd server
npm install
npm start
```

Port defaults to **3847** unless you override `PORT`.

## Environment

| Variable | What it’s for |
|----------|----------------|
| `PORT` | Listen port (default `3847`) |
| `JWT_SECRET` | Signs auth tokens — **change this** if you expose the API |
| `PUBLIC_BASE_URL` | Public origin for gallery image URLs and Stripe return URLs (default `http://127.0.0.1:${PORT}`) |
| `STRIPE_SECRET_KEY` | Stripe secret; if unset, billing checkout stays off |
| `STRIPE_PRICE_PRO` | Stripe Price ID for Pro (e.g. `price_...`) |
| `PRO_GRANT_EMAILS` | Comma-separated emails that always get `plan: pro` in the DB |
| `DEEPL_API_KEY` | Optional; enables `/api/translate` for Pro |

Example `.env`:

```env
PORT=3847
JWT_SECRET=change-me
PUBLIC_BASE_URL=http://127.0.0.1:3847
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_PRO=price_...
PRO_GRANT_EMAILS=you@example.com
```

Don’t commit real secrets. This repo expects you to keep `.env` local.
