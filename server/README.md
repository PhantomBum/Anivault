# AniVault API server

Fastify + SQLite (`data/anivault.sqlite`).

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Listen port (default `3847`) |
| `JWT_SECRET` | Secret for signing auth tokens (change in production) |
| `PUBLIC_BASE_URL` | Public origin for gallery image URLs and Stripe return URLs (default `http://127.0.0.1:${PORT}`) |
| `STRIPE_SECRET_KEY` | Stripe secret API key; if unset, billing checkout is disabled |
| `STRIPE_PRICE_PRO` | Stripe Price ID for the Pro subscription (e.g. `price_...`) |
| `PRO_GRANT_EMAILS` | Comma-separated emails that always receive `plan: pro` in the database (default includes the project grant list) |
| `DEEPL_API_KEY` | Optional; enables `/api/translate` for Pro users |

Example `.env`:

```env
PORT=3847
JWT_SECRET=change-me
PUBLIC_BASE_URL=http://127.0.0.1:3847
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_PRO=price_...
PRO_GRANT_EMAILS=you@example.com
```
